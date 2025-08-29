import { Play, BookOpen, Settings, BarChart3, Trophy, Brain } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

const QuickActions = () => {
  const navigate = useNavigate();

  const actions = [
    {
      title: 'Start Training',
      description: 'Begin your daily cognitive workout',
      icon: Play,
      action: () => navigate('/games'),
      variant: 'default' as const,
      badge: 'Recommended',
      color: 'bg-gradient-to-br from-primary to-primary/80'
    },
    {
      title: 'View Progress',
      description: 'Check your cognitive development',
      icon: BarChart3,
      action: () => navigate('/analytics'),
      variant: 'outline' as const,
      color: 'bg-gradient-to-br from-success/10 to-success/5'
    },
    {
      title: 'Read Articles',
      description: 'Learn about brain health',
      icon: BookOpen,
      action: () => navigate('/articles'),
      variant: 'outline' as const,
      color: 'bg-gradient-to-br from-accent/10 to-accent/5'
    },
    {
      title: 'View Achievements',
      description: 'See your earned badges',
      icon: Trophy,
      action: () => navigate('/achievements'),
      variant: 'outline' as const,
      badge: '12 earned',
      color: 'bg-gradient-to-br from-secondary/10 to-secondary/5'
    }
  ];

  const todayRecommendation = {
    game: 'Memory Matching',
    reason: 'Perfect for improving your working memory',
    difficulty: 'Intermediate',
    estimatedTime: '5-10 min'
  };

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
          <CardDescription>Jump into your cognitive training journey</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {actions.map((action, index) => (
            <div key={index} className={`p-4 rounded-lg border ${action.color} hover:shadow-md transition-all duration-200`}>
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-lg bg-background/80">
                  <action.icon className="h-5 w-5 text-primary" />
                </div>
                {action.badge && (
                  <Badge variant="secondary" className="text-xs">
                    {action.badge}
                  </Badge>
                )}
              </div>
              <h3 className="font-medium text-foreground mb-1">{action.title}</h3>
              <p className="text-sm text-muted-foreground mb-3">{action.description}</p>
              <Button 
                variant={action.variant} 
                size="sm" 
                onClick={action.action}
                className="w-full"
              >
                Get Started
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Today's Recommendation */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Brain className="h-5 w-5 mr-2 text-primary" />
            AI Recommendation
          </CardTitle>
          <CardDescription>Personalized game suggestion for today</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-foreground">{todayRecommendation.game}</h3>
              <Badge variant="outline">{todayRecommendation.difficulty}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{todayRecommendation.reason}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Estimated time: {todayRecommendation.estimatedTime}
              </span>
              <Button size="sm" onClick={() => navigate('/games')}>
                Play Now
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuickActions;