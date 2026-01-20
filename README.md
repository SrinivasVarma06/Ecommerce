# 🛒 ShopZone E-Commerce Platform

A full-stack e-commerce application with React frontend and Node.js/Express backend, featuring real-time delivery tracking with Google Maps integration.

## 📁 Project Structure

```
Ecommerce/
├── frontend/                    # React + Vite frontend application
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   │   ├── animations/      # Cart animations, flying items
│   │   │   ├── gamification/    # Rewards & badges
│   │   │   ├── layout/          # Header, Footer
│   │   │   ├── products/        # Product cards, reviews
│   │   │   ├── tracking/        # Live delivery tracking map
│   │   │   └── ui/              # shadcn/ui components
│   │   ├── contexts/            # React contexts (Auth, Cart, etc.)
│   │   ├── hooks/               # Custom React hooks
│   │   ├── lib/                 # Utility functions
│   │   ├── pages/               # Page components
│   │   │   └── admin/           # Admin dashboard pages
│   │   └── services/            # API service functions
│   ├── public/                  # Static assets
│   ├── index.html               # Entry HTML file
│   ├── vite.config.js           # Vite configuration
│   ├── tailwind.config.js       # Tailwind CSS configuration
│   ├── .env.local               # Development environment variables
│   └── package.json             # Frontend dependencies
│
├── backend/                     # Node.js + Express backend API
│   ├── routes/                  # API route handlers
│   │   ├── admin.js             # Admin endpoints
│   │   ├── cart.js              # Cart management
│   │   ├── delivery.js          # Delivery tracking & agents
│   │   ├── gamification.js      # Rewards & points
│   │   ├── orders.js            # Order management
│   │   ├── priceTracking.js     # Price history & alerts
│   │   ├── products.js          # Product CRUD
│   │   ├── reviews.js           # Product reviews
│   │   └── wishlist.js          # Wishlist management
│   ├── server.js                # Express app entry point
│   ├── .env                     # Backend environment variables
│   └── package.json             # Backend dependencies
│
├── docs/                        # Documentation
│   ├── README.md                # Original README
│   ├── DEPLOYMENT.md            # Deployment guide
│   ├── DEPLOYMENT-CHECKLIST.md  # Pre-deployment checklist
│   ├── DELIVERY_SYSTEM_DOCUMENTATION.md
│   ├── README_DELIVERY_SYSTEM.md
│   └── GAMIFICATION_PRICE_PREDICTION.md
│
├── tools/                       # Development & testing tools
│   └── delivery-management.html # Delivery station management UI
│
├── package.json                 # Root workspace scripts
├── vercel.json                  # Vercel deployment config
└── render.yaml                  # Render deployment config
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Google Maps API key (for delivery tracking)

### Installation

```bash
# Install all dependencies (root, frontend, and backend)
npm run install:all

# Or install individually
npm install           # Root dependencies
cd frontend && npm install
cd ../backend && npm install
```

### Environment Setup

**Frontend** (`frontend/.env.local`):
```env
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

**Backend** (`backend/.env`):
```env
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:8080
```

### Development

```bash
# Run both frontend and backend concurrently
npm run dev

# Or run separately
npm run dev:frontend  # Runs on http://localhost:8080
npm run dev:backend   # Runs on http://localhost:5000
```

### Production Build

```bash
npm run build  # Builds frontend to frontend/dist
```

## 🌟 Features

### Customer Features
- 🛍️ Browse products with categories & filters
- 🛒 Shopping cart with animations
- ❤️ Wishlist management
- 📦 Order tracking with live GPS map
- ⭐ Product reviews & ratings
- 🎮 Gamification (points, badges, leaderboard)
- 📊 Price drop alerts & predictions

### Admin Features
- 📊 Analytics dashboard
- 📦 Product management
- 📋 Order management
- 🚚 Delivery tracking
- 👥 User management

### Delivery System
- 🗺️ Real-time Google Maps tracking
- 🏪 Multi-stage delivery network (Fulfillment → Regional → Local)
- 🚴 Delivery agent management
- 📍 GPS-based status updates

## 📖 Documentation

See the [docs/](docs/) folder for detailed documentation:
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Delivery System Documentation](docs/DELIVERY_SYSTEM_DOCUMENTATION.md)
- [Gamification Features](docs/GAMIFICATION_PRICE_PREDICTION.md)

## 🛠️ Tech Stack

**Frontend:**
- React 18 + Vite
- Tailwind CSS + shadcn/ui
- React Router DOM
- Framer Motion (animations)
- Google Maps API
- React Query

**Backend:**
- Node.js + Express 5
- MongoDB + MongoDB Driver
- JWT Authentication
- BCrypt (password hashing)

## 📜 License

ISC License
