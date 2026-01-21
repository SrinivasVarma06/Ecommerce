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
        // Uses bulkWrite for atomic operations (all succeed or all fail)
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
            // Check if already approved
            if (order.returns[returnIdx].status === 'approved') {
              return res.status(400).json({ message: 'Return already approved' });
            }
            // Find the item to be returned
            const item = order.items ? order.items.find(i => i.productId === productId) : null;
            if (!item) {
              return res.status(400).json({ message: 'Item not found in order' });
            }
            const itemPrice = item.price * item.quantity;
            const returnQuantity = item.quantity;

            // ATOMIC OPERATION: Use bulkWrite for order updates
            // This ensures all order changes happen together
            const orderUpdateResult = await ordersCollection.bulkWrite([
              // Operation 1: Update return status to approved
              {
                updateOne: {
                  filter: { _id: new ObjectId(orderId), 'returns.productId': productId },
                  update: { $set: { 'returns.$.status': 'approved', 'returns.$.approvedAt': new Date() } }
                }
              },
              // Operation 2: Remove item from order
              {
                updateOne: {
                  filter: { _id: new ObjectId(orderId) },
                  update: { $pull: { items: { productId } } }
                }
              },
              // Operation 3: Subtract item price from order total
              {
                updateOne: {
                  filter: { _id: new ObjectId(orderId) },
                  update: { $inc: { totalAmount: -itemPrice } }
                }
              }
            ], { ordered: true }); // ordered: true means stop on first failure

            // Restore stock to the product (separate collection, but critical)
            if (ObjectId.isValid(productId)) {
              await productsCollection.updateOne(
                { _id: new ObjectId(productId) },
                { $inc: { stock: returnQuantity } }
              );
            }

            res.json({ 
              message: 'Return approved successfully',
              details: {
                itemRemoved: item.name,
                quantityRestored: returnQuantity,
                amountRefunded: itemPrice
              }
            });
          } catch (err) {
            console.error('Return approval error:', err);
            res.status(500).json({ message: 'Server error during return approval. Please try again.' });
          }
        });

  return router;
}

module.exports = createAdminRouter;
