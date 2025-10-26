import React, { createContext, useContext, useState, useEffect } from 'react';
import { wishlistAPI } from '@/services/api';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

const WishlistContext = createContext(undefined);

export const WishlistProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (token) {
      loadWishlist();
    } else {
      setItems([]);
    }
  }, [token]);

  const loadWishlist = async () => {
    if (!token) return;
    try {
      const data = await wishlistAPI.get(token);
      setItems(data.items || []);
    } catch (error) {
      console.error('Failed to load wishlist:', error);
    }
  };

  const addToWishlist = async (product) => {
    if (!token) {
      toast({
        title: 'Login Required',
        description: 'Please login to add items to wishlist',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      await wishlistAPI.add(product._id, token);
      await loadWishlist();
      toast({
        title: 'Added to Wishlist',
        description: `${product.name} has been added to your wishlist`,
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

  const removeFromWishlist = async (productId) => {
    if (!token) return;
    setLoading(true);
    try {
      await wishlistAPI.remove(productId, token);
      await loadWishlist();
      toast({
        title: 'Removed from Wishlist',
        description: 'Item has been removed from your wishlist',
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

  const isInWishlist = (productId) => {
    return items.some((item) => {
      const itemId=item.id || item._id;
      return itemId && itemId.toString() === productId.toString();
    })
  };

  return (
    <WishlistContext.Provider
      value={{
        items,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        loading,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within WishlistProvider');
  }
  return context;
};




