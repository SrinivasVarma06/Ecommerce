import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAnimation } from '@/contexts/AnimationContext';

const AnimatedCartIcon = ({ className = "" }) => {
  const { totalItems } = useCart();
  const { isCartAnimating } = useAnimation();

  const itemCount = totalItems || 0;

  return (
    <motion.div 
      className={`relative ${className}`}
      animate={isCartAnimating ? {
        scale: [1, 1.2, 1],
        rotate: [0, 10, -10, 0]
      } : {}}
      transition={{ duration: 0.3 }}
    >
      <ShoppingCart className="w-6 h-6" />
      {itemCount > 0 && (
        <motion.div
          key={itemCount} // Key changes trigger re-animation
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            type: "spring", 
            stiffness: 500, 
            damping: 25 
          }}
          className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold"
        >
          {itemCount}
        </motion.div>
      )}
    </motion.div>
  );
};

export default AnimatedCartIcon;