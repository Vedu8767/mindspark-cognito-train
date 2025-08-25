import { Calendar, Flame, Star, Zap, Brain, Target } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import ProgressCard from '@/components/Dashboard/ProgressCard';
import CognitiveChart from '@/components/Dashboard/CognitiveChart';

const Dashboard = () => {
  const { user } = useAuth();
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Section */}
      <div className="glass-card-strong p-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">Good Morning, {user?.name || 'Guest'}!</h1>
            <p className="text-lg text-muted-foreground">Ready for today's brain training session?</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-success to-success-light mb-2">
                <Flame className="h-8 w-8 text-white" />
              </div>
              <p className="text-sm text-muted-foreground">Streak</p>
              <p className="text-xl font-bold text-success">7 days</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-accent to-accent-light mb-2">
                <Star className="h-8 w-8 text-white" />
              </div>
              <p className="text-sm text-muted-foreground">Badges</p>
              <p className="text-xl font-bold text-accent-foreground">12</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
          title="Best Domain"
          value="Attention"
          change="89% score"
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

      {/* Charts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CognitiveChart />
        </div>
        
        <div className="space-y-6">
          {/* Recent Achievements */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Recent Achievements</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-success/10 rounded-lg">
                <div className="p-2 bg-gradient-to-br from-success to-success-light rounded-full">
                  <Star className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Optimal Challenge</p>
                  <p className="text-xs text-muted-foreground">AI matched your skill perfectly</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-primary/10 rounded-lg">
                <div className="p-2 bg-gradient-to-br from-primary to-primary-dark rounded-full">
                  <Flame className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Week Warrior</p>
                  <p className="text-xs text-muted-foreground">7-day training streak</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-accent/10 rounded-lg">
                <div className="p-2 bg-gradient-to-br from-accent to-accent-light rounded-full">
                  <Brain className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Memory Master</p>
                  <p className="text-xs text-muted-foreground">Perfect score in Memory Matching</p>
                </div>
              </div>
            </div>
          </div>

          {/* AI Insights */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">AI Insights</h3>
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg">
                <p className="text-sm font-medium text-foreground mb-2">💡 Personalized Recommendation</p>
                <p className="text-sm text-muted-foreground">
                  Your attention skills have improved 15% this week! Try the Reaction Speed game to build on this momentum.
                </p>
              </div>
              <div className="p-4 bg-gradient-to-r from-success/10 to-accent/10 rounded-lg">
                <p className="text-sm font-medium text-foreground mb-2">🎯 Today's Challenge</p>
                <p className="text-sm text-muted-foreground">
                  Based on your recent performance, I've adjusted Word Memory to the perfect difficulty level for optimal learning.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Goals */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Weekly Goals</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Training Sessions</span>
              <span className="text-sm text-muted-foreground">5/7</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: '71%' }}></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Cognitive Improvement</span>
              <span className="text-sm text-muted-foreground">8/10%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: '80%' }}></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">New Games Tried</span>
              <span className="text-sm text-muted-foreground">2/3</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: '67%' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;