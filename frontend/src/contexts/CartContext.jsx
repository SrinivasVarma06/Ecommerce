import React, { createContext, useContext, useState, useEffect } from 'react';
import { cartAPI } from '@/services/api';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

const CartContext = createContext(undefined);

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();
  const { toast } = useToast();

  // Load cart when user logs in
  useEffect(() => {
    if (token) {
      loadCart();
    } else {
      setItems([]);
    }
  }, [token]);

  const loadCart = async () => {
    if (!token) return;
    try {
      const data = await cartAPI.get(token);
      setItems(data.items || []);
    } catch (error) {
      console.error('Failed to load cart:', error);
    }
  };

  const addToCart = async (product, quantity = 1) => {
    if (!token) {
      toast({
        title: 'Login Required',
        description: 'Please login to add items to cart',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const productId = (product.id || product._id)?.toString();
      await cartAPI.add(productId, quantity, token);
      await loadCart();
      toast({
        title: 'Added to Cart',
        description: `${product.name} has been added to your cart`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    if (!token) return;
    setLoading(true);
    try {
      await cartAPI.update(itemId, quantity, token);
      await loadCart();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (itemId) => {
    if (!token) return;
    setLoading(true);
    try {
      await cartAPI.remove(itemId, token);
      await loadCart();
      toast({
        title: 'Item Removed',
        description: 'Item has been removed from your cart',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    if (!token) return;
    setLoading(true);
    try {
      await cartAPI.clear(token);
      setItems([]);
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalItems,
        totalPrice,
        loading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};




