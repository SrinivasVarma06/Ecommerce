import React, { createContext, useContext, useState, useEffect } from 'react';
import { wishlistAPI } from '@/services/api';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

interface WishlistContextType {
  items: any[];
  addToWishlist: (product: any) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  loading: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<any[]>([]);
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
      const data: any = await wishlistAPI.get(token);
      setItems(data.items || []);
    } catch (error) {
      console.error('Failed to load wishlist:', error);
    }
  };

  const addToWishlist = async (product: any) => {
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
      await wishlistAPI.add(product.id, token);
      await loadWishlist();
      toast({
        title: 'Added to Wishlist',
        description: `${product.name} has been added to your wishlist`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (productId: string) => {
    if (!token) return;
    setLoading(true);
    try {
      await wishlistAPI.remove(productId, token);
      await loadWishlist();
      toast({
        title: 'Removed from Wishlist',
        description: 'Item has been removed from your wishlist',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const isInWishlist = (productId: string) => {
    return items.some((item) => item.id === productId);
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
