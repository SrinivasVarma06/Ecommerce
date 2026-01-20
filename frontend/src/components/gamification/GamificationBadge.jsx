import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star } from 'lucide-react';
import { useGamification } from '@/contexts/GamificationContext';
import { Badge } from '@/components/ui/badge';

const GamificationBadge = ({ className = '' }) => {
  const { profile, currentLevel, nextLevel, pointsToNextLevel } = useGamification();

  if (!profile || !currentLevel) return null;

  const progressPercent = nextLevel && pointsToNextLevel > 0
    ? ((profile.points / (profile.points + pointsToNextLevel)) * 100)
    : 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-2 ${className}`}
    >
      <div className="flex items-center gap-1.5 bg-background/80 backdrop-blur-sm px-2 py-1 rounded-full border">
        <Trophy 
          className="w-4 h-4" 
          style={{ color: currentLevel.color }}
        />
        <span 
          className="text-xs font-bold"
          style={{ color: currentLevel.color }}
        >
          {currentLevel.name}
        </span>
        <span className="text-xs text-muted-foreground">•</span>
        <span className="text-xs font-semibold">
          {profile.points.toLocaleString()}
        </span>
      </div>
    </motion.div>
  );
};

export default GamificationBadge;
