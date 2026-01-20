import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Package, Truck, CheckCircle, XCircle, MapPin, Clock, Calendar, Phone, Play, Square, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ordersAPI, deliveryAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import LiveTrackingMap from '@/components/tracking/LiveTrackingMap';

// API base for direct calls - consistent with api.js
const API_BASE = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api`
  : 'http://localhost:5000/api';

const OrderDetail = () => {
  const { orderId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trackingData, setTrackingData] = useState(null);
  const [showLiveMap, setShowLiveMap] = useState(true);  // Show map by default
  const [isSimulating, setIsSimulating] = useState(false);
  const [simProgress, setSimProgress] = useState(0);
  const simulationRef = useRef(null);
  const agentIdRef = useRef(null);

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

  // Load tracking data for out_for_delivery status
  const loadTrackingData = useCallback(async () => {
    if (!orderId) return;
    try {
      const data = await deliveryAPI.track(orderId);
      console.log('📍 Tracking data received:', data);
      console.log('   Agent info:', data?.agent);
      console.log('   Agent location:', data?.agent?.currentLocation);
      setTrackingData(data);
    } catch (error) {
      console.error('Failed to load tracking data:', error);
    }
  }, [orderId]);

  // Cleanup simulation on unmount
  useEffect(() => {
    return () => {
      if (simulationRef.current) {
        clearInterval(simulationRef.current);
      }
    };
  }, []);

  // Start simulation - creates agent, links to order, and simulates movement along real road
  const startSimulation = async () => {
    if (isSimulating) return;
    
    console.log('🚀 Starting simulation for order:', orderId);
    setIsSimulating(true);
    setSimProgress(0);

    // Coordinates for the simulation
    // Start: Hubbali City Center (near Old Bus Stand)
    const startLat = 15.3473;
    const startLng = 75.1344;
    // Destination: IIT Dharwad Permanent Campus
    const destLat = 15.4507;
    const destLng = 74.9353;

    try {
      // Step 1: Get actual road route from OSRM (FREE - no API key!)
      console.log('Step 1: Fetching actual road route from OSRM...');
      let routeCoords = [];
      try {
        const routeUrl = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${destLng},${destLat}?overview=full&geometries=geojson`;
        const routeRes = await fetch(routeUrl);
        const routeData = await routeRes.json();
        
        if (routeData.code === 'Ok' && routeData.routes?.[0]?.geometry?.coordinates) {
          // OSRM returns [lng, lat] pairs, convert to {latitude, longitude}
          routeCoords = routeData.routes[0].geometry.coordinates.map(coord => ({
            longitude: coord[0],
            latitude: coord[1]
          }));
          console.log(`   Got ${routeCoords.length} route points from OSRM`);
          
          // Sample points for faster animation (take every Nth point)
          const targetPoints = 25; // Number of animation steps
          if (routeCoords.length > targetPoints) {
            const step = Math.floor(routeCoords.length / targetPoints);
            routeCoords = routeCoords.filter((_, i) => i % step === 0);
            // Always include the last point (destination)
            if (routeCoords[routeCoords.length - 1].latitude !== destLat) {
              routeCoords.push({ latitude: destLat, longitude: destLng });
            }
          }
          console.log(`   Using ${routeCoords.length} points for animation`);
        }
      } catch (routeError) {
        console.warn('   OSRM route fetch failed, falling back to straight line:', routeError);
      }

      // Fallback to straight line if OSRM fails
      if (routeCoords.length === 0) {
        console.log('   Using straight line fallback');
        const numPoints = 25;
        for (let i = 0; i <= numPoints; i++) {
          routeCoords.push({
            latitude: startLat + (destLat - startLat) * (i / numPoints),
            longitude: startLng + (destLng - startLng) * (i / numPoints)
          });
        }
      }

      // Step 2: Register a test agent with initial location
      console.log('Step 2: Registering test agent...');
      const agentRes = await fetch(`${API_BASE}/delivery/agent/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Driver (Rahul)',
          phone: '+91 98765 43210',
          vehicleType: 'scooter',
          licenseNumber: 'TEST-' + Date.now()
        })
      });
      const agentData = await agentRes.json();
      
      if (!agentRes.ok) {
        throw new Error(agentData.message || 'Failed to register agent');
      }
      
      agentIdRef.current = agentData.agentId;
      console.log('   Agent registered:', agentData.agentId);

      // Step 2.5: Set initial location for the agent IMMEDIATELY
      console.log('Step 2.5: Setting initial agent location in Hubbali...');
      await fetch(`${API_BASE}/delivery/agent/location`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-agent-id': agentData.agentId
        },
        body: JSON.stringify({ latitude: startLat, longitude: startLng })
      });

      // Step 3: Link agent to this order
      console.log('Step 3: Linking agent to order...');
      const linkRes = await fetch(`${API_BASE}/delivery/simulate/assign-agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderId,
          agentId: agentData.agentId
        })
      });
      const linkData = await linkRes.json();
      
      if (!linkRes.ok) {
        throw new Error(linkData.message || 'Failed to link agent');
      }
      console.log('   Agent linked to order:', linkData);

      // Step 4: Reload order to get updated status
      await loadOrder();
      
      // Step 5: Start simulating movement along the road
      console.log('Step 4: Starting road-following simulation...');
      console.log(`   From: Hubbali (${startLat}, ${startLng})`);
      console.log(`   To: IIT Dharwad (${destLat}, ${destLng})`);
      console.log(`   Route points: ${routeCoords.length}`);
      
      const totalSteps = routeCoords.length;
      let step = 0;

      // Update location every 1.5 seconds (fast for testing)
      simulationRef.current = setInterval(async () => {
        if (step >= totalSteps) {
          clearInterval(simulationRef.current);
          simulationRef.current = null;
          setSimProgress(100);
          console.log('✅ Agent reached destination! Marking as delivered...');
          
          // Auto-mark as delivered
          try {
            await fetch(`${API_BASE}/delivery/simulate/deliver/${orderId}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' }
            });
            console.log('📦 Order marked as DELIVERED!');
            // Reload order to show delivered status
            await loadOrder();
          } catch (e) {
            console.error('Failed to mark as delivered:', e);
          }
          
          setIsSimulating(false);
          return;
        }

        const currentPoint = routeCoords[step];
        step++;
        setSimProgress(Math.round((step / totalSteps) * 100));

        try {
          await fetch(`${API_BASE}/delivery/agent/location`, {
            method: 'PUT',
            headers: { 
              'Content-Type': 'application/json',
              'x-agent-id': agentIdRef.current
            },
            body: JSON.stringify({ 
              latitude: currentPoint.latitude, 
              longitude: currentPoint.longitude 
            })
          });
          console.log(`📍 Location ${step}/${totalSteps}: (${currentPoint.latitude.toFixed(5)}, ${currentPoint.longitude.toFixed(5)})`);
          
          // Refresh tracking data
          loadTrackingData();
        } catch (e) {
          console.error('Location update failed:', e);
        }
      }, 2000);

    } catch (error) {
      console.error('Simulation failed:', error);
      setIsSimulating(false);
      alert('Simulation failed: ' + error.message);
    }
  };

  // Stop simulation
  const stopSimulation = () => {
    if (simulationRef.current) {
      clearInterval(simulationRef.current);
      simulationRef.current = null;
    }
    setIsSimulating(false);
    console.log('⏹️ Simulation stopped');
  };

  // Load tracking when order is out for delivery (or any active delivery status)
  useEffect(() => {
    const activeStatuses = ['out_for_delivery', 'on_the_way', 'agent_assigned', 'picked_up'];
    if (order && activeStatuses.includes(order.status)) {
      loadTrackingData();
      // Poll every 5 seconds for more real-time updates
      const interval = setInterval(loadTrackingData, 5000);
      return () => clearInterval(interval);
    }
  }, [order, loadTrackingData]);

  // Simplified status mapping (map old statuses to new simple ones)
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

  const simplifiedStatus = order ? getSimplifiedStatus(order.status) : 'ordered';

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'out_for_delivery':
        return <Truck className="w-6 h-6 text-blue-600" />;
      case 'shipped':
        return <Package className="w-6 h-6 text-orange-600" />;
      case 'ordered':
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
        return 'text-green-600 bg-green-50 border-green-200';
      case 'out_for_delivery':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'shipped':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'ordered':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'cancelled':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-muted-foreground bg-gray-50';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'delivered':
        return 'Delivered';
      case 'out_for_delivery':
        return 'Out for Delivery';
      case 'shipped':
        return 'Shipped';
      case 'ordered':
        return 'Order Placed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Processing';
    }
  };

  // Simple 4-step timeline like Amazon
  const getOrderTimeline = () => {
    const statusOrder = ['ordered', 'shipped', 'out_for_delivery', 'delivered'];
    const currentIndex = statusOrder.indexOf(simplifiedStatus);
    
    const baseDate = order?.createdAt ? new Date(order.createdAt) : new Date();
    
    return [
      { 
        status: 'ordered', 
        title: 'Order Placed', 
        description: 'Your order has been confirmed',
        date: baseDate,
        completed: currentIndex >= 0,
        current: currentIndex === 0
      },
      { 
        status: 'shipped', 
        title: 'Shipped', 
        description: 'Your package is on its way to your city',
        date: new Date(baseDate.getTime() + 24 * 60 * 60 * 1000),
        completed: currentIndex >= 1,
        current: currentIndex === 1
      },
      { 
        status: 'out_for_delivery', 
        title: 'Out for Delivery', 
        description: order?.agentName 
          ? `${order.agentName} is delivering your package` 
          : 'Your package is out for delivery',
        date: new Date(baseDate.getTime() + 3 * 24 * 60 * 60 * 1000),
        completed: currentIndex >= 2,
        current: currentIndex === 2
      },
      { 
        status: 'delivered', 
        title: 'Delivered', 
        description: 'Package delivered successfully',
        date: order?.deliveredAt 
          ? new Date(order.deliveredAt) 
          : new Date(baseDate.getTime() + 4 * 24 * 60 * 60 * 1000),
        completed: currentIndex >= 3,
        current: currentIndex === 3
      }
    ];
  };

  const getEstimatedDelivery = () => {
    if (simplifiedStatus === 'delivered') return null;
    if (simplifiedStatus === 'cancelled') return null;
    const orderDate = order?.createdAt ? new Date(order.createdAt) : new Date();
    const deliveryDate = new Date(orderDate.getTime() + 4 * 24 * 60 * 60 * 1000);
    return deliveryDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getCustomerCoordinates = () => {
    if (order?.shippingAddress?.coordinates) {
      return order.shippingAddress.coordinates;
    }
    // Default to IIT Dharwad Permanent Campus, Karnataka
    return {
      latitude: order?.shippingAddress?.latitude || 15.4507,
      longitude: order?.shippingAddress?.longitude || 74.9353
    };
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
        <p className="text-muted-foreground mb-8">The order you're looking for doesn't exist.</p>
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold mb-1">Order #{orderNumber}</h1>
                <p className="text-sm text-muted-foreground">
                  Placed on {order.orderDate || new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className={`px-4 py-2 rounded-lg flex items-center gap-2 border ${getStatusColor(simplifiedStatus)}`}>
                {getStatusIcon(simplifiedStatus)}
                <span className="font-semibold">{getStatusLabel(simplifiedStatus)}</span>
              </div>
            </div>
            
            {getEstimatedDelivery() && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-700">
                  <Calendar className="w-4 h-4" />
                  <span className="font-medium">Estimated delivery: {getEstimatedDelivery()}</span>
                </div>
              </div>
            )}
          </div>

          {/* Order Tracking Timeline - Simple 4 steps */}
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-xl font-bold mb-6">Track Your Order</h2>
            
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between mb-2">
                {getOrderTimeline().map((step) => (
                  <div key={step.status} className="flex flex-col items-center flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                      step.completed 
                        ? 'bg-green-500 border-green-500 text-white' 
                        : step.current
                          ? 'bg-blue-500 border-blue-500 text-white animate-pulse'
                          : 'bg-gray-100 border-gray-300 text-gray-400'
                    }`}>
                      {step.completed && !step.current ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : step.status === 'ordered' ? (
                        <Package className="w-5 h-5" />
                      ) : step.status === 'shipped' ? (
                        <Package className="w-5 h-5" />
                      ) : step.status === 'out_for_delivery' ? (
                        <Truck className="w-5 h-5" />
                      ) : (
                        <CheckCircle className="w-5 h-5" />
                      )}
                    </div>
                    <span className={`text-xs mt-2 text-center font-medium ${
                      step.completed || step.current ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      {step.title}
                    </span>
                  </div>
                ))}
              </div>
              {/* Connecting line */}
              <div className="flex mt-[-52px] mb-8 px-5">
                {[0, 1, 2].map((index) => {
                  const completedIndex = getOrderTimeline().filter(s => s.completed).length - 1;
                  return (
                    <div key={index} className={`flex-1 h-1 mx-1 rounded ${
                      index <= completedIndex ? 'bg-green-500' : 'bg-gray-200'
                    }`} />
                  );
                })}
              </div>
            </div>

            {/* Current Status Details */}
            <div className="space-y-4">
              {getOrderTimeline().filter(step => step.completed || step.current).reverse().map((step, index) => (
                <div key={step.status} className={`flex gap-4 p-3 rounded-lg ${
                  index === 0 ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    index === 0 ? 'bg-blue-500 text-white' : 'bg-green-500 text-white'
                  }`}>
                    {step.status === 'out_for_delivery' ? (
                      <Truck className="w-4 h-4" />
                    ) : step.status === 'delivered' ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Package className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{step.title}</h3>
                      <span className="text-xs text-muted-foreground">
                        {step.date.toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live Tracking Map - ONLY shown during Out for Delivery */}
          {simplifiedStatus === 'out_for_delivery' && (
            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Live Location</h2>
                <div className="flex items-center gap-2">
                  {/* Test Simulation Button - Always visible for testing */}
                  {showLiveMap && (
                    <Button
                      variant={isSimulating ? "destructive" : "secondary"}
                      size="sm"
                      onClick={isSimulating ? stopSimulation : startSimulation}
                      className="flex items-center gap-2"
                    >
                      {isSimulating ? (
                        <>
                          <Square className="w-4 h-4" />
                          Stop ({simProgress}%)
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          {trackingData?.agent?.currentLocation ? 'Restart Simulation' : 'Test Simulation'}
                        </>
                      )}
                    </Button>
                  )}
                  <Button
                    variant={showLiveMap ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setShowLiveMap(!showLiveMap);
                      if (!showLiveMap) loadTrackingData();
                    }}
                    className="flex items-center gap-2"
                  >
                    <MapPin className="w-4 h-4" />
                    {showLiveMap ? 'Hide Map' : 'Track on Map'}
                  </Button>
                </div>
              </div>

              {showLiveMap && (
                <LiveTrackingMap
                  orderId={orderId}
                  agentLocation={trackingData?.agent?.currentLocation}
                  customerLocation={getCustomerCoordinates()}
                  agentInfo={{
                    name: trackingData?.agent?.name || order.agentName,
                    phone: trackingData?.agent?.phone || order.agentPhone,
                    vehicleType: trackingData?.agent?.vehicleType
                  }}
                  estimatedArrival={trackingData?.estimatedArrival}
                  distanceRemaining={trackingData?.distanceRemaining}
                  orderStatus={order.status}
                  onRefresh={loadTrackingData}
                />
              )}

              {!showLiveMap && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                      <Truck className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-blue-900">
                        {order.agentName ? `${order.agentName} is on the way` : 'Driver is on the way'}
                      </p>
                      <p className="text-sm text-blue-700">
                        Click "Track on Map" to see live location
                      </p>
                    </div>
                    {order.agentPhone && (
                      <a 
                        href={`tel:${order.agentPhone}`}
                        className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center hover:bg-green-600 transition"
                      >
                        <Phone className="w-5 h-5 text-white" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Order Items */}
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Items Ordered</h2>
            <div className="space-y-4">
              {order.items?.map((item, index) => (
                <div key={index} className="flex gap-4 pb-4 border-b last:border-0">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                    <p className="text-sm font-medium">${item.price}</p>
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
            <h2 className="text-xl font-bold mb-4">Delivery Address</h2>
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
              <p className="text-muted-foreground">No address provided</p>
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
