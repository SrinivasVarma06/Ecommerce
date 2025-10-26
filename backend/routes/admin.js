const express = require('express');
const { ObjectId } = require('mongodb');

function createAdminRouter(usersCollection, ordersCollection, productsCollection) {
  const router = express.Router();

  // Middleware to verify authentication and admin role
  const requireAdmin = (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    next();
  };

  // Get all orders (admin only)
  router.get('/orders', requireAdmin, async (req, res) => {
    try {
      const orders = await ordersCollection
        .find({})
        .sort({ createdAt: -1 })
        .toArray();

      res.json({ orders });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Get analytics data (admin only)
  router.get('/analytics', requireAdmin, async (req, res) => {
    try {
      const totalProducts = await productsCollection.countDocuments();
      const totalUsers = await usersCollection.countDocuments();

      // Only count completed orders (not cancelled)
      const completedOrders = await ordersCollection
        .find({ status: { $ne: 'cancelled' } })
        .toArray();
      
      const totalOrders = completedOrders.length;

      // Calculate total revenue from completed orders only, using current totalAmount (which reflects returns)
      const totalRevenue = completedOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

      res.json({
        totalProducts,
        totalOrders,
        totalUsers,
        totalRevenue
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Get revenue data by period (admin only)
  router.get('/analytics/revenue', requireAdmin, async (req, res) => {
    try {
      const { period = 'month' } = req.query;
      
      // Get orders from the last period
      const now = new Date();
      let startDate;
      
      switch (period) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      // Only include completed orders (not cancelled)
      const orders = await ordersCollection
        .find({ 
          createdAt: { $gte: startDate },
          status: { $ne: 'cancelled' }
        })
        .sort({ createdAt: 1 })
        .toArray();

      // Group by date and calculate revenue (using current totalAmount which reflects returns)
      const revenueData = {};
      orders.forEach(order => {
        const date = new Date(order.createdAt).toLocaleDateString();
        revenueData[date] = (revenueData[date] || 0) + (order.totalAmount || 0);
      });

      const chartData = Object.keys(revenueData).map(date => ({
        date,
        revenue: revenueData[date]
      }));

      res.json({ data: chartData });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });

        // Approve a return request and remove item from order
        router.put('/orders/:orderId/returns/:productId/approve', requireAdmin, async (req, res) => {
          try {
            const { orderId, productId } = req.params;
            if (!ObjectId.isValid(orderId)) {
              return res.status(400).json({ message: 'Invalid order ID' });
            }
            const order = await ordersCollection.findOne({ _id: new ObjectId(orderId) });
            if (!order) {
              return res.status(404).json({ message: 'Order not found' });
            }
            // Find return request
            const returnIdx = order.returns ? order.returns.findIndex(r => r.productId === productId) : -1;
            if (returnIdx === -1) {
              return res.status(400).json({ message: 'Return request not found for this item' });
            }
            // Find the item to be returned
            const item = order.items ? order.items.find(i => i.productId === productId) : null;
            const itemPrice = item ? (item.price * item.quantity) : 0;
            // Update return status to approved
            await ordersCollection.updateOne(
              { _id: new ObjectId(orderId), 'returns.productId': productId },
              { $set: { 'returns.$.status': 'approved', 'returns.$.approvedAt': new Date() } }
            );
            // Remove item from order
            await ordersCollection.updateOne(
              { _id: new ObjectId(orderId) },
              { $pull: { items: { productId } } }
            );
            // Subtract item price from order totalAmount
            if (itemPrice > 0) {
              await ordersCollection.updateOne(
                { _id: new ObjectId(orderId) },
                { $inc: { totalAmount: -itemPrice } }
              );
            }
            res.json({ message: 'Return approved, item removed, and analytics updated.' });
          } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Server error' });
          }
        });

  return router;
}

module.exports = createAdminRouter;
