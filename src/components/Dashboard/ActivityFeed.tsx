import { Brain, Clock, Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ActivityItem } from '@/lib/patientDataService';

interface ActivityFeedProps {
  activities?: ActivityItem[];
}

const ActivityFeed = ({ activities = [] }: ActivityFeedProps) => {
  const iconMap: Record<string, React.ElementType> = {
    memory: Brain,
    attention: Star,
    executive: Star,
    processing: Star,
  };

  if (activities.length === 0) {
    return (
      <Card className="glass-card h-fit">
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
          <CardDescription>Your latest game sessions</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">No activity yet. Start playing games!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card h-fit">
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
        <CardDescription>Your latest game sessions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity) => {
          const Icon = iconMap[activity.domain] || Brain;
          return (
            <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="p-2 rounded-full bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-foreground">{activity.title}</h4>
                  <Badge variant="secondary" className="text-xs">{activity.score}%</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{activity.description}</p>
                <p className="text-xs text-muted-foreground flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {new Date(activity.timestamp).toLocaleDateString()} · {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
