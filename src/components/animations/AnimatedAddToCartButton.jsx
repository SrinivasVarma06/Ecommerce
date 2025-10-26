import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAnimation } from '@/contexts/AnimationContext';

const AnimatedAddToCartButton = ({ 
  product, 
  onAddToCart, 
  disabled = false,
  className = "",
  children 
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const buttonRef = useRef(null);
  const { addFlyingItem, triggerConfetti } = useAnimation();

  const handleAddToCart = async (e) => {
    if (disabled || isAdding) return;

    e.preventDefault();
    e.stopPropagation();

    setIsAdding(true);

    // Get button position for flying animation
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const startPosition = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };
      
      // Trigger flying animation
      addFlyingItem(product, startPosition);
    }

    try {
      await onAddToCart();
      
      // Success animation
      setIsAdded(true);
      triggerConfetti('success');
      
      setTimeout(() => {
        setIsAdded(false);
        setIsAdding(false);
      }, 1500);
      
    } catch (error) {
      setIsAdding(false);
      console.error('Failed to add to cart:', error);
    }
  };

  return (
    <Button
      ref={buttonRef}
      onClick={handleAddToCart}
      disabled={disabled || isAdding}
      className={`relative overflow-hidden ${className}`}
    >
      <motion.div
        initial={false}
        animate={isAdding ? { scale: 0.95 } : { scale: 1 }}
        className="flex items-center gap-2"
      >
        {isAdded ? (
          <motion.div
            initial={{ scale: 0, rotate: 180 }}
            animate={{ scale: 1, rotate: 0 }}
            className="flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            Added!
          </motion.div>
        ) : (
          <>
            <motion.div
              animate={isAdding ? { rotate: 360 } : { rotate: 0 }}
              transition={{ duration: 0.5 }}
            >
              <ShoppingCart className="w-4 h-4" />
            </motion.div>
            {children || 'Add to Cart'}
          </>
        )}
      </motion.div>

      {/* Loading overlay */}
      {isAdding && (
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        />
      )}
    </Button>
  );
};

export default AnimatedAddToCartButton;