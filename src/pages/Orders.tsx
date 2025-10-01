import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ordersAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    if (token) {
      loadOrders();
    }
  }, [token]);

  const loadOrders = async () => {
    if (!token) return;
    try {
      const data: any = await ordersAPI.getAll(token);
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'text-green-600';
      case 'shipped':
        return 'text-blue-600';
      case 'processing':
        return 'text-yellow-600';
      case 'cancelled':
        return 'text-red-600';
      default:
        return 'text-muted-foreground';
    }
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
        {orders.map((order: any) => (
          <div key={order.id} className="bg-card border rounded-lg p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg">Order #{order.orderId}</h3>
                <p className="text-sm text-muted-foreground">
                  Placed on {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="mt-2 md:mt-0">
                <span className={`font-semibold ${getStatusColor(order.status)}`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              {order.items.map((item: any, index: number) => (
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
                <span className="font-bold text-lg">${order.total}</span>
              </div>
              <Link to={`/orders/${order.orderId}`}>
                <Button variant="outline">View Details</Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Orders;
