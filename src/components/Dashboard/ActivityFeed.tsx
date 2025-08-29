import { Brain, Clock, Star, Zap, Target, Award } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Activity {
  id: string;
  type: 'game' | 'achievement' | 'milestone' | 'improvement';
  title: string;
  description: string;
  timestamp: string;
  icon: 'brain' | 'star' | 'zap' | 'target' | 'award' | 'clock';
  color: 'primary' | 'success' | 'accent' | 'secondary';
  score?: number;
}

const ActivityFeed = () => {
  const activities: Activity[] = [
    {
      id: '1',
      type: 'game',
      title: 'Memory Matching Completed',
      description: 'Achieved 95% accuracy in under 2 minutes',
      timestamp: '2 hours ago',
      icon: 'brain',
      color: 'primary',
      score: 95
    },
    {
      id: '2',
      type: 'achievement',
      title: 'Week Warrior Badge Earned',
      description: 'Completed 7 consecutive days of training',
      timestamp: '1 day ago',
      icon: 'award',
      color: 'success'
    },
    {
      id: '3',
      type: 'improvement',
      title: 'Attention Score Improved',
      description: 'Your attention domain increased by 12%',
      timestamp: '2 days ago',
      icon: 'zap',
      color: 'accent'
    },
    {
      id: '4',
      type: 'game',
      title: 'Reaction Speed Challenge',
      description: 'New personal best: 285ms average',
      timestamp: '3 days ago',
      icon: 'target',
      color: 'secondary',
      score: 285
    },
    {
      id: '5',
      type: 'milestone',
      title: 'Processing Speed Milestone',
      description: 'Reached advanced difficulty level',
      timestamp: '5 days ago',
      icon: 'star',
      color: 'primary'
    }
  ];

  const iconMap = {
    brain: Brain,
    star: Star,
    zap: Zap,
    target: Target,
    award: Award,
    clock: Clock
  };

  const colorMap = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    accent: 'bg-accent/10 text-accent',
    secondary: 'bg-secondary/10 text-secondary'
  };

  return (
    <Card className="glass-card h-fit">
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
        <CardDescription>Your latest achievements and progress</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity) => {
          const Icon = iconMap[activity.icon];
          return (
            <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <div className={`p-2 rounded-full ${colorMap[activity.color]}`}>
                <Icon className="h-4 w-4" />
              </div>
              
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-foreground">{activity.title}</h4>
                  {activity.score && (
                    <Badge variant="secondary" className="text-xs">
                      {activity.type === 'game' && activity.icon === 'target' ? `${activity.score}ms` : `${activity.score}%`}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{activity.description}</p>
                <p className="text-xs text-muted-foreground flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {activity.timestamp}
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default ActivityFeed;