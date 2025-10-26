const express = require('express');
const { ObjectId } = require('mongodb');

function createWishlistRouter(usersCollection, productsCollection) {
  const router = express.Router();
  const requireAuth = (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    next();
  };

  router.get('/', requireAuth, async (req, res) => {
    try {
      const user = await usersCollection.findOne({ _id: new ObjectId(req.user.id) });
      if (!user) return res.status(404).json({ message: 'User not found' });

      const wishlistIds = user.wishlist || [];
      const items = [];
      for (const productId of wishlistIds) {
        try {
          const product = await productsCollection.findOne({ _id: new ObjectId(productId) });
          if (product) items.push(product);
        } catch (err) {
          console.error('Invalid product ID in wishlist:', productId);
        }
      }
      res.json({ items });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  router.post('/', requireAuth, async (req, res) => {
    try {
      const { productId } = req.body;
      if (!productId) return res.status(400).json({ message: 'Product ID required' });

      const product = await productsCollection.findOne({ _id: new ObjectId(productId) });
      if (!product) return res.status(404).json({ message: 'Product not found' });

      const result = await usersCollection.updateOne(
        { _id: new ObjectId(req.user.id) },
        { $addToSet: { wishlist: productId } }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json({ message: 'Added to wishlist', product });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  router.delete('/:productId', requireAuth, async (req, res) => {
    try {
      const { productId } = req.params;

      const result = await usersCollection.updateOne(
        { _id: new ObjectId(req.user.id) },
        { $pull: { wishlist: productId } }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({ message: 'Removed from wishlist' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  return router;
}

module.exports = createWishlistRouter;