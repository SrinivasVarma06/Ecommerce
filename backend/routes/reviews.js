const express = require('express');
const { ObjectId } = require('mongodb');

function createReviewsRouter(productsCollection, reviewsCollection,authMiddleware) {
  const router = express.Router();

  // Middleware to verify authentication
  const requireAuth = (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    next();
  };

  // Get reviews for a product
  router.get('/:productId/reviews', async (req, res) => {
    try {
      const { productId } = req.params;
      
      const reviews = await reviewsCollection
        .find({ productId })
        .sort({ createdAt: -1 })
        .toArray();

      res.json({ reviews });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Add a review to a product
  router.post('/:productId/reviews', authMiddleware, requireAuth, async (req, res) => {
    try {
      const { productId } = req.params;
      const { rating, comment } = req.body;

      if (!rating || !comment) {
        return res.status(400).json({ message: 'Rating and comment are required' });
      }

      if (rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Rating must be between 1 and 5' });
      }

      // Verify product exists
      const product = await productsCollection.findOne({ _id: new ObjectId(productId) });
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      // Create review
      const review = {
        productId,
        userId: req.user.id,
        userName: req.user.name || 'Anonymous',
        rating: parseInt(rating),
        comment: comment.trim(),
        createdAt: new Date(),
        date: new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        })
      };

      const result = await reviewsCollection.insertOne(review);
      review._id = result.insertedId;

      await updateProductRating(productId);

      res.status(201).json({ message: 'Review added successfully', review });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  async function updateProductRating(productId) {
    try {
      const reviews = await reviewsCollection.find({ productId }).toArray();
      
      if (reviews.length === 0) {
        await productsCollection.updateOne(
          { _id: new ObjectId(productId) },
          { $set: { rating: 0, reviews: 0 } }
        );
        return;
      }

      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / reviews.length;

      await productsCollection.updateOne(
        { _id: new ObjectId(productId) },
        { $set: { rating: averageRating, reviews: reviews.length } }
      );
    } catch (err) {
      console.error('Error updating product rating:', err);
    }
  }

  return router;
}

module.exports = createReviewsRouter;
