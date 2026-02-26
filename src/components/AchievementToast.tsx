import { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import type { Achievement } from '@/lib/achievements';
import { TIER_COLORS } from '@/lib/achievements';

interface AchievementToastProps {
  achievement: Achievement;
  onDismiss: () => void;
}

const AchievementToast = ({ achievement, onDismiss }: AchievementToastProps) => {
  const [visible, setVisible] = useState(false);
  const tier = TIER_COLORS[achievement.tier];

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 400);
    }, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className={`fixed top-4 right-4 z-[100] transition-all duration-400 ${visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
      <div className={`glass-card-strong p-4 flex items-center space-x-3 border-2 ${tier.border} min-w-72 shadow-2xl`}>
        <div className={`text-3xl p-2 rounded-lg ${tier.bg}`}>
          {achievement.icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <Trophy className={`h-4 w-4 ${tier.text}`} />
            <span className={`text-xs font-bold uppercase ${tier.text}`}>Achievement Unlocked!</span>
          </div>
          <p className="text-sm font-bold text-foreground">{achievement.title}</p>
          <p className="text-xs text-muted-foreground">{achievement.description}</p>
        </div>
      </div>
    </div>
  );
};

export default AchievementToast;
