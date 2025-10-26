import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Package, Truck, CheckCircle, XCircle, MapPin, Clock, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ordersAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

const OrderDetail = () => {
  const { orderId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token && orderId) {
      loadOrder();
    }
  }, [token, orderId]);

  const loadOrder = async () => {
    if (!token || !orderId) return;
    try {
      const data = await ordersAPI.getById(orderId, token);
      setOrder(data);
    } catch (error) {
      console.error('Failed to load order:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'on_the_way':
        return <Truck className="w-6 h-6 text-blue-600" />;
      case 'picked_up':
        return <Package className="w-6 h-6 text-purple-600" />;
      case 'agent_assigned':
        return <Package className="w-6 h-6 text-orange-600" />;
      case 'waiting_for_agent':
        return <Clock className="w-6 h-6 text-yellow-600" />;
      case 'local_station':
        return <Package className="w-6 h-6 text-indigo-600" />;
      case 'regional_transit':
        return <Truck className="w-6 h-6 text-cyan-600" />;
      case 'fulfillment_processing':
        return <Package className="w-6 h-6 text-amber-600" />;
      case 'order_placed':
        return <Package className="w-6 h-6 text-gray-600" />;
      case 'cancelled':
        return <XCircle className="w-6 h-6 text-red-600" />;
      default:
        return <Package className="w-6 h-6 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':
        return 'text-green-600 bg-green-50';
      case 'on_the_way':
        return 'text-blue-600 bg-blue-50';
      case 'picked_up':
        return 'text-purple-600 bg-purple-50';
      case 'agent_assigned':
        return 'text-orange-600 bg-orange-50';
      case 'waiting_for_agent':
        return 'text-yellow-600 bg-yellow-50';
      case 'local_station':
        return 'text-indigo-600 bg-indigo-50';
      case 'regional_transit':
        return 'text-cyan-600 bg-cyan-50';
      case 'fulfillment_processing':
        return 'text-amber-600 bg-amber-50';
      case 'order_placed':
        return 'text-gray-600 bg-gray-50';
      case 'cancelled':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-muted-foreground bg-gray-50';
    }
  };

  const getOrderTimeline = () => {
    // If order has a delivery journey, use that. Otherwise, use basic timeline
    if (order.deliveryJourney && order.deliveryJourney.stages) {
      return order.deliveryJourney.stages.map((stage, index) => ({
        status: stage.stage,
        title: getStageTitle(stage.stage),
        description: stage.description,
        date: stage.estimatedTime ? new Date(stage.estimatedTime) : new Date(),
        completed: stage.status === 'completed' || (order.currentStage || 0) > index,
        inProgress: (order.currentStage || 0) === index && stage.status === 'in_progress',
        location: stage.location
      }));
    }

    // Fallback to basic timeline for orders without delivery journey
    const baseDate = order.createdAt ? new Date(order.createdAt) : new Date();
    const statusOrder = ['order_placed', 'fulfillment_processing', 'regional_transit', 'local_station', 'waiting_for_agent', 'agent_assigned', 'picked_up', 'on_the_way', 'delivered'];
    const currentStatusIndex = statusOrder.indexOf(order.status);
    
    const steps = [
      { 
        status: 'order_placed', 
        title: 'Order Placed', 
        description: 'Order received and confirmed',
        date: baseDate,
        completed: currentStatusIndex >= 0,
        location: 'E-commerce Platform'
      },
      { 
        status: 'fulfillment_processing', 
        title: 'Processing', 
        description: 'Order being processed at fulfillment center',
        date: new Date(baseDate.getTime() + 2 * 60 * 60 * 1000),
        completed: currentStatusIndex >= 1,
        location: 'Fulfillment Center'
      },
      { 
        status: 'regional_transit', 
        title: 'Regional Transit', 
        description: 'Package in transit to regional hub',
        date: new Date(baseDate.getTime() + 8 * 60 * 60 * 1000),
        completed: currentStatusIndex >= 2,
        location: 'Regional Hub'
      },
      { 
        status: 'local_station', 
        title: 'Local Station', 
        description: 'Package arrived at local delivery station',
        date: new Date(baseDate.getTime() + 12 * 60 * 60 * 1000),
        completed: currentStatusIndex >= 3,
        location: 'Local Delivery Station'
      },
      { 
        status: 'waiting_for_agent', 
        title: 'Awaiting Agent', 
        description: 'Waiting for delivery agent assignment',
        date: new Date(baseDate.getTime() + 14 * 60 * 60 * 1000),
        completed: currentStatusIndex >= 4,
        location: 'Local Delivery Station'
      },
      { 
        status: 'agent_assigned', 
        title: 'Agent Assigned', 
        description: order.agentName ? `Assigned to ${order.agentName}` : 'Delivery agent assigned',
        date: order.assignedAt ? new Date(order.assignedAt) : new Date(baseDate.getTime() + 15 * 60 * 60 * 1000),
        completed: currentStatusIndex >= 5,
        location: 'Local Delivery Station'
      },
      { 
        status: 'picked_up', 
        title: 'Picked Up', 
        description: 'Agent collected package from station',
        date: order.pickedUpAt ? new Date(order.pickedUpAt) : new Date(baseDate.getTime() + 16 * 60 * 60 * 1000),
        completed: currentStatusIndex >= 6,
        location: 'Local Delivery Station'
      },
      { 
        status: 'on_the_way', 
        title: 'Out for Delivery', 
        description: 'Package on the way to your address',
        date: order.onTheWayAt ? new Date(order.onTheWayAt) : new Date(baseDate.getTime() + 17 * 60 * 60 * 1000),
        completed: currentStatusIndex >= 7,
        location: 'En Route'
      },
      { 
        status: 'delivered', 
        title: 'Delivered', 
        description: 'Package successfully delivered',
        date: order.deliveredAt ? new Date(order.deliveredAt) : new Date(baseDate.getTime() + 18 * 60 * 60 * 1000),
        completed: currentStatusIndex >= 8,
        location: 'Customer Address'
      }
    ];
    return steps;
  };

  const getStageTitle = (stage) => {
    const titles = {
      'fulfillment_processing': 'Processing at Fulfillment Center',
      'regional_transit': 'Regional Transit',
      'local_station_arrival': 'Arrived at Local Station',
      'agent_assignment': 'Agent Assignment',
      'out_for_delivery': 'Out for Delivery'
    };
    return titles[stage] || stage.replace('_', ' ').toUpperCase();
  };

  const getEstimatedDelivery = () => {
    if (order.status === 'delivered') return null;
    const orderDate = order.createdAt ? new Date(order.createdAt) : new Date();
    const deliveryDate = new Date(orderDate.getTime() + 5 * 24 * 60 * 60 * 1000);
    return deliveryDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const [trackingData, setTrackingData] = useState(null);
  const [realTimeTracking, setRealTimeTracking] = useState(false);

  // Load real-time tracking data
  const loadTrackingData = async () => {
    if (!orderId) return;
    try {
      const response = await fetch(`http://localhost:5000/api/delivery/track/${orderId}`);
      if (response.ok) {
        const data = await response.json();
        setTrackingData(data);
      }
    } catch (error) {
      console.error('Failed to load tracking data:', error);
    }
  };

  // Load tracking data when order changes
  useEffect(() => {
    if (order && ['agent_assigned', 'picked_up', 'on_the_way'].includes(order.status)) {
      loadTrackingData();
    }
  }, [order, orderId]);

  // Auto-refresh tracking data for active deliveries
  useEffect(() => {
    let interval;
    if (realTimeTracking && ['picked_up', 'on_the_way'].includes(order?.status)) {
      interval = setInterval(loadTrackingData, 30000); // Update every 30 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [realTimeTracking, order?.status, orderId]);

  const handleViewOnMap = () => {
    if (trackingData?.agent?.currentLocation) {
      const { latitude, longitude } = trackingData.agent.currentLocation;
      // Open Google Maps with agent location
      const mapUrl = `https://www.google.com/maps?q=${latitude},${longitude}&z=15`;
      window.open(mapUrl, '_blank');
    } else {
      alert('Agent location not available. The delivery agent may be offline or location services are disabled.');
    }
  };

  if (!token) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Login Required</h1>
        <p className="text-muted-foreground mb-8">Please login to view order details</p>
        <Link to="/login">
          <Button>Login</Button>
        </Link>
      </div>
    );
  }

  if (loading) {
    return <div className="container mx-auto px-4 py-12 text-center">Loading order details...</div>;
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Order Not Found</h1>
        <p className="text-muted-foreground mb-8">The order you're looking for doesn't exist or you don't have access to it.</p>
        <Link to="/orders">
          <Button>Back to Orders</Button>
        </Link>
      </div>
    );
  }

  const orderNumber = order._id ? order._id.toString().slice(-8).toUpperCase() : 'N/A';

  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => navigate('/orders')}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Orders
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Header */}
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold mb-2">Order #{orderNumber}</h1>
                <p className="text-sm text-muted-foreground">
                  Placed on {order.orderDate || new Date(order.createdAt).toLocaleDateString()}
                </p>
                {getEstimatedDelivery() && (
                  <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>Estimated delivery: {getEstimatedDelivery()}</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className={`px-4 py-2 rounded-full flex items-center gap-2 ${getStatusColor(order.status)}`}>
                  {getStatusIcon(order.status)}
                  <span className="font-semibold">
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>
                {(['agent_assigned', 'picked_up', 'on_the_way', 'delivered'].includes(order.status)) && (
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleViewOnMap}
                      className="flex items-center gap-2"
                      disabled={!trackingData?.agent?.currentLocation}
                    >
                      <MapPin className="w-4 h-4" />
                      View on Map
                    </Button>
                    {['picked_up', 'on_the_way'].includes(order.status) && (
                      <Button
                        variant={realTimeTracking ? "default" : "outline"}
                        size="sm"
                        onClick={() => setRealTimeTracking(!realTimeTracking)}
                        className="flex items-center gap-2 text-xs"
                      >
                        <div className={`w-2 h-2 rounded-full ${realTimeTracking ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
                        {realTimeTracking ? 'Live' : 'Track Live'}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Order Tracking Timeline */}
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-xl font-bold mb-6">Order Tracking</h2>
            <div className="space-y-6">
              {getOrderTimeline().map((step, index) => (
                <div key={step.status} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                      step.completed 
                        ? 'bg-primary border-primary text-primary-foreground' 
                        : 'bg-background border-muted-foreground'
                    }`}>
                      {step.completed ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <Clock className="w-4 h-4" />
                      )}
                    </div>
                    {index < getOrderTimeline().length - 1 && (
                      <div className={`w-0.5 h-12 mt-2 ${
                        step.completed ? 'bg-primary' : 'bg-muted'
                      }`} />
                    )}
                  </div>
                  <div className="flex-1 pb-6">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className={`font-semibold ${
                        step.completed || step.inProgress ? 'text-foreground' : 'text-muted-foreground'
                      }`}>
                        {step.title}
                        {step.inProgress && (
                          <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                            In Progress
                          </span>
                        )}
                      </h3>
                      <span className="text-sm text-muted-foreground">
                        {step.completed && step.status !== 'order_placed' 
                          ? step.date.toLocaleDateString() 
                          : step.date.toLocaleDateString()
                        }
                      </span>
                    </div>
                    <p className={`text-sm ${
                      step.completed || step.inProgress ? 'text-muted-foreground' : 'text-muted-foreground/70'
                    }`}>
                      {step.description}
                    </p>
                    {step.location && (
                      <p className="text-xs text-muted-foreground mt-1">
                        📍 {step.location}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Agent Info */}
          {order.agentName && (
            <div className="bg-card border rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Delivery Agent</h2>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Package className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{order.agentName}</h3>
                  {order.agentPhone && (
                    <p className="text-sm text-muted-foreground">{order.agentPhone}</p>
                  )}
                </div>
              </div>
              
              {trackingData && (
                <div className="space-y-3 border-t pt-4">
                  {trackingData.estimatedArrival && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Estimated Arrival:</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(trackingData.estimatedArrival).toLocaleString()}
                      </span>
                    </div>
                  )}
                  
                  {trackingData.distanceRemaining && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Distance Remaining:</span>
                      <span className="text-sm text-muted-foreground">
                        {trackingData.distanceRemaining.toFixed(1)} km
                      </span>
                    </div>
                  )}
                  
                  {trackingData.agent?.currentLocation && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Last Location Update:</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(trackingData.agent.currentLocation.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                  
                  {realTimeTracking && (
                    <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      Live tracking active - Updates every 30 seconds
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Order Items */}
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Order Items</h2>
            <div className="space-y-4">
              {order.items && order.items.map((item, index) => (
                <div key={index} className="flex gap-4 pb-4 border-b last:border-0">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Quantity: {item.quantity}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Price: ${item.price}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Shipping Address</h2>
            {order.shippingAddress ? (
              <div className="text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">{order.shippingAddress.fullName}</p>
                {order.shippingAddress.phone && <p>{order.shippingAddress.phone}</p>}
                <p>{order.shippingAddress.address}</p>
                <p>
                  {order.shippingAddress.city}
                  {order.shippingAddress.state && `, ${order.shippingAddress.state}`}
                  {order.shippingAddress.zipCode && ` ${order.shippingAddress.zipCode}`}
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground">No shipping address provided</p>
            )}
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div>
          <div className="bg-card border rounded-lg p-6 sticky top-24">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${(order.totalAmount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span className="text-green-600">FREE</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>Included</span>
              </div>
              <div className="border-t pt-3 flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">${(order.totalAmount || 0).toFixed(2)}</span>
              </div>
            </div>

            {order.paymentMethod && (
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Payment Method</h3>
                <p className="text-muted-foreground capitalize">{order.paymentMethod}</p>
              </div>
            )}

            {order.status === 'pending' && (
              <div className="border-t pt-4 mt-4">
                <p className="text-sm text-muted-foreground">
                  Your order is being processed. You'll receive an email confirmation soon.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
