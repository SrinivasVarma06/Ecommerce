const express = require('express');
const { ObjectId } = require('mongodb');

function createDeliveryRouter(ordersCollection, deliveryAgentsCollection, deliveryStationsCollection) {
  const router = express.Router();

  // Middleware to verify delivery agent authentication
  const requireAgentAuth = (req, res, next) => {
    const agentId = req.headers['x-agent-id'];
    if (!agentId) {
      return res.status(401).json({ message: 'Agent authentication required' });
    }
    req.agentId = agentId;
    next();
  };

  // Register delivery station/hub
  router.post('/station/register', async (req, res) => {
    try {
      const { name, address, city, state, zipCode, type, coordinates } = req.body;
      
      const station = {
        name,
        address,
        city: city.toLowerCase(),
        state,
        zipCode,
        type, // 'fulfillment_center', 'regional_hub', 'local_station'
        coordinates: {
          latitude: parseFloat(coordinates.latitude),
          longitude: parseFloat(coordinates.longitude)
        },
        capacity: 1000,
        currentLoad: 0,
        operatingHours: '24/7',
        createdAt: new Date()
      };

      const result = await deliveryStationsCollection.insertOne(station);
      
      res.status(201).json({
        message: 'Delivery station registered successfully',
        stationId: result.insertedId,
        station: { ...station, _id: result.insertedId }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Get all delivery stations
  router.get('/stations', async (req, res) => {
    try {
      const stations = await deliveryStationsCollection.find({}).toArray();
      res.json({ stations });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Delete all delivery stations (for testing/reset)
  router.delete('/stations/clear', async (req, res) => {
    try {
      const result = await deliveryStationsCollection.deleteMany({});
      res.json({ 
        message: 'All stations deleted successfully', 
        deletedCount: result.deletedCount 
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Process order through delivery network
  router.post('/process-order/:orderId', async (req, res) => {
    try {
      const { orderId } = req.params;
      
      if (!ObjectId.isValid(orderId)) {
        return res.status(400).json({ message: 'Invalid order ID' });
      }

      const order = await ordersCollection.findOne({ _id: new ObjectId(orderId) });
      if (!order || order.status !== 'waiting_for_agent') {
        return res.status(400).json({ message: 'Order not ready for processing' });
      }

      // Extract customer city from shipping address
      const customerCity = order.shippingAddress?.city?.toLowerCase();
      if (!customerCity) {
        return res.status(400).json({ message: 'Customer city not found in shipping address' });
      }

      // Find delivery stations in order: fulfillment → regional → local
      const fulfillmentCenter = await deliveryStationsCollection.findOne({ 
        type: 'fulfillment_center' 
      });
      
      const regionalHub = await deliveryStationsCollection.findOne({ 
        type: 'regional_hub',
        city: customerCity 
      });
      
      const localStation = await deliveryStationsCollection.findOne({ 
        type: 'local_station',
        city: customerCity 
      });

      if (!fulfillmentCenter) {
        return res.status(404).json({ message: 'No fulfillment center available' });
      }

      // Create delivery journey plan
      const deliveryJourney = {
        stages: [
          {
            stage: 'fulfillment_processing',
            location: fulfillmentCenter.name,
            address: fulfillmentCenter.address,
            status: 'in_progress',
            estimatedTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
            description: 'Order being processed at fulfillment center'
          }
        ]
      };

      // Add regional hub if exists
      if (regionalHub) {
        deliveryJourney.stages.push({
          stage: 'regional_transit',
          location: regionalHub.name,
          address: regionalHub.address,
          status: 'pending',
          estimatedTime: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours
          description: `In transit to regional hub in ${regionalHub.city}`
        });
      }

      // Add local station (required for final delivery)
      if (localStation) {
        deliveryJourney.stages.push({
          stage: 'local_station_arrival',
          location: localStation.name,
          address: localStation.address,
          status: 'pending',
          estimatedTime: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours
          description: `Arrived at local delivery station in ${localStation.city}`
        });

        deliveryJourney.stages.push({
          stage: 'agent_assignment',
          location: localStation.name,
          address: localStation.address,
          status: 'pending',
          estimatedTime: new Date(Date.now() + 14 * 60 * 60 * 1000), // 14 hours
          description: 'Waiting for delivery agent assignment'
        });
      } else {
        return res.status(404).json({ 
          message: `No local delivery station found in ${customerCity}. Please contact customer service.` 
        });
      }

      // Final delivery stage
      deliveryJourney.stages.push({
        stage: 'out_for_delivery',
        location: 'Customer Address',
        address: order.shippingAddress.address,
        status: 'pending',
        estimatedTime: new Date(Date.now() + 16 * 60 * 60 * 1000), // 16 hours
        description: 'Out for delivery to customer'
      });

      // Update order with delivery journey
      await ordersCollection.updateOne(
        { _id: new ObjectId(orderId) },
        {
          $set: {
            status: 'fulfillment_processing',
            deliveryJourney,
            currentStage: 0,
            assignedStations: {
              fulfillmentCenter: fulfillmentCenter._id,
              regionalHub: regionalHub?._id || null,
              localStation: localStation._id
            },
            updatedAt: new Date()
          }
        }
      );

      res.json({
        message: 'Order processing initiated',
        journey: deliveryJourney,
        estimatedDelivery: deliveryJourney.stages[deliveryJourney.stages.length - 1].estimatedTime
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Update order stage (simulate movement through delivery network)
  router.put('/advance-stage/:orderId', async (req, res) => {
    try {
      const { orderId } = req.params;
      const { stationId } = req.body;
      
      const order = await ordersCollection.findOne({ _id: new ObjectId(orderId) });
      if (!order || !order.deliveryJourney) {
        return res.status(404).json({ message: 'Order or delivery journey not found' });
      }

      const currentStageIndex = order.currentStage || 0;
      const nextStageIndex = currentStageIndex + 1;
      
      if (nextStageIndex >= order.deliveryJourney.stages.length) {
        return res.status(400).json({ message: 'Order already at final stage' });
      }

      // Update current stage to completed
      const updatedJourney = { ...order.deliveryJourney };
      updatedJourney.stages[currentStageIndex].status = 'completed';
      updatedJourney.stages[currentStageIndex].completedAt = new Date();
      
      // Advance to next stage
      updatedJourney.stages[nextStageIndex].status = 'in_progress';
      updatedJourney.stages[nextStageIndex].startedAt = new Date();

      // Determine new order status based on stage
      const nextStage = updatedJourney.stages[nextStageIndex];
      let newOrderStatus = 'in_transit';
      
      switch(nextStage.stage) {
        case 'regional_transit':
          newOrderStatus = 'regional_transit';
          break;
        case 'local_station_arrival':
          newOrderStatus = 'local_station';
          break;
        case 'agent_assignment':
          newOrderStatus = 'waiting_for_agent';
          break;
        case 'out_for_delivery':
          newOrderStatus = 'out_for_delivery';
          break;
      }

      await ordersCollection.updateOne(
        { _id: new ObjectId(orderId) },
        {
          $set: {
            status: newOrderStatus,
            deliveryJourney: updatedJourney,
            currentStage: nextStageIndex,
            updatedAt: new Date()
          }
        }
      );

      res.json({
        message: 'Order advanced to next stage',
        currentStage: nextStage,
        orderStatus: newOrderStatus
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Assign local delivery agent (only when order reaches local station)
  router.post('/assign-local-agent/:orderId', async (req, res) => {
    try {
      const { orderId } = req.params;
      
      const order = await ordersCollection.findOne({ _id: new ObjectId(orderId) });
      if (!order || order.status !== 'waiting_for_agent') {
        return res.status(400).json({ message: 'Order not ready for agent assignment' });
      }

      // Find agents available at the local station
      const localStationId = order.assignedStations?.localStation;
      if (!localStationId) {
        return res.status(400).json({ message: 'No local station assigned to this order' });
      }

      const availableAgents = await deliveryAgentsCollection.find({
        status: 'available',
        assignedStation: localStationId.toString(),
        currentLocation: { $exists: true }
      }).toArray();

      if (availableAgents.length === 0) {
        return res.status(404).json({ message: 'No available agents at local station' });
      }

      // Select the best agent (nearest to station or highest rated)
      const selectedAgent = availableAgents[0];

      // Update order with agent assignment
      await ordersCollection.updateOne(
        { _id: new ObjectId(orderId) },
        {
          $set: {
            agentId: selectedAgent._id.toString(),
            agentName: selectedAgent.name,
            agentPhone: selectedAgent.phone,
            status: 'agent_assigned',
            assignedAt: new Date(),
            updatedAt: new Date()
          }
        }
      );

      // Update agent status
      await deliveryAgentsCollection.updateOne(
        { _id: selectedAgent._id },
        { $set: { status: 'busy', currentOrder: orderId } }
      );

      res.json({
        message: 'Local delivery agent assigned',
        agent: {
          id: selectedAgent._id,
          name: selectedAgent.name,
          phone: selectedAgent.phone
        }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Register delivery agent with station assignment
  router.post('/agent/register', async (req, res) => {
    try {
      const { name, phone, vehicleType, licenseNumber, assignedStationId } = req.body;
      
      // Verify station exists
      if (assignedStationId) {
        const station = await deliveryStationsCollection.findOne({ 
          _id: new ObjectId(assignedStationId) 
        });
        if (!station) {
          return res.status(400).json({ message: 'Invalid station ID' });
        }
      }
      
      const agent = {
        name,
        phone,
        vehicleType,
        licenseNumber,
        assignedStation: assignedStationId || null,
        status: 'available', // available, busy, offline
        currentLocation: null,
        currentOrder: null,
        totalDeliveries: 0,
        rating: 5.0,
        createdAt: new Date()
      };

      const result = await deliveryAgentsCollection.insertOne(agent);
      
      res.status(201).json({
        message: 'Agent registered successfully',
        agentId: result.insertedId,
        agent: { ...agent, _id: result.insertedId }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Agent location update (same as before but with station verification)
  router.put('/agent/location', requireAgentAuth, async (req, res) => {
    try {
      const { latitude, longitude } = req.body;
      
      if (!latitude || !longitude) {
        return res.status(400).json({ message: 'Latitude and longitude required' });
      }

      const location = {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        timestamp: new Date()
      };

      await deliveryAgentsCollection.updateOne(
        { _id: new ObjectId(req.agentId) },
        { 
          $set: { 
            currentLocation: location,
            lastSeen: new Date()
          } 
        }
      );

      // Update tracking for active order
      const agent = await deliveryAgentsCollection.findOne({ _id: new ObjectId(req.agentId) });
      if (agent.currentOrder) {
        const order = await ordersCollection.findOne({ _id: new ObjectId(agent.currentOrder) });
        if (order && ['agent_assigned', 'picked_up', 'on_the_way'].includes(order.status)) {
          await updateOrderLocationTracking(order, location);
        }
      }

      res.json({ message: 'Location updated successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Get comprehensive order tracking
  router.get('/track/:orderId', async (req, res) => {
    try {
      const { orderId } = req.params;
      
      if (!ObjectId.isValid(orderId)) {
        return res.status(400).json({ message: 'Invalid order ID' });
      }

      const order = await ordersCollection.findOne({ _id: new ObjectId(orderId) });
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      let trackingInfo = {
        orderId: order._id,
        status: order.status,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        deliveryJourney: order.deliveryJourney || null,
        currentStage: order.currentStage || 0
      };

      // Add agent info if assigned
      if (order.agentId) {
        const agent = await deliveryAgentsCollection.findOne({ 
          _id: new ObjectId(order.agentId) 
        });
        
        if (agent) {
          trackingInfo.agent = {
            name: agent.name,
            phone: agent.phone,
            currentLocation: agent.currentLocation,
            vehicleType: agent.vehicleType
          };
          
          // Calculate delivery specifics only when agent is active
          if (['agent_assigned', 'picked_up', 'on_the_way'].includes(order.status) && agent.currentLocation) {
            trackingInfo.estimatedArrival = calculateEstimatedArrival(
              agent.currentLocation, 
              order.shippingAddress
            );
            trackingInfo.distanceRemaining = calculateDistance(
              agent.currentLocation,
              order.shippingAddress
            );
          }
        }
      }

      // Add station information
      if (order.assignedStations) {
        const stations = {};
        
        if (order.assignedStations.fulfillmentCenter) {
          stations.fulfillmentCenter = await deliveryStationsCollection.findOne({ 
            _id: new ObjectId(order.assignedStations.fulfillmentCenter) 
          });
        }
        
        if (order.assignedStations.regionalHub) {
          stations.regionalHub = await deliveryStationsCollection.findOne({ 
            _id: new ObjectId(order.assignedStations.regionalHub) 
          });
        }
        
        if (order.assignedStations.localStation) {
          stations.localStation = await deliveryStationsCollection.findOne({ 
            _id: new ObjectId(order.assignedStations.localStation) 
          });
        }
        
        trackingInfo.stations = stations;
      }

      res.json(trackingInfo);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Rest of the agent operations (pickup, start delivery, complete) remain the same
  router.put('/pickup/:orderId', requireAgentAuth, async (req, res) => {
    try {
      const { orderId } = req.params;
      
      const order = await ordersCollection.findOne({
        _id: new ObjectId(orderId),
        agentId: req.agentId,
        status: 'agent_assigned'
      });

      if (!order) {
        return res.status(404).json({ message: 'Order not found or not assigned to you' });
      }

      await ordersCollection.updateOne(
        { _id: new ObjectId(orderId) },
        {
          $set: {
            status: 'picked_up',
            pickedUpAt: new Date(),
            updatedAt: new Date()
          }
        }
      );

      res.json({ message: 'Order picked up from local station' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  router.put('/start-delivery/:orderId', requireAgentAuth, async (req, res) => {
    try {
      const { orderId } = req.params;
      
      const order = await ordersCollection.findOne({
        _id: new ObjectId(orderId),
        agentId: req.agentId,
        status: 'picked_up'
      });

      if (!order) {
        return res.status(404).json({ message: 'Order not found or not picked up yet' });
      }

      await ordersCollection.updateOne(
        { _id: new ObjectId(orderId) },
        {
          $set: {
            status: 'on_the_way',
            onTheWayAt: new Date(),
            updatedAt: new Date()
          }
        }
      );

      res.json({ message: 'Delivery started from local station' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  router.put('/complete/:orderId', requireAgentAuth, async (req, res) => {
    try {
      const { orderId } = req.params;
      const { deliveryProof } = req.body;
      
      const order = await ordersCollection.findOne({
        _id: new ObjectId(orderId),
        agentId: req.agentId,
        status: 'on_the_way'
      });

      if (!order) {
        return res.status(404).json({ message: 'Order not found or not on the way' });
      }

      await ordersCollection.updateOne(
        { _id: new ObjectId(orderId) },
        {
          $set: {
            status: 'delivered',
            deliveredAt: new Date(),
            updatedAt: new Date(),
            deliveryProof: deliveryProof || null
          }
        }
      );

      // Free up agent for next delivery
      await deliveryAgentsCollection.updateOne(
        { _id: new ObjectId(req.agentId) },
        { 
          $set: { status: 'available', currentOrder: null },
          $inc: { totalDeliveries: 1 }
        }
      );

      res.json({ message: 'Delivery completed successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Helper functions remain the same
  async function updateOrderLocationTracking(order, agentLocation) {
    try {
      const distance = calculateDistance(agentLocation, order.shippingAddress);
      const estimatedArrival = calculateEstimatedArrival(agentLocation, order.shippingAddress);
      
      await ordersCollection.updateOne(
        { _id: order._id },
        {
          $set: {
            'tracking.agentLocation': agentLocation,
            'tracking.estimatedArrival': estimatedArrival,
            'tracking.distanceRemaining': distance,
            'tracking.lastUpdate': new Date(),
            updatedAt: new Date()
          }
        }
      );
    } catch (err) {
      console.error('Error updating order tracking:', err);
    }
  }

  function calculateDistance(point1, point2) {
    if (!point1 || !point2) return null;
    
    const lat1 = point1.latitude || point1.lat;
    const lon1 = point1.longitude || point1.lng;
    const lat2 = point2.latitude || point2.lat || 40.7128;
    const lon2 = point2.longitude || point2.lng || -74.0060;
    
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  function calculateEstimatedArrival(agentLocation, shippingAddress) {
    const distance = calculateDistance(agentLocation, shippingAddress);
    if (!distance) return null;
    
    const avgSpeed = 30; // km/h
    const hoursToArrival = distance / avgSpeed;
    const estimatedArrival = new Date();
    estimatedArrival.setHours(estimatedArrival.getHours() + hoursToArrival);
    
    return estimatedArrival;
  }

  return router;
}

module.exports = createDeliveryRouter;