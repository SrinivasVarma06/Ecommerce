const BASE_URL = 'http://localhost:5000/api';

async function apiCall(endpoint, options = {}) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || 'API request failed');
  }

  return response.json();
}

export const authAPI = {
  login: (email, password) =>
    apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (name, email, password) =>
    apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),

  logout: () =>
    apiCall('/auth/logout', {
      method: 'POST',
    }),

  getProfile: (token) =>
    apiCall('/auth/profile', {
      headers: { Authorization: `Bearer ${token}` },
    }),
};

export const productsAPI = {
  getAll: (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return apiCall(`/products?${queryParams}`);
  },

  getById: (id) =>
    apiCall(`/products/${id}`),

  getCategories: () =>
    apiCall('/products/categories'),

  getRecommendations: (productId) =>
    apiCall(`/products/${productId}/recommendations`),

  getReviews: (productId) =>
    apiCall(`/products/${productId}/reviews`),

  addReview: (productId, rating, comment, token) =>
    apiCall(`/products/${productId}/reviews`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ rating, comment }),
    }),
};

// Cart API
export const cartAPI = {
  get: (token) =>
    apiCall('/cart', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  add: (productId, quantity, token) =>
    apiCall('/cart', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ productId, quantity }),
    }),

  update: (itemId, quantity, token) =>
    apiCall(`/cart/${itemId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ quantity }),
    }),

  remove: (itemId, token) =>
    apiCall(`/cart/${itemId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }),

  clear: (token) =>
    apiCall('/cart/clear', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }),
};

// Orders API
export const ordersAPI = {
  create: (orderData, token) =>
    apiCall('/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(orderData),
    }),

  getAll: (token) =>
    apiCall('/orders', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getById: (orderId, token) =>
    apiCall(`/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  updateStatus: (orderId, status, token) =>
    apiCall(`/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    }),

  requestReturn: (orderId, productId, token) =>
    apiCall(`/orders/${orderId}/returns`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ productId }),
    }),
};

// Wishlist API
export const wishlistAPI = {
  get: (token) =>
    apiCall('/wishlist', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  add: (productId, token) =>
    apiCall('/wishlist', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ productId }),
    }),

  remove: (productId, token) =>
    apiCall(`/wishlist/${productId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }),
};

// Admin API
export const adminAPI = {
  // Products Management
  createProduct: (productData, token) =>
    apiCall('/admin/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(productData),
    }),

  updateProduct: (productId, productData, token) =>
    apiCall(`/admin/products/${productId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(productData),
    }),

  deleteProduct: (productId, token) =>
    apiCall(`/admin/products/${productId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }),

  // Orders Management
  getAllOrders: (token) =>
    apiCall('/admin/orders', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  approveReturn: (orderId, productId, token) =>
    apiCall(`/admin/orders/${orderId}/returns/${productId}/approve`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
    }),

  // Analytics
  getAnalytics: (token) =>
    apiCall('/admin/analytics', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getRevenueData: (period, token) =>
    apiCall(`/admin/analytics/revenue?period=${period}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
};

// Gamification API
export const gamificationAPI = {
  getProfile: (token) =>
    apiCall('/gamification/profile', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  awardPoints: (action, amount, metadata, token) =>
    apiCall('/gamification/award-points', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action, amount, metadata }),
    }),

  dailyLogin: (token) =>
    apiCall('/gamification/daily-login', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),

  getAchievements: (token) =>
    apiCall('/gamification/achievements', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  redeem: (points, token) =>
    apiCall('/gamification/redeem', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ points }),
    }),

  getLeaderboard: (token) =>
    apiCall('/gamification/leaderboard', {
      headers: { Authorization: `Bearer ${token}` },
    }),
};

// Price Tracking API
export const priceTrackingAPI = {
  getHistory: (productId) =>
    apiCall(`/price-tracking/history/${productId}`),

  getAnalysis: (productId) =>
    apiCall(`/price-tracking/analysis/${productId}`),

  setAlert: (productId, targetPrice, userId, token) =>
    apiCall('/price-tracking/alert', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ productId, targetPrice, userId }),
    }),
};
