import { TrendingUp, Calendar, Award, Target } from 'lucide-react';
import CognitiveChart from '@/components/Dashboard/CognitiveChart';

const Analytics = () => {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="glass-card-strong p-8">
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Analytics & Progress</h1>
            <p className="text-lg text-muted-foreground">
              Detailed insights into your cognitive training journey
            </p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6 text-center">
          <div className="p-3 bg-gradient-to-br from-primary to-primary-dark rounded-xl w-12 h-12 mx-auto mb-4 flex items-center justify-center">
            <TrendingUp className="h-6 w-6 text-primary-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Overall Improvement</h3>
          <p className="text-2xl font-bold text-success mt-2">+23%</p>
          <p className="text-sm text-muted-foreground">This month</p>
        </div>

        <div className="glass-card p-6 text-center">
          <div className="p-3 bg-gradient-to-br from-success to-success-light rounded-xl w-12 h-12 mx-auto mb-4 flex items-center justify-center">
            <Calendar className="h-6 w-6 text-success-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Training Days</h3>
          <p className="text-2xl font-bold text-foreground mt-2">28</p>
          <p className="text-sm text-muted-foreground">This month</p>
        </div>

        <div className="glass-card p-6 text-center">
          <div className="p-3 bg-gradient-to-br from-accent to-accent-light rounded-xl w-12 h-12 mx-auto mb-4 flex items-center justify-center">
            <Award className="h-6 w-6 text-accent-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Achievements</h3>
          <p className="text-2xl font-bold text-foreground mt-2">15</p>
          <p className="text-sm text-muted-foreground">Badges earned</p>
        </div>

        <div className="glass-card p-6 text-center">
          <div className="p-3 bg-gradient-to-br from-secondary to-secondary-light rounded-xl w-12 h-12 mx-auto mb-4 flex items-center justify-center">
            <Target className="h-6 w-6 text-secondary-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Best Score</h3>
          <p className="text-2xl font-bold text-foreground mt-2">95%</p>
          <p className="text-sm text-muted-foreground">Memory Matching</p>
        </div>
      </div>

      {/* Detailed Chart */}
      <CognitiveChart />

      {/* Coming Soon Features */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">🔮 Coming Soon</h3>
          <div className="space-y-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <h4 className="font-medium text-foreground">Detailed Performance Reports</h4>
              <p className="text-sm text-muted-foreground">Export comprehensive PDF reports of your progress</p>
            </div>
            <div className="p-3 bg-success/10 rounded-lg">
              <h4 className="font-medium text-foreground">Comparative Analytics</h4>
              <p className="text-sm text-muted-foreground">Compare your progress with age-matched peers</p>
            </div>
            <div className="p-3 bg-accent/10 rounded-lg">
              <h4 className="font-medium text-foreground">AI Trend Analysis</h4>
              <p className="text-sm text-muted-foreground">Advanced AI insights and predictions</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">📊 Weekly Summary</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-background-secondary rounded-lg">
              <span className="text-sm font-medium text-foreground">Memory Games</span>
              <span className="text-sm text-success">+12% improvement</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-background-secondary rounded-lg">
              <span className="text-sm font-medium text-foreground">Attention Training</span>
              <span className="text-sm text-success">+8% improvement</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-background-secondary rounded-lg">
              <span className="text-sm font-medium text-foreground">Executive Function</span>
              <span className="text-sm text-success">+15% improvement</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-background-secondary rounded-lg">
              <span className="text-sm font-medium text-foreground">Processing Speed</span>
              <span className="text-sm text-success">+6% improvement</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;