import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAnimation } from '@/contexts/AnimationContext';

const FlyingCartItems = () => {
  const { flyingItems } = useAnimation();

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <AnimatePresence>
        {flyingItems.map((item) => (
          <motion.div
            key={item.id}
            initial={{
              x: item.startPosition?.x || window.innerWidth / 2,
              y: item.startPosition?.y || window.innerHeight / 2,
              scale: 1,
              opacity: 1
            }}
            animate={{
              x: window.innerWidth - 100, // Cart position
              y: 20, // Top of screen
              scale: 0.3,
              opacity: 0.8
            }}
            exit={{
              scale: 0,
              opacity: 0
            }}
            transition={{
              duration: 0.8,
              ease: [0.25, 0.46, 0.45, 0.94]
            }}
            className="absolute"
          >
            <div className="bg-white rounded-lg shadow-lg p-2 border-2 border-green-400">
              <img 
                src={item.product?.image || '/placeholder.svg'} 
                alt={item.product?.name || 'Product'}
                className="w-12 h-12 object-cover rounded"
              />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default FlyingCartItems;