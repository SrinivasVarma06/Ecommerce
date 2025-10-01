/**
 * API Service Layer
 * 
 * This file contains all API calls to your MongoDB backend.
 * Replace the BASE_URL with your actual backend API URL.
 * Each function returns a Promise that you can handle in your components.
 */

const BASE_URL = 'http://localhost:5000/api'; // Replace with your MongoDB backend URL

// Helper function for API calls
async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || 'API request failed');
  }

  return response.json();
}

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (name: string, email: string, password: string) =>
    apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),

  logout: () =>
    apiCall('/auth/logout', {
      method: 'POST',
    }),

  getProfile: (token: string) =>
    apiCall('/auth/profile', {
      headers: { Authorization: `Bearer ${token}` },
    }),
};

// Products API
export const productsAPI = {
  getAll: (params?: { category?: string; search?: string; sort?: string; page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams(params as any).toString();
    return apiCall(`/products?${queryParams}`);
  },

  getById: (id: string) =>
    apiCall(`/products/${id}`),

  getCategories: () =>
    apiCall('/products/categories'),

  getRecommendations: (productId: string) =>
    apiCall(`/products/${productId}/recommendations`),

  getReviews: (productId: string) =>
    apiCall(`/products/${productId}/reviews`),

  addReview: (productId: string, rating: number, comment: string, token: string) =>
    apiCall(`/products/${productId}/reviews`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ rating, comment }),
    }),
};

// Cart API
export const cartAPI = {
  get: (token: string) =>
    apiCall('/cart', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  add: (productId: string, quantity: number, token: string) =>
    apiCall('/cart', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ productId, quantity }),
    }),

  update: (itemId: string, quantity: number, token: string) =>
    apiCall(`/cart/${itemId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ quantity }),
    }),

  remove: (itemId: string, token: string) =>
    apiCall(`/cart/${itemId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }),

  clear: (token: string) =>
    apiCall('/cart/clear', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }),
};

// Orders API
export const ordersAPI = {
  create: (orderData: any, token: string) =>
    apiCall('/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(orderData),
    }),

  getAll: (token: string) =>
    apiCall('/orders', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getById: (orderId: string, token: string) =>
    apiCall(`/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  updateStatus: (orderId: string, status: string, token: string) =>
    apiCall(`/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    }),
};

// Wishlist API
export const wishlistAPI = {
  get: (token: string) =>
    apiCall('/wishlist', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  add: (productId: string, token: string) =>
    apiCall('/wishlist', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ productId }),
    }),

  remove: (productId: string, token: string) =>
    apiCall(`/wishlist/${productId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }),
};

// Admin API
export const adminAPI = {
  // Products Management
  createProduct: (productData: any, token: string) =>
    apiCall('/admin/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(productData),
    }),

  updateProduct: (productId: string, productData: any, token: string) =>
    apiCall(`/admin/products/${productId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(productData),
    }),

  deleteProduct: (productId: string, token: string) =>
    apiCall(`/admin/products/${productId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }),

  // Orders Management
  getAllOrders: (token: string) =>
    apiCall('/admin/orders', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  // Analytics
  getAnalytics: (token: string) =>
    apiCall('/admin/analytics', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getRevenueData: (period: string, token: string) =>
    apiCall(`/admin/analytics/revenue?period=${period}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
};
