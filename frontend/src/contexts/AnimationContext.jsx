import React, { createContext, useContext, useState } from 'react';
import confetti from 'canvas-confetti';

const AnimationContext = createContext();

export const useAnimation = () => {
  const context = useContext(AnimationContext);
  if (!context) {
    throw new Error('useAnimation must be used within an AnimationProvider');
  }
  return context;
};

export const AnimationProvider = ({ children }) => {
  const [cartItemCount, setCartItemCount] = useState(0);
  const [isCartAnimating, setIsCartAnimating] = useState(false);
  const [flyingItems, setFlyingItems] = useState([]);

  // Confetti celebration
  const triggerConfetti = (type = 'success') => {
    const colors = {
      success: ['#10b981', '#34d399', '#6ee7b7'],
      order: ['#3b82f6', '#60a5fa', '#93c5fd'],
      review: ['#f59e0b', '#fbbf24', '#fcd34d']
    };

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: colors[type] || colors.success
    });
  };

  // Burst confetti for major celebrations
  const triggerBurstConfetti = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti(Object.assign({}, defaults, { 
        particleCount, 
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } 
      }));
      confetti(Object.assign({}, defaults, { 
        particleCount, 
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } 
      }));
    }, 250);
  };

  // Flying cart animation
  const addFlyingItem = (productData, startPosition) => {
    const flyingItem = {
      id: Date.now() + Math.random(),
      product: productData,
      startPosition,
      timestamp: Date.now()
    };

    setFlyingItems(prev => [...prev, flyingItem]);
    setIsCartAnimating(true);

    // Remove flying item after animation
    setTimeout(() => {
      setFlyingItems(prev => prev.filter(item => item.id !== flyingItem.id));
      setIsCartAnimating(false);
      
      // Trigger cart bounce animation
      setCartItemCount(prev => prev + 1);
      setTimeout(() => setCartItemCount(prev => prev), 100);
    }, 800);
  };

  // Cart bounce animation
  const bounceCart = () => {
    setIsCartAnimating(true);
    setTimeout(() => setIsCartAnimating(false), 300);
  };

  const value = {
    cartItemCount,
    setCartItemCount,
    isCartAnimating,
    flyingItems,
    triggerConfetti,
    triggerBurstConfetti,
    addFlyingItem,
    bounceCart
  };

  return (
    <AnimationContext.Provider value={value}>
      {children}
    </AnimationContext.Provider>
  );
};