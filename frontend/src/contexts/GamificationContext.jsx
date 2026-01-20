import React, { createContext, useContext, useState, useEffect } from 'react';
import { gamificationAPI } from '@/services/api';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';
import confetti from 'canvas-confetti';

const GamificationContext = createContext(undefined);

export const GamificationProvider = ({ children }) => {
  const [profile, setProfile] = useState(null);
  const [currentLevel, setCurrentLevel] = useState(null);
  const [nextLevel, setNextLevel] = useState(null);
  const [pointsToNextLevel, setPointsToNextLevel] = useState(0);
  const [loading, setLoading] = useState(false);
  const { token, user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (token) {
      loadProfile();
      checkDailyLogin();
    } else {
      setProfile(null);
      setCurrentLevel(null);
      setNextLevel(null);
    }
  }, [token]);

  const loadProfile = async () => {
    if (!token) return;
    try {
      const data = await gamificationAPI.getProfile(token);
      setProfile(data.profile);
      setCurrentLevel(data.currentLevel);
      setNextLevel(data.nextLevel);
      setPointsToNextLevel(data.pointsToNextLevel);
    } catch (error) {
      console.error('Failed to load gamification profile:', error);
    }
  };

  const checkDailyLogin = async () => {
    if (!token) return;
    try {
      const result = await gamificationAPI.dailyLogin(token);
      if (result.success) {
        toast({
          title: '🎉 Daily Login Bonus!',
          description: `+${result.pointsAwarded} points! ${result.message}`,
        });
        await loadProfile();
      }
    } catch (error) {
      // Silent fail for daily login check
      console.log('Daily login already claimed');
    }
  };

  const awardPoints = async (action, amount, metadata = {}) => {
    if (!token) return;
    setLoading(true);
    try {
      const result = await gamificationAPI.awardPoints(action, amount, metadata, token);
      
      if (result.success) {
        // Show toast notification
        toast({
          title: '🌟 Points Earned!',
          description: `+${result.pointsAwarded} points`,
        });

        // Check if user leveled up
        if (result.leveledUp) {
          confetti({
            particleCount: 150,
            spread: 100,
            origin: { y: 0.6 }
          });
          toast({
            title: '🎊 Level Up!',
            description: `Congratulations! You're now ${result.newLevel.name}!`,
            duration: 5000,
          });
        }

        // Check for new achievements
        if (result.newAchievements && result.newAchievements.length > 0) {
          result.newAchievements.forEach(achievement => {
            toast({
              title: '🏆 Achievement Unlocked!',
              description: `${achievement.icon} ${achievement.name}`,
              duration: 5000,
            });
          });
        }

        await loadProfile();
      }
    } catch (error) {
      console.error('Failed to award points:', error);
    } finally {
      setLoading(false);
    }
  };

  const redeemPoints = async (points) => {
    if (!token) return;
    setLoading(true);
    try {
      const result = await gamificationAPI.redeem(points, token);
      if (result.success) {
        toast({
          title: '✅ Points Redeemed!',
          description: `$${result.discountAmount} discount applied`,
        });
        await loadProfile();
        return result;
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    profile,
    currentLevel,
    nextLevel,
    pointsToNextLevel,
    loading,
    awardPoints,
    redeemPoints,
    loadProfile,
  };

  return (
    <GamificationContext.Provider value={value}>
      {children}
    </GamificationContext.Provider>
  );
};

export const useGamification = () => {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error('useGamification must be used within GamificationProvider');
  }
  return context;
};
