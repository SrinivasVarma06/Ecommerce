import { Star } from 'lucide-react';

const StarRating = ({ rating = 0, size = 'w-4 h-4', className = '' }) => {
  return (
    <div className={`flex items-center ${className}`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, rating - i)); // 0..1
        return (
          <div key={i} className="relative inline-block" style={{ lineHeight: 0 }}>
            {/* base (empty) star */}
            <Star className={`${size} text-muted-foreground`} />

            {/* filled star clipped to percentage */}
            {fill > 0 && (
              <div
                className="absolute left-0 top-0 overflow-hidden"
                style={{ width: `${fill * 100}%` }}
              >
                <Star className={`${size} fill-accent text-accent`} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StarRating;