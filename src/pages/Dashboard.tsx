import { Calendar, Flame, Star, Zap, Brain, Target, Trophy } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProgressCard from '@/components/Dashboard/ProgressCard';
import CognitiveChart from '@/components/Dashboard/CognitiveChart';
import StatsOverview from '@/components/Dashboard/StatsOverview';
import ActivityFeed from '@/components/Dashboard/ActivityFeed';
import QuickActions from '@/components/Dashboard/QuickActions';

const Dashboard = () => {
  const { user } = useAuth();

  // Mock data - in a real app this would come from your backend
  const statsData = {
    totalSessions: 47,
    averageScore: 84,
    streakDays: 7,
    improvement: 15,
    weeklyProgress: {
      sessions: { current: 5, target: 7 },
      improvement: { current: 8, target: 10 },
      newGames: { current: 2, target: 3 }
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Section */}
      <div className="glass-card-strong p-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">
              {getGreeting()}, {user?.name || 'Guest'}!
            </h1>
            <p className="text-lg text-muted-foreground">
              Ready to enhance your cognitive abilities today?
            </p>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-success to-success/80 mb-2 shadow-lg">
                <Flame className="h-8 w-8 text-white" />
              </div>
              <p className="text-sm text-muted-foreground">Current Streak</p>
              <p className="text-xl font-bold text-success">{statsData.streakDays} days</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-accent to-accent/80 mb-2 shadow-lg">
                <Star className="h-8 w-8 text-white" />
              </div>
              <p className="text-sm text-muted-foreground">Total Badges</p>
              <p className="text-xl font-bold text-accent-foreground">12</p>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-fit">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Overview */}
          <StatsOverview data={statsData} />

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <CognitiveChart />
              
              {/* Quick Progress Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ProgressCard
                  title="Best Domain"
                  value="Attention"
                  change="89% average"
                  icon="zap"
                  color="accent"
                />
                <ProgressCard
                  title="AI Adaptations"
                  value="12"
                  change="This week"
                  icon="award"
                  color="secondary"
                />
              </div>
            </div>
            
            <div className="space-y-6">
              <QuickActions />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="lg:col-span-2">
              <CognitiveChart />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:col-span-2">
              <ProgressCard
                title="Overall Score"
                value="84%"
                change="+5% this week"
                icon="trending"
                color="primary"
              />
              <ProgressCard
                title="Games Completed"
                value="23"
                change="+3 this week"
                icon="target"
                color="success"
              />
              <ProgressCard
                title="Processing Speed"
                value="Advanced"
                change="Level up!"
                icon="zap"
                color="accent"
              />
              <ProgressCard
                title="Memory Score"
                value="91%"
                change="+8% this week"
                icon="award"
                color="secondary"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <CognitiveChart />
            </div>
            <ActivityFeed />
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* AI Insights */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                <Brain className="h-5 w-5 mr-2 text-primary" />
                AI Insights
              </h3>
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg">
                  <p className="text-sm font-medium text-foreground mb-2">💡 Personalized Recommendation</p>
                  <p className="text-sm text-muted-foreground">
                    Your attention skills have improved {statsData.improvement}% this week! Try the Reaction Speed game to build on this momentum.
                  </p>
                </div>
                <div className="p-4 bg-gradient-to-r from-success/10 to-accent/10 rounded-lg">
                  <p className="text-sm font-medium text-foreground mb-2">🎯 Today's Challenge</p>
                  <p className="text-sm text-muted-foreground">
                    Based on your recent performance, I've adjusted Word Memory to the perfect difficulty level for optimal learning.
                  </p>
                </div>
                <div className="p-4 bg-gradient-to-r from-accent/10 to-primary/10 rounded-lg">
                  <p className="text-sm font-medium text-foreground mb-2">📈 Progress Insight</p>
                  <p className="text-sm text-muted-foreground">
                    You're performing best during morning sessions. Consider scheduling your training between 9-11 AM for optimal results.
                  </p>
                </div>
              </div>
            </div>

            {/* Recent Achievements */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                <Trophy className="h-5 w-5 mr-2 text-accent" />
                Recent Achievements
              </h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-success/10 rounded-lg">
                  <div className="p-2 bg-gradient-to-br from-success to-success/80 rounded-full">
                    <Star className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Optimal Challenge</p>
                    <p className="text-xs text-muted-foreground">AI matched your skill perfectly</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-primary/10 rounded-lg">
                  <div className="p-2 bg-gradient-to-br from-primary to-primary/80 rounded-full">
                    <Flame className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Week Warrior</p>
                    <p className="text-xs text-muted-foreground">7-day training streak</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-accent/10 rounded-lg">
                  <div className="p-2 bg-gradient-to-br from-accent to-accent/80 rounded-full">
                    <Brain className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Memory Master</p>
                    <p className="text-xs text-muted-foreground">Perfect score in Memory Matching</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;