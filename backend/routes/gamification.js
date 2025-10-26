const express = require('express');
const { ObjectId } = require('mongodb');

function createGamificationRouter(usersCollection, gamificationCollection) {
  const router = express.Router();

  // Middleware to verify authentication
  const requireAuth = (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    next();
  };

  // Points and rewards configuration
  const POINTS_CONFIG = {
    ORDER: 100,           // Points per $1 spent
    REVIEW: 50,           // Points for writing a review
    WISHLIST: 10,         // Points for adding to wishlist
    DAILY_LOGIN: 5,       // Points for daily login
    FIRST_PURCHASE: 500,  // Bonus for first purchase
    REFERRAL: 1000        // Points for successful referral
  };

  const LEVELS = [
    { level: 1, name: 'Bronze', minPoints: 0, color: '#cd7f32', benefits: 'Welcome to ShopZone!' },
    { level: 2, name: 'Silver', minPoints: 1000, color: '#c0c0c0', benefits: '5% extra discount on all orders' },
    { level: 3, name: 'Gold', minPoints: 5000, color: '#ffd700', benefits: '10% extra discount + Free shipping' },
    { level: 4, name: 'Platinum', minPoints: 15000, color: '#e5e4e2', benefits: '15% extra discount + Priority support' },
    { level: 5, name: 'Diamond', minPoints: 50000, color: '#b9f2ff', benefits: '20% extra discount + VIP perks' }
  ];

  const ACHIEVEMENTS = [
    { id: 'first_order', name: 'First Steps', description: 'Complete your first order', points: 100, icon: '🎯' },
    { id: 'five_orders', name: 'Regular Shopper', description: 'Complete 5 orders', points: 500, icon: '🛍️' },
    { id: 'ten_orders', name: 'Shopping Pro', description: 'Complete 10 orders', points: 1000, icon: '⭐' },
    { id: 'first_review', name: 'Reviewer', description: 'Write your first review', points: 50, icon: '✍️' },
    { id: 'ten_reviews', name: 'Critic', description: 'Write 10 reviews', points: 500, icon: '📝' },
    { id: 'week_streak', name: 'Dedicated', description: 'Login for 7 days in a row', points: 200, icon: '🔥' },
    { id: 'wishlist_master', name: 'Wishlist Master', description: 'Add 20 items to wishlist', points: 300, icon: '❤️' },
    { id: 'big_spender', name: 'Big Spender', description: 'Spend over $1000', points: 2000, icon: '💎' }
  ];

  // Initialize gamification profile for new user
  const initializeUserGamification = async (userId) => {
    const existingProfile = await gamificationCollection.findOne({ userId });
    if (existingProfile) return existingProfile;

    const profile = {
      userId,
      points: 0,
      level: 1,
      totalPointsEarned: 0,
      achievements: [],
      dailyLoginStreak: 0,
      lastLoginDate: new Date(),
      pointsHistory: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await gamificationCollection.insertOne(profile);
    return profile;
  };

  // Get user's gamification profile
  router.get('/profile', requireAuth, async (req, res) => {
    try {
      let profile = await gamificationCollection.findOne({ userId: req.user.id });
      
      if (!profile) {
        profile = await initializeUserGamification(req.user.id);
      }

      // Calculate current level
      const currentLevel = LEVELS.reduce((acc, level) => {
        return profile.points >= level.minPoints ? level : acc;
      }, LEVELS[0]);

      // Get next level
      const nextLevel = LEVELS.find(level => level.minPoints > profile.points);

      res.json({
        profile,
        currentLevel,
        nextLevel,
        pointsToNextLevel: nextLevel ? nextLevel.minPoints - profile.points : 0
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Award points to user
  router.post('/award-points', requireAuth, async (req, res) => {
    try {
      const { action, amount, metadata = {} } = req.body;

      let profile = await gamificationCollection.findOne({ userId: req.user.id });
      if (!profile) {
        profile = await initializeUserGamification(req.user.id);
      }

      // Calculate points based on action
      let pointsToAward = amount || POINTS_CONFIG[action] || 0;

      // Add to history
      const historyEntry = {
        action,
        points: pointsToAward,
        timestamp: new Date(),
        metadata
      };

      // Update profile
      const newPoints = profile.points + pointsToAward;
      const newTotalPoints = profile.totalPointsEarned + pointsToAward;

      await gamificationCollection.updateOne(
        { userId: req.user.id },
        {
          $set: {
            points: newPoints,
            totalPointsEarned: newTotalPoints,
            updatedAt: new Date()
          },
          $push: { pointsHistory: historyEntry }
        }
      );

      // Check for new achievements
      const achievements = await checkAchievements(req.user.id, profile);

      // Calculate new level
      const newLevel = LEVELS.reduce((acc, level) => {
        return newPoints >= level.minPoints ? level : acc;
      }, LEVELS[0]);

      const leveledUp = newLevel.level > profile.level;
      if (leveledUp) {
        await gamificationCollection.updateOne(
          { userId: req.user.id },
          { $set: { level: newLevel.level } }
        );
      }

      res.json({
        success: true,
        pointsAwarded: pointsToAward,
        newPoints,
        leveledUp,
        newLevel: leveledUp ? newLevel : null,
        newAchievements: achievements
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Check for daily login
  router.post('/daily-login', requireAuth, async (req, res) => {
    try {
      let profile = await gamificationCollection.findOne({ userId: req.user.id });
      if (!profile) {
        profile = await initializeUserGamification(req.user.id);
      }

      const today = new Date().toDateString();
      const lastLogin = profile.lastLoginDate ? new Date(profile.lastLoginDate).toDateString() : null;

      if (today !== lastLogin) {
        // Calculate streak
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const wasYesterday = lastLogin === yesterday.toDateString();

        const newStreak = wasYesterday ? profile.dailyLoginStreak + 1 : 1;
        const pointsAwarded = POINTS_CONFIG.DAILY_LOGIN;

        await gamificationCollection.updateOne(
          { userId: req.user.id },
          {
            $set: {
              lastLoginDate: new Date(),
              dailyLoginStreak: newStreak,
              points: profile.points + pointsAwarded,
              totalPointsEarned: profile.totalPointsEarned + pointsAwarded,
              updatedAt: new Date()
            },
            $push: {
              pointsHistory: {
                action: 'DAILY_LOGIN',
                points: pointsAwarded,
                timestamp: new Date(),
                metadata: { streak: newStreak }
              }
            }
          }
        );

        res.json({
          success: true,
          pointsAwarded,
          streak: newStreak,
          message: `${newStreak} day streak! 🔥`
        });
      } else {
        res.json({
          success: false,
          message: 'Already logged in today',
          streak: profile.dailyLoginStreak
        });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Get achievements
  router.get('/achievements', requireAuth, async (req, res) => {
    try {
      let profile = await gamificationCollection.findOne({ userId: req.user.id });
      if (!profile) {
        profile = await initializeUserGamification(req.user.id);
      }

      const unlockedAchievements = ACHIEVEMENTS.filter(a => 
        profile.achievements.some(ua => ua.id === a.id)
      );

      const lockedAchievements = ACHIEVEMENTS.filter(a => 
        !profile.achievements.some(ua => ua.id === a.id)
      );

      res.json({
        unlocked: unlockedAchievements,
        locked: lockedAchievements,
        total: ACHIEVEMENTS.length,
        unlockedCount: unlockedAchievements.length
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Redeem points for discount
  router.post('/redeem', requireAuth, async (req, res) => {
    try {
      const { points } = req.body;

      if (!points || points < 100) {
        return res.status(400).json({ message: 'Minimum 100 points required' });
      }

      let profile = await gamificationCollection.findOne({ userId: req.user.id });
      if (!profile || profile.points < points) {
        return res.status(400).json({ message: 'Insufficient points' });
      }

      // 100 points = $1 discount
      const discountAmount = points / 100;

      await gamificationCollection.updateOne(
        { userId: req.user.id },
        {
          $inc: { points: -points },
          $push: {
            pointsHistory: {
              action: 'REDEEM',
              points: -points,
              timestamp: new Date(),
              metadata: { discountAmount }
            }
          }
        }
      );

      res.json({
        success: true,
        discountAmount,
        remainingPoints: profile.points - points
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Get leaderboard
  router.get('/leaderboard', requireAuth, async (req, res) => {
    try {
      const topUsers = await gamificationCollection
        .find({})
        .sort({ totalPointsEarned: -1 })
        .limit(10)
        .toArray();

      // Get user details
      const leaderboard = await Promise.all(
        topUsers.map(async (profile, index) => {
          const user = await usersCollection.findOne({ _id: new ObjectId(profile.userId) });
          const level = LEVELS.reduce((acc, level) => {
            return profile.points >= level.minPoints ? level : acc;
          }, LEVELS[0]);

          return {
            rank: index + 1,
            userName: user?.name || 'Anonymous',
            points: profile.totalPointsEarned,
            level: level.name,
            levelColor: level.color
          };
        })
      );

      res.json({ leaderboard });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Helper function to check achievements
  async function checkAchievements(userId, profile) {
    const newAchievements = [];
    // This would check various conditions and award achievements
    // For now, returning empty array - will be populated based on user actions
    return newAchievements;
  }

  return router;
}

module.exports = createGamificationRouter;
