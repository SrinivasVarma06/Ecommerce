# ShopZone - Next-Gen E-Commerce Platform

## Overview

A modern, full-stack e-commerce platform built with the MERN stack featuring unique gamification, rewards system, and advanced delivery tracking.

## Features

- **Customer Dashboard**: Product browsing, search, cart, wishlist, checkout, and order history
- **Gamification System**: 5-tier loyalty program (Bronze to Diamond) with points, achievements, and leaderboard  
- **Live Delivery Tracking**: 9-stage real-time order tracking from placement to delivery
- **Admin Panel**: Complete CRUD operations for products, order management, and sales analytics
- **Secure Authentication**: JWT-based authentication system
- **Price Intelligence**: Smart price tracking and recommendations (experimental)

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, shadcn/ui, Framer Motion
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: JWT

## Getting Started

### Prerequisites

- Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- MongoDB installed locally or MongoDB Atlas account

### Installation

1. Clone the repository:
```sh
git clone https://github.com/SrinivasVarma06/Ecommerce.git
cd next-gen-commerce-mentor
```

2. Install frontend dependencies:
```sh
npm install
```

3. Install backend dependencies:
```sh
cd backend
npm install
cd ..
```

4. Set up environment variables:

Create a `.env` file in the `backend` directory with:
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
PORT=5000
```

5. Run the application:

**Backend:**
```sh
cd backend
npm run dev
```

**Frontend:**
```sh
npm run dev
```

The application will be available at `http://localhost:8080`

## Project Structure

```
├── src/                    # Frontend source code
│   ├── components/         # React components
│   ├── contexts/          # Context providers
│   ├── pages/             # Page components
│   └── services/          # API services
├── backend/               # Backend source code
│   ├── routes/            # API routes
│   └── server.js          # Express server
└── public/                # Static assets
```

## Key Features Explained

### Gamification System
- Earn points through purchases, reviews, and daily logins
- Progress through 5 levels: Bronze, Silver, Gold, Platinum, Diamond
- Unlock achievements and compete on the leaderboard
- Redeem points for discounts (100 points = $1 off)

### Delivery Tracking
9-stage tracking system:
1. Order Placed
2. Fulfillment Processing
3. Regional Transit
4. Local Station
5. Waiting for Agent
6. Agent Assigned
7. Picked Up
8. On the Way
9. Delivered

### Admin Features
- Product management (CRUD operations)
- Order status updates
- Sales analytics and revenue tracking
- User management
- Return request handling

## Author

**Srinivas Varma**

## License

This project is open source and available under the MIT License.
