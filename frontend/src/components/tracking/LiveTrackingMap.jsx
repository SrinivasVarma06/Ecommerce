import { useEffect, useState, useRef } from 'react';
import { MapPin, Navigation, Phone, User, Clock, Route, RefreshCw, AlertCircle, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

const LiveTrackingMap = ({ 
  orderId, 
  agentLocation, 
  customerLocation, 
  agentInfo,
  estimatedArrival,
  distanceRemaining,
  orderStatus,
  onRefresh 
}) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [routeCoords, setRouteCoords] = useState(null);
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const agentMarkerRef = useRef(null);
  const customerMarkerRef = useRef(null);
  const routeLineRef = useRef(null);

  useEffect(() => {
    if (window.L) {
      setMapLoaded(true);
      return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = LEAFLET_CSS;
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = LEAFLET_JS;
    script.async = true;
    
    script.onload = () => {
      setMapLoaded(true);
    };
    
    script.onerror = () => {
      setMapError('Failed to load map library');
    };

    document.head.appendChild(script);

    return () => {
      if (!window.L) {
        try {
          document.head.removeChild(script);
          document.head.removeChild(link);
        } catch (e) {}
      }
    };
  }, []);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !window.L) return;

    const agentLat = agentLocation?.latitude || agentLocation?.lat;
    const agentLng = agentLocation?.longitude || agentLocation?.lng;
    const customerLat = customerLocation?.latitude || customerLocation?.lat;
    const customerLng = customerLocation?.longitude || customerLocation?.lng;

    const defaultCenter = [
      agentLat || customerLat || 15.4507,
      agentLng || customerLng || 74.9353
    ];

    if (!leafletMapRef.current) {
      leafletMapRef.current = window.L.map(mapRef.current, {
        center: defaultCenter,
        zoom: 15,
        zoomControl: true
      });

      // Add OpenStreetMap tiles (FREE - no API key!)
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19
      }).addTo(leafletMapRef.current);
    }

    // Create custom icons
    const agentIcon = window.L.divIcon({
      html: `
        <div style="
          background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid white;
          box-shadow: 0 4px 15px rgba(59, 130, 246, 0.5);
          animation: pulse 2s infinite;
        ">
          <span style="font-size: 22px;">🛵</span>
        </div>
      `,
      className: 'agent-marker',
      iconSize: [44, 44],
      iconAnchor: [22, 22]
    });

    const customerIcon = window.L.divIcon({
      html: `
        <div style="
          background: linear-gradient(135deg, #10B981 0%, #059669 100%);
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid white;
          box-shadow: 0 4px 15px rgba(16, 185, 129, 0.5);
        ">
          <span style="font-size: 20px;">🏠</span>
        </div>
      `,
      className: 'customer-marker',
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    // Update or create agent marker
    if (agentLat && agentLng) {
      if (agentMarkerRef.current) {
        // Animate marker movement
        const currentLatLng = agentMarkerRef.current.getLatLng();
        animateMarker(agentMarkerRef.current, currentLatLng, [agentLat, agentLng]);
      } else {
        agentMarkerRef.current = window.L.marker([agentLat, agentLng], { icon: agentIcon })
          .addTo(leafletMapRef.current)
          .bindPopup(`
            <div style="text-align: center; padding: 8px; min-width: 120px;">
              <strong style="font-size: 14px;">🛵 ${agentInfo?.name || 'Delivery Agent'}</strong><br/>
              <span style="color: #666; font-size: 12px;">On the way to you!</span>
            </div>
          `);
      }
    }

    // Update or create customer marker
    if (customerLat && customerLng) {
      if (!customerMarkerRef.current) {
        customerMarkerRef.current = window.L.marker([customerLat, customerLng], { icon: customerIcon })
          .addTo(leafletMapRef.current)
          .bindPopup(`
            <div style="text-align: center; padding: 8px; min-width: 120px;">
              <strong style="font-size: 14px;">🏠 Your Location</strong><br/>
              <span style="color: #666; font-size: 12px;">Delivery destination</span>
            </div>
          `);
      }
    }

    // Fetch and draw actual road route from OSRM
    const fetchAndDrawRoute = async () => {
      if (!agentLat || !agentLng || !customerLat || !customerLng) return;
      
      try {
        // Fetch route from OSRM (FREE - no API key needed!)
        const routeUrl = `https://router.project-osrm.org/route/v1/driving/${agentLng},${agentLat};${customerLng},${customerLat}?overview=full&geometries=geojson`;
        const response = await fetch(routeUrl);
        const data = await response.json();
        
        if (data.code === 'Ok' && data.routes?.[0]?.geometry?.coordinates) {
          // Convert [lng, lat] to [lat, lng] for Leaflet
          const coords = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
          
          if (routeLineRef.current) {
            routeLineRef.current.setLatLngs(coords);
          } else {
            routeLineRef.current = window.L.polyline(coords, {
              color: '#3B82F6',
              weight: 5,
              opacity: 0.8,
              lineJoin: 'round'
            }).addTo(leafletMapRef.current);
          }
          
          // Fit map to show the entire route
          leafletMapRef.current.fitBounds(routeLineRef.current.getBounds(), { padding: [50, 50] });
          return;
        }
      } catch (error) {
        console.warn('OSRM route fetch failed, using straight line:', error);
      }
      
      // Fallback to straight line if OSRM fails
      if (routeLineRef.current) {
        routeLineRef.current.setLatLngs([[agentLat, agentLng], [customerLat, customerLng]]);
      } else {
        routeLineRef.current = window.L.polyline(
          [[agentLat, agentLng], [customerLat, customerLng]],
          {
            color: '#3B82F6',
            weight: 4,
            opacity: 0.7,
            dashArray: '10, 10'
          }
        ).addTo(leafletMapRef.current);
      }

      // Fit map to show both markers
      const bounds = window.L.latLngBounds([
        [agentLat, agentLng],
        [customerLat, customerLng]
      ]);
      leafletMapRef.current.fitBounds(bounds, { padding: [50, 50] });
    };

    // Draw route (fetch once, then just update on agent move)
    if (agentLat && agentLng && customerLat && customerLng) {
      if (!routeLineRef.current) {
        fetchAndDrawRoute();
      } else {
        // Just fit bounds when agent moves
        const bounds = window.L.latLngBounds([
          [agentLat, agentLng],
          [customerLat, customerLng]
        ]);
        leafletMapRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
    } else if (agentLat && agentLng) {
      leafletMapRef.current.setView([agentLat, agentLng], 15);
    }

  }, [mapLoaded, agentLocation, customerLocation, agentInfo]);

  // Animate marker movement smoothly
  const animateMarker = (marker, from, to, duration = 1000) => {
    const startTime = Date.now();
    const fromLat = from.lat || from[0];
    const fromLng = from.lng || from[1];
    const toLat = to[0];
    const toLng = to[1];

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out cubic for smooth movement
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      const currentLat = fromLat + (toLat - fromLat) * easeProgress;
      const currentLng = fromLng + (toLng - fromLng) * easeProgress;
      
      marker.setLatLng([currentLat, currentLng]);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  // Handle refresh
  const handleRefresh = async () => {
    if (onRefresh && !isRefreshing) {
      setIsRefreshing(true);
      await onRefresh();
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

  // Format ETA
  const formatETA = (arrival) => {
    if (!arrival) return 'Calculating...';
    const date = new Date(arrival);
    const now = new Date();
    const diffMs = date - now;
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 1) return 'Arriving now!';
    if (diffMins < 60) return `${diffMins} min`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
  };

  // Check if we have valid agent location
  const hasAgentLocation = agentLocation && 
    (agentLocation.latitude || agentLocation.lat) && 
    (agentLocation.longitude || agentLocation.lng);

  // Show waiting message if no agent location
  if (!hasAgentLocation) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="w-5 h-5 text-blue-500" />
            Live Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
              <MapPin className="w-8 h-8 text-blue-500 animate-bounce" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Waiting for Agent Location</h3>
            <p className="text-muted-foreground max-w-sm">
              The delivery agent's location will appear here once they enable GPS tracking.
            </p>
            {agentInfo && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4" />
                  <span className="font-medium">{agentInfo.name}</span>
                </div>
                {agentInfo.phone && (
                  <div className="flex items-center gap-2 text-sm mt-1 text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    <span>{agentInfo.phone}</span>
                  </div>
                )}
              </div>
            )}
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error state
  if (mapError) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            Map Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-red-500 mb-4">{mapError}</p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6 overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Navigation className="w-5 h-5 text-blue-500" />
            Live Tracking
            <Badge variant="outline" className="ml-2 bg-green-50 text-green-600 border-green-200">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-1.5"></span>
              Live
            </Badge>
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Add pulse animation CSS */}
        <style>{`
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }
          .agent-marker, .customer-marker {
            background: transparent !important;
            border: none !important;
          }
        `}</style>

        {/* Map Container */}
        <div 
          ref={mapRef} 
          className="w-full h-[350px] bg-gray-100 dark:bg-gray-800"
          style={{ zIndex: 1 }}
        />
        
        {/* Agent Info Panel */}
        <div className="p-4 border-t bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
          <div className="flex items-center justify-between">
            {/* Agent Details */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">
                  {agentInfo?.name || 'Delivery Agent'}
                </h4>
                {agentInfo?.phone && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {agentInfo.phone}
                  </p>
                )}
                {agentInfo?.vehicle && (
                  <p className="text-xs text-muted-foreground capitalize">
                    {agentInfo.vehicle === 'bike' ? '🏍️' : agentInfo.vehicle === 'car' ? '🚗' : '🛵'} {agentInfo.vehicle}
                  </p>
                )}
              </div>
            </div>

            {/* ETA & Distance */}
            <div className="text-right">
              <div className="flex items-center justify-end gap-1 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>ETA</span>
              </div>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                {formatETA(estimatedArrival)}
              </p>
              {distanceRemaining && (
                <p className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                  <Route className="w-3 h-3" />
                  {distanceRemaining.toFixed(1)} km away
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveTrackingMap;
