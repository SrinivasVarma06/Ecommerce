// Load .env file only in development (Render provides env vars directly)
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: __dirname + '/.env' });
}
const express=require('express');
const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken');
const cors=require('cors');

const app=express();

// CORS configuration for production
const corsOptions = {
  origin: process.env.FRONTEND_URL 
    ? [process.env.FRONTEND_URL, 'http://localhost:8080', 'http://localhost:5173'] 
    : '*', // Allow all origins in development
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());

// Serve static files from the parent directory (where delivery-management.html is located)
app.use(express.static('../'));

const PORT=process.env.PORT || 5000;
const JWT_SECRET=process.env.JWT_SECRET
const JWT_EXPIRES_IN=process.env.JWT_EXPIRES_IN 


const { MongoClient, ObjectId } = require('mongodb');
const MONGODB_URI = process.env.MONGODB_URI 
const DB_NAME = 'Ecommerce2';
let usersCollection;
let productsCollection;
let reviewsCollection;
let ordersCollection;
let deliveryAgentsCollection;
let deliveryStationsCollection;
let gamificationCollection;
let priceHistoryCollection;

function generateToken(user){
    const payload={id:user.id,email:user.email,role:user.role || 'user'};
    return jwt.sign(payload,JWT_SECRET,{expiresIn:JWT_EXPIRES_IN});
}

function authMiddleware(req,res,next){
    const auth=req.headers.authorization;
    if(!auth || !auth.startsWith('Bearer '))
        return res.status(401).json({message: 'Missing token'});
    const token=auth.split(' ')[1];
    try{
        const payload=jwt.verify(token,JWT_SECRET);
        req.user=payload;
        next();
    } catch(err) {
        return res.status(401).json({message: 'Invalid or expired token'});
    }
}

function adminMiddleware(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
    }
    next();
}

MongoClient.connect(MONGODB_URI).then(client => {
    const db = client.db(DB_NAME);
    productsCollection = db.collection('products');
    usersCollection = db.collection('users');
    reviewsCollection = db.collection('reviews');
    ordersCollection = db.collection('orders');
    deliveryAgentsCollection = db.collection('deliveryAgents');
    deliveryStationsCollection = db.collection('deliveryStations');
    gamificationCollection = db.collection('gamification');
    priceHistoryCollection = db.collection('priceHistory');

    const createProductsRouter = require('./routes/products');
    const createWishlistRouter = require('./routes/wishlist');
    const createReviewsRouter = require('./routes/reviews');
    const createCartRouter = require('./routes/cart');
    const createOrdersRouter = require('./routes/orders');
    const createAdminRouter = require('./routes/admin');
    const createDeliveryRouter = require('./routes/delivery');
    const createGamificationRouter = require('./routes/gamification');
    const createPriceTrackingRouter = require('./routes/priceTracking');

    app.use('/api/products', createProductsRouter(productsCollection));
    app.use('/api/admin/products', authMiddleware, adminMiddleware, createProductsRouter(productsCollection));
    app.use('/api/admin', authMiddleware, adminMiddleware, createAdminRouter(usersCollection, ordersCollection, productsCollection));
    
    // Wishlist routes (requires auth)
    app.use('/api/wishlist', authMiddleware, createWishlistRouter(usersCollection, productsCollection));
    
    // Cart routes (requires auth)
    app.use('/api/cart', authMiddleware, createCartRouter(usersCollection, productsCollection));
    
    // Orders routes (requires auth)
    app.use('/api/orders', authMiddleware, createOrdersRouter(usersCollection, ordersCollection, productsCollection));
    
    // Delivery routes (for agents and tracking)
    app.use('/api/delivery', createDeliveryRouter(ordersCollection, deliveryAgentsCollection, deliveryStationsCollection));
    
    // Gamification routes
    app.use('/api/gamification', authMiddleware, createGamificationRouter(usersCollection, gamificationCollection));
    
    // Price tracking routes
    app.use('/api/price-tracking', createPriceTrackingRouter(productsCollection, priceHistoryCollection));
    
    // Reviews routes (reviews endpoint requires auth for POST)
    app.use('/api/products', createReviewsRouter(productsCollection, reviewsCollection,authMiddleware));

    app.listen(PORT, () => {
        console.log(`Auth server started on http://localhost:${PORT}`);
    });
    console.log('Connected to MongoDB');
})
.catch(err => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
});

app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password)
            return res.status(400).json({ message: 'Missing fields' });
        const existing = await usersCollection.findOne({ email: email.toLowerCase() });
        if (existing) return res.status(400).json({ message: 'Email already registered' });

        const passwordHash = await bcrypt.hash(password, 10);
        const newUser = { name, email: email.toLowerCase(), passwordHash, role: 'user' };
        const result = await usersCollection.insertOne(newUser);
        newUser._id = result.insertedId;

        const token = generateToken({ id: newUser._id, email: newUser.email, role: newUser.role });
        const userSafe = { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role };
        res.json({ user: userSafe, token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: 'Missing fields' });

        const user = await usersCollection.findOne({ email: email.toLowerCase() });
        if (!user) return res.status(401).json({ message: 'Invalid user' });

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return res.status(401).json({ message: 'Invalid password' });

        const token = generateToken({ id: user._id, email: user.email, role: user.role });
        const userSafe = { id: user._id, name: user.name, email: user.email, role: user.role };
        res.json({ user: userSafe, token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/auth/logout', (req, res) => {
    res.json({ message: 'Logged out' });
});

app.get('/api/auth/profile', authMiddleware, async (req, res) => {
    try {
        const user = await usersCollection.findOne({ _id: new ObjectId(req.user.id) });
        if (!user) return res.status(404).json({ message: 'User not found' });
        const userSafe = { id: user._id, name: user.name, email: user.email, role: user.role };
        res.json({ user: userSafe });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});
