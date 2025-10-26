const express = require('express');
const { ObjectId } = require('mongodb');

function createProductsRouter(productsCollection) {
  const router = express.Router();


  router.get('/', async (req, res) => {
    try {
      const { category, search, sort } = req.query;
      const query = {};
      if (category && category.trim() !== '') {
        const categories = category.split(',').map(c => c.trim()).filter(c => c);
        if (categories.length > 1) {
          query.category = { 
            $in: categories.map(cat => new RegExp(`^${cat}$`, 'i')) 
          };
        } else if (categories.length === 1) {
          query.category = new RegExp(`^${categories[0]}$`, 'i');
        }
      }
      
      if (search && search.trim() !== '') {
        query.name = { $regex: search, $options: 'i' };
      }

      let cursor = productsCollection.find(query);
      if (sort === 'price-low') cursor = cursor.sort({ price: 1 });
      else if (sort === 'price-high') cursor = cursor.sort({ price: -1 });
      else if (sort === 'newest') cursor = cursor.sort({ _id: -1 });
      else if (sort === 'rating') cursor = cursor.sort({ rating: -1 });

      const products = await cursor.toArray();
      res.json(products);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  router.get('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      console.log('Fetching product with ID:', id);
      
      // Validate ObjectId format
      if (!ObjectId.isValid(id)) {
        console.log('Invalid ObjectId format:', id);
        return res.status(400).json({ message: 'Invalid product ID format' });
      }
      
      const product = await productsCollection.findOne({ _id: new ObjectId(id) });
      
      if (!product) {
        console.log('Product not found for ID:', id);
        return res.status(404).json({ message: 'Product not found' });
      }
      
      console.log('Product found:', product.name);
      res.json(product);
    } catch (err) {
      console.error('Error fetching product:', err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Add product (admin only, simple version)
  router.post('/', async (req, res) => {
    try {
      const { name, description, price, image, category, stock } = req.body;
      if (!name || !price) return res.status(400).json({ message: 'Name and price are required' });
      const newProduct = {
        name,
        description,
        price: Number(price),
        image,
        category,
        stock: Number(stock) || 0,
      };
      const result = await productsCollection.insertOne(newProduct);
      newProduct._id = result.insertedId;
      res.status(201).json(newProduct);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  router.put('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, price, image, category, stock } = req.body;
      const update = {};
      if (name !== undefined) update.name = name;
      if (description !== undefined) update.description = description;
      if (price !== undefined) update.price = Number(price);
      if (image !== undefined) update.image = image;
      if (category !== undefined) update.category = category;
      if (stock !== undefined) update.stock = Number(stock);
      const result = await productsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: update }
      );
      if (result.matchedCount === 0) return res.status(404).json({ message: 'Product not found' });
      res.json({ message: 'Product updated' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });
  router.delete('/:id',async(req,res)=>{
    try{
      const {id}=req.params;
      const result=await productsCollection.deleteOne({_id:new ObjectId(id)});
      if(result.deletedCount===0)
        return res.status(404).json({message:'Product not Found'});
      res.json({message:'Product Deleted'});
    }catch(err){
      console.error(err);
      res.status(500).json({message:'Server error'});
    }
  });
  return router;
}

module.exports = createProductsRouter;