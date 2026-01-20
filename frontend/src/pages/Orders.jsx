import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, MapPin, Calendar, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ordersAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

import { useToast } from '@/hooks/use-toast';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  const { toast } = useToast();
  const [returnedItems, setReturnedItems] = useState({});

  useEffect(() => {
    if (token) {
      loadOrders();
    }
  }, [token]);

  const loadOrders = async () => {
    if (!token) return;
    try {
      const data = await ordersAPI.getAll(token);
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  // Map old statuses to simplified ones
  const getSimplifiedStatus = (status) => {
    const statusMap = {
      'order_placed': 'ordered',
      'fulfillment_processing': 'shipped',
      'regional_transit': 'shipped',
      'local_station': 'shipped',
      'waiting_for_agent': 'shipped',
      'agent_assigned': 'shipped',
      'picked_up': 'shipped',
      'shipped': 'shipped',
      'on_the_way': 'out_for_delivery',
      'out_for_delivery': 'out_for_delivery',
      'delivered': 'delivered',
      'cancelled': 'cancelled'
    };
    return statusMap[status] || 'ordered';
  };

  const getStatusLabel = (status) => {
    const simplified = getSimplifiedStatus(status);
    switch (simplified) {
      case 'delivered': return 'Delivered';
      case 'out_for_delivery': return 'Out for Delivery';
      case 'shipped': return 'Shipped';
      case 'ordered': return 'Order Placed';
      case 'cancelled': return 'Cancelled';
      default: return 'Processing';
    }
  };

  const getStatusColor = (status) => {
    const simplified = getSimplifiedStatus(status);
    switch (simplified) {
      case 'delivered':
        return 'text-green-600 bg-green-50';
      case 'out_for_delivery':
        return 'text-blue-600 bg-blue-50';
      case 'shipped':
        return 'text-orange-600 bg-orange-50';
      case 'ordered':
        return 'text-gray-600 bg-gray-50';
      case 'cancelled':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-muted-foreground';
    }
  };

  const getEstimatedDelivery = (order) => {
    const simplified = getSimplifiedStatus(order.status);
    if (simplified === 'delivered' || simplified === 'cancelled') return null;
    const orderDate = order.createdAt ? new Date(order.createdAt) : new Date();
    const deliveryDate = new Date(orderDate.getTime() + 4 * 24 * 60 * 60 * 1000);
    return deliveryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (!token) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Login Required</h1>
        <p className="text-muted-foreground mb-8">Please login to view your orders</p>
        <Link to="/login">
          <Button>Login</Button>
        </Link>
      </div>
    );
  }

  if (loading) {
    return <div className="container mx-auto px-4 py-12 text-center">Loading orders...</div>;
  }

  if (orders.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <h1 className="text-3xl font-bold mb-4">No Orders Yet</h1>
        <p className="text-muted-foreground mb-8">Start shopping to see your orders here!</p>
        <Link to="/products">
          <Button>Browse Products</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Orders</h1>

      <div className="space-y-4">
        {orders.map((order) => {
          const orderId = (order._id || order.id)?.toString();
          const orderNumber = orderId ? orderId.slice(-8).toUpperCase() : 'N/A';
          
          return (
            <div key={orderId} className="bg-card border rounded-lg p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">Order #{orderNumber}</h3>
                  <p className="text-sm text-muted-foreground">
                    Placed on {order.orderDate || new Date(order.createdAt).toLocaleDateString()}
                  </p>
                  {getEstimatedDelivery(order) && (
                    <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>Est. delivery: {getEstimatedDelivery(order)}</span>
                    </div>
                  )}
                </div>
                <div className="mt-2 md:mt-0 flex flex-col md:flex-row items-start md:items-center gap-2">
                  <span className={`font-semibold px-3 py-1 rounded-full text-sm ${getStatusColor(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </span>
                  {getSimplifiedStatus(order.status) === 'out_for_delivery' && (
                    <Link to={`/orders/${orderId}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1 text-xs"
                      >
                        <MapPin className="w-3 h-3" />
                        Track Live
                      </Button>
                    </Link>
                  )}
                </div>
              </div>

            <div className="space-y-3 mb-4">
              {order.items && order.items.map((item, index) => (
                <div key={index} className="flex gap-4">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium">{item.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Quantity: {item.quantity}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={
                        returnedItems[item.productId || item._id] ||
                        (order.returns && order.returns.some(r => r.productId === (item.productId || item._id)))
                      }
                      onClick={async () => {
                        try {
                          await ordersAPI.requestReturn(orderId, item.productId || item._id, token);
                          setReturnedItems(prev => ({ ...prev, [item.productId || item._id]: true }));
                          toast({
                            title: 'Return Requested',
                            description: `Return requested for ${item.name}`,
                          });
                          await loadOrders();
                        } catch (error) {
                          toast({
                            title: 'Error',
                            description: error.message || 'Failed to request return',
                            variant: 'destructive',
                          });
                        }
                      }}
                      className="mt-2"
                    >
                      {(order.returns && order.returns.some(r => r.productId === (item.productId || item._id))) || returnedItems[item.productId || item._id]
                        ? 'Return Requested'
                        : 'Request Return'}
                    </Button>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${item.price}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between border-t pt-4">
              <div>
                <span className="text-muted-foreground">Total: </span>
                <span className="font-bold text-lg">${(order.totalAmount || order.total || 0).toFixed(2)}</span>
              </div>
              <Link to={`/orders/${orderId}`}>
                <Button variant="outline">View Details</Button>
              </Link>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
};

export default Orders;





