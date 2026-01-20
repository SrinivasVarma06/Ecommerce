const express = require('express');
const { ObjectId } = require('mongodb');

function createOrdersRouter(usersCollection, ordersCollection, productsCollection) {
  const router = express.Router();

  // Middleware to verify authentication
  const requireAuth = (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    next();
  };

  // Create a new order
  router.post('/', requireAuth, async (req, res) => {
    try {
      const { items, shippingAddress, paymentMethod, totalAmount } = req.body;

      if (!items || items.length === 0) {
        return res.status(400).json({ message: 'Cart is empty' });
      }

      if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.address) {
        return res.status(400).json({ message: 'Shipping address is required' });
      }

      if (!paymentMethod) {
        return res.status(400).json({ message: 'Payment method is required' });
      }

      let calculatedTotal = 0;
      const orderItems = [];

      // Process order without transactions (for standalone MongoDB)
      const processOrder = async () => {
        for (const item of items) {
          const product = await productsCollection.findOne(
            { _id: new ObjectId(item.productId || item._id) }
          );
          
          console.log('Fetching product with ID:', item.productId || item._id);
          
          if (!product) {
            throw new Error(`Product ${item.productId} not found`);
          }

          console.log('Product found:', product.name);

          // Check if enough inventory is available
          if (product.stock < item.quantity) {
            throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`);
          }

          // Atomically decrement stock - this prevents race conditions
          const updateResult = await productsCollection.updateOne(
            { 
              _id: new ObjectId(item.productId || item._id), 
              stock: { $gte: item.quantity } // Only update if stock is sufficient
            },
            { $inc: { stock: -item.quantity } }
          );

          // If no document was modified, it means stock was insufficient
          if (updateResult.matchedCount === 0) {
            throw new Error(`Product ${product.name} is no longer available in requested quantity`);
          }

          const itemTotal = product.price * item.quantity;
          calculatedTotal += itemTotal;

          orderItems.push({
            productId: product._id.toString(),
            name: product.name,
            price: product.price,
            quantity: item.quantity,
            image: product.image,
            total: itemTotal
          });
        }

        const order = {
          userId: req.user.id,
          userName: req.user.name || 'Customer',
          userEmail: req.user.email,
          items: orderItems,
          shippingAddress,
          paymentMethod,
          totalAmount: calculatedTotal,
          status: 'order_placed',
          createdAt: new Date(),
          updatedAt: new Date(),
          orderDate: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }),
          tracking: {
            statusHistory: [{
              status: 'order_placed',
              timestamp: new Date(),
              description: 'Order placed successfully, processing at fulfillment center'
            }]
          }
        };

        const result = await ordersCollection.insertOne(order);
        order._id = result.insertedId;

        // Clear user's cart after successful order
        await usersCollection.updateOne(
          { _id: new ObjectId(req.user.id) },
          { $set: { cart: [] } }
        );

        return order;
      };

      const order = await processOrder();

      res.status(201).json({
        message: 'Order placed successfully',
        order: {
          id: order._id,
          orderNumber: order._id.toString().slice(-8).toUpperCase(),
          totalAmount: order.totalAmount,
          status: order.status
        }
      });

    } catch (err) {
      console.error('Order creation error:', err);
      
      if (err.message.includes('Insufficient stock') || err.message.includes('no longer available')) {
        return res.status(409).json({ message: err.message }); // 409 Conflict
      }
      
      res.status(500).json({ message: 'Failed to create order. Please try again.' });
    }
  });

  // Get all orders for logged-in user
  router.get('/', requireAuth, async (req, res) => {
    try {
      const orders = await ordersCollection
        .find({ userId: req.user.id })
        .sort({ createdAt: -1 })
        .toArray();

      res.json({ orders });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Get single order by ID
  router.get('/:orderId', requireAuth, async (req, res) => {
    try {
      const { orderId } = req.params;

      if (!ObjectId.isValid(orderId)) {
        return res.status(400).json({ message: 'Invalid order ID' });
      }

      const order = await ordersCollection.findOne({
        _id: new ObjectId(orderId),
        userId: req.user.id
      });

      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      res.json(order);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Update order status (admin only - can be called from admin routes)
  router.put('/:orderId/status', requireAuth, async (req, res) => {
    try {
      const { orderId } = req.params;
      const { status, description } = req.body;

      // Simplified statuses like Amazon
      const validStatuses = [
        'order_placed',    // Order confirmed
        'shipped',         // Package shipped
        'out_for_delivery', // Driver on the way
        'delivered',       // Delivered
        'cancelled'
      ];

      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }

      // Get current order to update status history
      const currentOrder = await ordersCollection.findOne({ _id: new ObjectId(orderId) });
      if (!currentOrder) {
        return res.status(404).json({ message: 'Order not found' });
      }

      const statusUpdate = {
        status: status,
        timestamp: new Date(),
        description: description || getStatusDescription(status)
      };

      const result = await ordersCollection.updateOne(
        { _id: new ObjectId(orderId) },
        { 
          $set: { 
            status,
            updatedAt: new Date()
          },
          $push: {
            'tracking.statusHistory': statusUpdate
          }
        }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ message: 'Order not found' });
      }

      res.json({ message: 'Order status updated', statusUpdate });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Helper function to get status descriptions
  function getStatusDescription(status) {
    const descriptions = {
      'order_placed': 'Your order has been confirmed',
      'shipped': 'Your package is on its way',
      'out_for_delivery': 'Your package is out for delivery',
      'delivered': 'Your package has been delivered',
      'cancelled': 'Order has been cancelled'
    };
    return descriptions[status] || 'Status updated';
  }

    // Request a return for an item in an order
    router.post('/:orderId/returns', requireAuth, async (req, res) => {
      try {
        const { orderId } = req.params;
        const { productId } = req.body;
        if (!ObjectId.isValid(orderId)) {
          return res.status(400).json({ message: 'Invalid order ID' });
        }
        if (!productId) {
          return res.status(400).json({ message: 'Product ID required' });
        }
        const order = await ordersCollection.findOne({ _id: new ObjectId(orderId), userId: req.user.id });
        if (!order) {
          return res.status(404).json({ message: 'Order not found' });
        }
        // Check if product is in order
        const item = order.items.find(i => i.productId === productId);
        if (!item) {
          return res.status(400).json({ message: 'Product not found in order' });
        }
        // Check if already requested
        if (order.returns && order.returns.some(r => r.productId === productId)) {
          return res.status(400).json({ message: 'Return already requested for this item' });
        }
        // Add return request
        const returnRequest = {
          productId,
          status: 'requested',
          requestedAt: new Date()
        };
        await ordersCollection.updateOne(
          { _id: new ObjectId(orderId) },
          { $push: { returns: returnRequest } }
        );
        res.json({ message: 'Return requested', return: returnRequest });
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
      }
    });

  return router;
}

module.exports = createOrdersRouter;
