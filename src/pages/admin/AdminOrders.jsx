import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ordersAPI, adminAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token, user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (token && user?.role === 'admin') {
      loadOrders();
    }
  }, [token, user]);

  const loadOrders = async () => {
    if (!token) return;
    try {
      // Use admin endpoint to get ALL orders
      const data = await adminAPI.getAllOrders(token);
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Failed to load orders:', error);
      toast({
        title: 'Error',
        description: 'Failed to load orders',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await ordersAPI.updateStatus(orderId, newStatus, token);
      toast({
        title: 'Success',
        description: 'Order status updated successfully',
      });
      // Reload orders to reflect changes
      await loadOrders();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update order status',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':
        return 'text-green-600 bg-green-50';
      case 'on_the_way':
        return 'text-blue-600 bg-blue-50';
      case 'picked_up':
        return 'text-blue-500 bg-blue-50';
      case 'agent_assigned':
        return 'text-cyan-600 bg-cyan-50';
      case 'waiting_for_agent':
        return 'text-yellow-500 bg-yellow-50';
      case 'local_station':
        return 'text-orange-500 bg-orange-50';
      case 'regional_transit':
        return 'text-purple-600 bg-purple-50';
      case 'fulfillment_processing':
        return 'text-indigo-600 bg-indigo-50';
      case 'order_placed':
        return 'text-gray-600 bg-gray-50';
      case 'cancelled':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      'order_placed': 'Order Placed',
      'fulfillment_processing': 'Processing',
      'regional_transit': 'In Transit (Regional)',
      'local_station': 'At Local Station',
      'waiting_for_agent': 'Awaiting Agent',
      'agent_assigned': 'Agent Assigned',
      'picked_up': 'Picked Up',
      'on_the_way': 'Out for Delivery',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled'
    };
    return labels[status] || status;
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
        <p className="text-muted-foreground mb-8">You don't have permission to access this page.</p>
        <Link to="/">
          <Button>Go Home</Button>
        </Link>
      </div>
    );
  }

  if (loading) {
    return <div className="container mx-auto px-4 py-12 text-center">Loading orders...</div>;
  }

  // Filter out delivered orders
  const activeOrders = orders.filter(order => order.status !== 'delivered');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Order Management</h1>
          <p className="text-muted-foreground mt-2">View and manage customer orders</p>
        </div>
        <Link to="/admin">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>

      {activeOrders.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">No Orders Yet</h2>
            <p className="text-muted-foreground">Orders will appear here once customers make purchases.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {activeOrders.map((order) => {
            const orderId = (order._id || order.id)?.toString();
            const orderNumber = orderId ? orderId.slice(-8).toUpperCase() : 'N/A';

            return (
              <Card key={orderId}>
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg">Order #{orderNumber}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {order.userName || 'Customer'} • {order.userEmail}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Placed on {order.orderDate || new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`px-3 py-1.5 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </div>
                      <Link to={`/orders/${orderId}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Order Items */}
                    <div>
                      <h3 className="font-semibold mb-3">Items</h3>
                      <div className="space-y-2">
                        {order.items && order.items.slice(0, 3).map((item, index) => (
                          <div key={index} className="flex items-center gap-3 text-sm">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-12 h-12 object-cover rounded"
                            />
                            <div className="flex-1">
                              <p className="font-medium">{item.name}</p>
                              <p className="text-muted-foreground">Qty: {item.quantity}</p>
                            </div>
                            <p className="font-semibold">${item.price}</p>
                          </div>
                        ))}
                        {order.items && order.items.length > 3 && (
                          <p className="text-sm text-muted-foreground">
                            +{order.items.length - 3} more items
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Order Details & Status Update */}
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold mb-2">Shipping Address</h3>
                        <div className="text-sm text-muted-foreground">
                          <p className="font-medium text-foreground">
                            {order.shippingAddress?.fullName || 'N/A'}
                          </p>
                          <p>{order.shippingAddress?.address}</p>
                          <p>
                            {order.shippingAddress?.city}
                            {order.shippingAddress?.state && `, ${order.shippingAddress.state}`}
                            {order.shippingAddress?.zipCode && ` ${order.shippingAddress.zipCode}`}
                          </p>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-semibold mb-2">Update Status</h3>
                        <Select
                          value={order.status}
                          onValueChange={(newStatus) => handleStatusChange(orderId, newStatus)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="order_placed">Order Placed</SelectItem>
                            <SelectItem value="fulfillment_processing">Processing</SelectItem>
                            <SelectItem value="regional_transit">In Transit (Regional)</SelectItem>
                            <SelectItem value="local_station">At Local Station</SelectItem>
                            <SelectItem value="waiting_for_agent">Awaiting Agent</SelectItem>
                            <SelectItem value="agent_assigned">Agent Assigned</SelectItem>
                            <SelectItem value="picked_up">Picked Up</SelectItem>
                            <SelectItem value="on_the_way">Out for Delivery</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="pt-4 border-t">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold">Total Amount:</span>
                          <span className="text-xl font-bold text-primary">
                            ${(order.totalAmount || 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Returns Section */}
                  {order.returns && order.returns.length > 0 && (
                    <div className="mt-6">
                      <h3 className="font-semibold mb-2">Return Requests</h3>
                      <div className="space-y-2">
                        {order.returns.map((ret, idx) => {
                          const returnedItem = order.items?.find(i => i.productId === ret.productId);
                          const isPending = ret.status === 'pending' || ret.status === 'requested';
                          // If item is not found in order.items (already removed), use info from returns array if available
                          const itemName = returnedItem ? returnedItem.name : (ret.name || ret.productId);
                          const itemImage = returnedItem ? returnedItem.image : (ret.image || undefined);
                          return (
                            <div key={idx} className="flex items-center gap-4 p-3 border rounded bg-gray-50">
                              {itemImage && (
                                <img src={itemImage} alt={itemName} className="w-10 h-10 object-cover rounded" />
                              )}
                              <div className="flex-1">
                                <p className="font-medium">{itemName}</p>
                                <p className="text-xs text-muted-foreground">Requested on {ret.requestedAt ? new Date(ret.requestedAt).toLocaleDateString() : 'N/A'}</p>
                              </div>
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${isPending ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                                {ret.status.charAt(0).toUpperCase() + ret.status.slice(1)}
                              </span>
                              {/* Approve button for pending/"requested" returns */}
                              {isPending && (
                                <Button
                                  size="sm"
                                  variant="success"
                                  onClick={async () => {
                                    try {
                                      await adminAPI.approveReturn(orderId, ret.productId, token);
                                      toast({
                                        title: 'Return Approved',
                                        description: `Return for ${itemName} approved and item removed.`,
                                      });
                                      await loadOrders();
                                    } catch (error) {
                                      toast({
                                        title: 'Error',
                                        description: error.message || 'Failed to approve return',
                                        variant: 'destructive',
                                      });
                                    }
                                  }}
                                >
                                  Approve Return
                                </Button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
