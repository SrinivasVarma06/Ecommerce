const express = require('express');
const { ObjectId } = require('mongodb');

function createPriceTrackingRouter(productsCollection, priceHistoryCollection) {
  const router = express.Router();

  // Record price change
  async function recordPriceChange(productId, oldPrice, newPrice) {
    await priceHistoryCollection.insertOne({
      productId: productId.toString(),
      price: newPrice,
      oldPrice,
      timestamp: new Date()
    });
  }

  // Get price history for a product
  router.get('/history/:productId', async (req, res) => {
    try {
      const { productId } = req.params;

      const history = await priceHistoryCollection
        .find({ productId })
        .sort({ timestamp: -1 })
        .limit(30)
        .toArray();

      res.json({ history });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Get price prediction and analysis
  router.get('/analysis/:productId', async (req, res) => {
    try {
      const { productId } = req.params;

      const product = await productsCollection.findOne({ _id: new ObjectId(productId) });
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      // Get last 30 days of price history
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const history = await priceHistoryCollection
        .find({
          productId,
          timestamp: { $gte: thirtyDaysAgo }
        })
        .sort({ timestamp: 1 })
        .toArray();

      // If no history, create initial entry
      if (history.length === 0) {
        await priceHistoryCollection.insertOne({
          productId,
          price: product.price,
          timestamp: new Date()
        });
        history.push({
          productId,
          price: product.price,
          timestamp: new Date()
        });
      }

      // Calculate statistics
      const prices = history.map(h => h.price);
      const currentPrice = product.price;
      const lowestPrice = Math.min(...prices);
      const highestPrice = Math.max(...prices);
      const averagePrice = prices.reduce((a, b) => a + b, 0) / prices.length;

      // Simple trend analysis
      const recentPrices = prices.slice(-7); // Last 7 entries
      const trend = recentPrices.length > 1
        ? recentPrices[recentPrices.length - 1] > recentPrices[0] ? 'increasing' : 'decreasing'
        : 'stable';

      // Price prediction (simple algorithm)
      const priceChange = currentPrice - averagePrice;
      const changePercentage = ((currentPrice - averagePrice) / averagePrice) * 100;

      let prediction = 'stable';
      let confidence = 50;
      let recommendation = 'neutral';

      if (changePercentage > 10) {
        prediction = 'likely_to_drop';
        recommendation = 'wait';
        confidence = 65;
      } else if (changePercentage < -10) {
        prediction = 'likely_to_increase';
        recommendation = 'buy_now';
        confidence = 70;
      } else if (currentPrice === lowestPrice) {
        prediction = 'at_lowest';
        recommendation = 'buy_now';
        confidence = 85;
      } else if (currentPrice === highestPrice) {
        prediction = 'at_highest';
        recommendation = 'wait';
        confidence = 80;
      }

      // Calculate best time to buy (day of week analysis if enough data)
      let bestDayToBuy = null;
      if (history.length >= 7) {
        const dayPrices = {};
        history.forEach(entry => {
          const day = new Date(entry.timestamp).getDay();
          if (!dayPrices[day]) dayPrices[day] = [];
          dayPrices[day].push(entry.price);
        });

        const dayAverages = Object.entries(dayPrices).map(([day, prices]) => ({
          day: parseInt(day),
          avgPrice: prices.reduce((a, b) => a + b, 0) / prices.length
        }));

        const lowestDay = dayAverages.reduce((min, curr) => 
          curr.avgPrice < min.avgPrice ? curr : min
        );

        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        bestDayToBuy = days[lowestDay.day];
      }

      // Format history for chart
      const chartData = history.map(entry => ({
        date: new Date(entry.timestamp).toLocaleDateString(),
        price: entry.price
      }));

      res.json({
        currentPrice,
        lowestPrice,
        highestPrice,
        averagePrice: parseFloat(averagePrice.toFixed(2)),
        trend,
        prediction,
        recommendation,
        confidence,
        bestDayToBuy,
        priceDropPercentage: currentPrice < averagePrice 
          ? parseFloat(Math.abs(changePercentage).toFixed(2))
          : 0,
        savings: currentPrice < averagePrice 
          ? parseFloat(Math.abs(priceChange).toFixed(2))
          : 0,
        chartData
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Set price alert
  router.post('/alert', async (req, res) => {
    try {
      const { productId, targetPrice, userId } = req.body;

      if (!productId || !targetPrice || !userId) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // Store alert (you could create a separate alerts collection)
      await priceHistoryCollection.insertOne({
        type: 'alert',
        productId,
        targetPrice,
        userId,
        active: true,
        createdAt: new Date()
      });

      res.json({ 
        success: true, 
        message: 'Price alert set successfully' 
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  return router;
}

module.exports = createPriceTrackingRouter;
