import { TrendingUp, Award, Target, Zap } from 'lucide-react';

interface ProgressCardProps {
  title: string;
  value: string | number;
  change: string;
  icon: 'trending' | 'award' | 'target' | 'zap';
  color: 'primary' | 'success' | 'accent' | 'secondary';
}

const ProgressCard = ({ title, value, change, icon, color }: ProgressCardProps) => {
  const iconMap = {
    trending: TrendingUp,
    award: Award,
    target: Target,
    zap: Zap,
  };

  const colorMap = {
    primary: 'bg-gradient-to-br from-primary to-primary-dark',
    success: 'bg-gradient-to-br from-success to-success-light',
    accent: 'bg-gradient-to-br from-accent to-accent-light',
    secondary: 'bg-gradient-to-br from-secondary to-secondary-light',
  };

  const Icon = iconMap[icon];

  return (
    <div className="glass-card p-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-xs text-success font-medium">{change}</p>
        </div>
        <div className={`p-3 rounded-xl ${colorMap[color]}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
};

export default ProgressCard;