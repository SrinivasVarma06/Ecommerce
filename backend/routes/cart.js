const express = require('express');
const { ObjectId } = require('mongodb');

function createCartRouter(usersCollection, productsCollection) {
  const router = express.Router();

  // Middleware to verify authentication
  const requireAuth = (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    next();
  };

  // Get user's cart
  router.get('/', requireAuth, async (req, res) => {
    try {
      const user = await usersCollection.findOne({ _id: new ObjectId(req.user.id) });
      if (!user) return res.status(404).json({ message: 'User not found' });

      const cartItems = user.cart || [];
      
      // Fetch full product details for cart items
      const items = [];
      for (const cartItem of cartItems) {
        try {
          const product = await productsCollection.findOne({ _id: new ObjectId(cartItem.productId) });
          if (product) {
            items.push({
              ...product,
              quantity: cartItem.quantity,
              cartItemId: cartItem._id || cartItem.productId
            });
          }
        } catch (err) {
          console.error('Invalid product ID in cart:', cartItem.productId);
        }
      }

      res.json({ items });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Add item to cart
  router.post('/', requireAuth, async (req, res) => {
    try {
      const { productId, quantity } = req.body;
      if (!productId) return res.status(400).json({ message: 'Product ID required' });

      const qty = parseInt(quantity) || 1;
      if (qty < 1) return res.status(400).json({ message: 'Quantity must be at least 1' });

      // Verify product exists
      const product = await productsCollection.findOne({ _id: new ObjectId(productId) });
      if (!product) return res.status(404).json({ message: 'Product not found' });

      // Check if item already in cart
      const user = await usersCollection.findOne({ _id: new ObjectId(req.user.id) });
      const cart = user.cart || [];
      const existingItem = cart.find(item => item.productId === productId);

      if (existingItem) {
        // Update quantity
        await usersCollection.updateOne(
          { _id: new ObjectId(req.user.id), 'cart.productId': productId },
          { $inc: { 'cart.$.quantity': qty } }
        );
      } else {
        // Add new item
        await usersCollection.updateOne(
          { _id: new ObjectId(req.user.id) },
          { $push: { cart: { productId, quantity: qty } } }
        );
      }

      res.json({ message: 'Added to cart' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Update cart item quantity
  router.put('/:itemId', requireAuth, async (req, res) => {
    try {
      const { itemId } = req.params;
      const { quantity } = req.body;

      const qty = parseInt(quantity);
      if (qty < 1) return res.status(400).json({ message: 'Quantity must be at least 1' });

      const result = await usersCollection.updateOne(
        { _id: new ObjectId(req.user.id), 'cart.productId': itemId },
        { $set: { 'cart.$.quantity': qty } }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ message: 'Cart item not found' });
      }

      res.json({ message: 'Cart updated' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Remove item from cart
  router.delete('/:itemId', requireAuth, async (req, res) => {
    try {
      const { itemId } = req.params;

      const result = await usersCollection.updateOne(
        { _id: new ObjectId(req.user.id) },
        { $pull: { cart: { productId: itemId } } }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({ message: 'Removed from cart' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Clear cart
  router.delete('/clear', requireAuth, async (req, res) => {
    try {
      await usersCollection.updateOne(
        { _id: new ObjectId(req.user.id) },
        { $set: { cart: [] } }
      );

      res.json({ message: 'Cart cleared' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  return router;
}

module.exports = createCartRouter;
