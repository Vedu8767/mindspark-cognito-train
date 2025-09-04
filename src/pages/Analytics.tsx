import { TrendingUp, Calendar, Award, Target } from 'lucide-react';
import { useState } from 'react';
import CognitiveChart from '@/components/Dashboard/CognitiveChart';
import AIInsightsModal from '@/components/Dashboard/AIInsightsModal';
import { generatePDFReport, ReportData } from '@/lib/pdfReportGenerator';
import { generateAIInsights, CognitiveData } from '@/lib/aiInsights';
import { useToast } from '@/hooks/use-toast';

const Analytics = () => {
  const [showAIInsights, setShowAIInsights] = useState(false);
  const { toast } = useToast();

  // Sample cognitive data (in real app, this would come from user's actual data)
  const cognitiveData: CognitiveData = {
    memory: [75, 78, 82, 85, 88, 87, 90],
    attention: [68, 72, 75, 78, 80, 83, 85],
    executive: [82, 85, 87, 90, 92, 89, 94],
    processing: [70, 73, 76, 74, 77, 80, 82],
  };

  const reportData: ReportData = {
    userName: "John Doe",
    reportDate: new Date().toLocaleDateString(),
    overallImprovement: "+23%",
    trainingDays: 28,
    achievements: 15,
    bestScore: "95% (Memory Matching)",
    totalSessions: 142,
    avgSessionDuration: "18 minutes",
    longestStreak: 45,
    currentStreak: 12,
    weeklyProgress: {
      memory: "+12% improvement",
      attention: "+8% improvement",
      executive: "+15% improvement",
      processing: "+6% improvement",
    },
    detailedScores: {
      memory: { current: 85, previous: 78, best: 95 },
      attention: { current: 82, previous: 79, best: 88 },
      executive: { current: 91, previous: 86, best: 94 },
      processing: { current: 78, previous: 75, best: 82 },
    },
    gameStats: [
      { name: "Memory Matching", sessionsPlayed: 35, averageScore: 85, bestScore: 95, timeSpent: "4h 20m" },
      { name: "Attention Focus", sessionsPlayed: 28, averageScore: 82, bestScore: 90, timeSpent: "3h 45m" },
      { name: "Executive Function", sessionsPlayed: 32, averageScore: 91, bestScore: 98, timeSpent: "5h 10m" },
      { name: "Processing Speed", sessionsPlayed: 25, averageScore: 78, bestScore: 85, timeSpent: "2h 30m" },
      { name: "Pattern Recognition", sessionsPlayed: 22, averageScore: 76, bestScore: 88, timeSpent: "2h 15m" },
    ],
  };

  const handleGenerateReport = async () => {
    try {
      await generatePDFReport(reportData);
      toast({
        title: "Report Generated",
        description: "Your PDF report has been downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleViewAIInsights = () => {
    setShowAIInsights(true);
  };

  const aiInsights = generateAIInsights(cognitiveData);

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

      {/* Advanced Features */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">📊 Advanced Analytics</h3>
          <div className="space-y-3">
            <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
              <h4 className="font-medium text-foreground">Detailed Performance Reports</h4>
              <p className="text-sm text-muted-foreground mb-3">Export comprehensive PDF reports of your progress</p>
              <button 
                onClick={handleGenerateReport}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Generate Report
              </button>
            </div>
            <div className="p-3 bg-accent/10 rounded-lg border border-accent/20">
              <h4 className="font-medium text-foreground">AI Trend Analysis</h4>
              <p className="text-sm text-muted-foreground mb-3">Advanced AI insights and predictions</p>
              <button 
                onClick={handleViewAIInsights}
                className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors"
              >
                View AI Insights
              </button>
            </div>
            <div className="p-3 bg-success/10 rounded-lg">
              <h4 className="font-medium text-foreground">Comparative Analytics</h4>
              <p className="text-sm text-muted-foreground">Compare your progress with age-matched peers</p>
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

      <AIInsightsModal 
        open={showAIInsights}
        onOpenChange={setShowAIInsights}
        insights={aiInsights}
      />
    </div>
  );
};

export default Analytics;