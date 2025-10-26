import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, Gift, TrendingUp, Award, Flame } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useGamification } from '@/contexts/GamificationContext';
import { gamificationAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const Rewards = () => {
  const { profile, currentLevel, nextLevel, pointsToNextLevel, redeemPoints } = useGamification();
  const [achievements, setAchievements] = useState({ unlocked: [], locked: [] });
  const [leaderboard, setLeaderboard] = useState([]);
  const { token } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (token) {
      loadAchievements();
      loadLeaderboard();
    }
  }, [token]);

  const loadAchievements = async () => {
    try {
      const data = await gamificationAPI.getAchievements(token);
      setAchievements(data);
    } catch (error) {
      console.error('Failed to load achievements:', error);
    }
  };

  const loadLeaderboard = async () => {
    try {
      const data = await gamificationAPI.getLeaderboard(token);
      setLeaderboard(data.leaderboard || []);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    }
  };

  const handleRedeem = async (points) => {
    try {
      await redeemPoints(points);
    } catch (error) {
      // Error already handled in context
    }
  };

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Rewards Program</h1>
        <p className="text-muted-foreground">Please login to see your rewards</p>
      </div>
    );
  }

  const progressPercent = nextLevel 
    ? ((profile.points / (profile.points + pointsToNextLevel)) * 100)
    : 100;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Rewards & Achievements</h1>
      <p className="text-muted-foreground mb-8">Earn points, unlock achievements, and level up!</p>

      {/* Current Level & Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy style={{ color: currentLevel?.color }} className="w-6 h-6" />
              Your Level: {currentLevel?.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Points: {profile.points.toLocaleString()}</span>
                {nextLevel && (
                  <span className="text-sm text-muted-foreground">
                    Next: {pointsToNextLevel.toLocaleString()} pts
                  </span>
                )}
              </div>
              <Progress value={progressPercent} className="h-3" />
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Flame className="w-4 h-4 text-orange-500" />
              <span>
                {profile.dailyLoginStreak} day login streak
              </span>
            </div>

            <div className="pt-4 border-t">
              <p className="font-semibold mb-2">Level Benefits:</p>
              <p className="text-sm text-muted-foreground">{currentLevel?.benefits}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5" />
              Redeem Points
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-center py-4">
              <p className="text-3xl font-bold text-primary">{profile.points}</p>
              <p className="text-sm text-muted-foreground">Available Points</p>
            </div>
            
            <div className="space-y-2">
              <Button 
                onClick={() => handleRedeem(100)} 
                disabled={profile.points < 100}
                className="w-full"
                variant="outline"
              >
                $1 Off (100 pts)
              </Button>
              <Button 
                onClick={() => handleRedeem(500)} 
                disabled={profile.points < 500}
                className="w-full"
                variant="outline"
              >
                $5 Off (500 pts)
              </Button>
              <Button 
                onClick={() => handleRedeem(1000)} 
                disabled={profile.points < 1000}
                className="w-full"
              >
                $10 Off (1000 pts)
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground mt-4">
              100 points = $1 discount
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Achievements */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-6 h-6" />
            Achievements ({achievements.unlockedCount}/{achievements.total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.unlocked.map((achievement) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 border rounded-lg bg-gradient-to-br from-yellow-50 to-amber-50"
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{achievement.icon}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold">{achievement.name}</h3>
                    <p className="text-xs text-muted-foreground mb-1">
                      {achievement.description}
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      +{achievement.points} pts
                    </Badge>
                  </div>
                </div>
              </motion.div>
            ))}

            {achievements.locked.map((achievement) => (
              <div
                key={achievement.id}
                className="p-4 border rounded-lg bg-muted/30 opacity-60"
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl grayscale">{achievement.icon}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-muted-foreground">{achievement.name}</h3>
                    <p className="text-xs text-muted-foreground mb-1">
                      {achievement.description}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      🔒 Locked
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            Leaderboard - Top Shoppers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {leaderboard.map((entry, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center gap-4 p-3 rounded-lg ${
                  index < 3 ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200' : 'bg-muted/30'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                  index === 0 ? 'bg-yellow-400 text-yellow-900' :
                  index === 1 ? 'bg-gray-300 text-gray-700' :
                  index === 2 ? 'bg-orange-400 text-orange-900' :
                  'bg-muted'
                }`}>
                  {entry.rank}
                </div>
                
                <div className="flex-1">
                  <p className="font-semibold">{entry.userName}</p>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="secondary" 
                      style={{ backgroundColor: `${entry.levelColor}20`, color: entry.levelColor }}
                    >
                      {entry.level}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {entry.points.toLocaleString()} pts
                    </span>
                  </div>
                </div>

                {index < 3 && (
                  <Trophy 
                    className="w-6 h-6"
                    style={{ color: entry.levelColor }}
                  />
                )}
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* How to Earn Points */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>How to Earn Points</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Star className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Make Purchases</p>
                <p className="text-sm text-muted-foreground">100 points per $1 spent</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Award className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold">Write Reviews</p>
                <p className="text-sm text-muted-foreground">50 points per review</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <Flame className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="font-semibold">Daily Login</p>
                <p className="text-sm text-muted-foreground">5 points each day</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Gift className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold">Add to Wishlist</p>
                <p className="text-sm text-muted-foreground">10 points per item</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Rewards;
