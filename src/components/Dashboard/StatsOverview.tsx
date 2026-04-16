import { TrendingUp, Calendar, Award, Target } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { PatientStats } from '@/lib/patientDataService';

interface StatsOverviewProps {
  data: PatientStats;
}

const StatsOverview = ({ data }: StatsOverviewProps) => {
  const stats = [
    {
      title: "Total Sessions",
      value: data.totalSessions,
      description: "Training sessions completed",
      icon: Calendar,
      trend: `${data.weeklyProgress.sessions.current} this week`
    },
    {
      title: "Average Score",
      value: `${data.averageScore}%`,
      description: "Across all cognitive domains",
      icon: TrendingUp,
      trend: `${data.improvement >= 0 ? '+' : ''}${data.improvement}% this week`
    },
    {
      title: "Current Streak",
      value: `${data.streakDays} days`,
      description: "Consecutive training days",
      icon: Target,
      trend: data.streakDays > 0 ? "Keep it going!" : "Start your streak!"
    },
    {
      title: "Best Score",
      value: `${data.bestScore}%`,
      description: data.bestGameName,
      icon: Award,
      trend: "Personal best"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="glass-card hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <div className="p-2 rounded-lg bg-primary/10">
                <stat.icon className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              <p className="text-xs text-success font-medium mt-2">{stat.trend}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg">Weekly Progress</CardTitle>
          <CardDescription>Track your goals for this week</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Training Sessions</span>
              <span className="text-muted-foreground">{data.weeklyProgress.sessions.current}/{data.weeklyProgress.sessions.target}</span>
            </div>
            <Progress value={(data.weeklyProgress.sessions.current / data.weeklyProgress.sessions.target) * 100} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Cognitive Improvement</span>
              <span className="text-muted-foreground">{data.weeklyProgress.improvement.current}/{data.weeklyProgress.improvement.target}%</span>
            </div>
            <Progress value={(data.weeklyProgress.improvement.current / data.weeklyProgress.improvement.target) * 100} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Games Tried</span>
              <span className="text-muted-foreground">{data.weeklyProgress.newGames.current}/{data.weeklyProgress.newGames.target}</span>
            </div>
            <Progress value={(data.weeklyProgress.newGames.current / data.weeklyProgress.newGames.target) * 100} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsOverview;
