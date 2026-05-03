import { useState, useEffect } from 'react';
import { TrendingUp, Calendar, Award, Target } from 'lucide-react';
import CognitiveChart from '@/components/Dashboard/CognitiveChart';
import AIInsightsModal from '@/components/Dashboard/AIInsightsModal';
import { generatePDFReport } from '@/lib/pdfReportGenerator';
import { generateAIInsights } from '@/lib/aiInsights';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import {
  getPatientSessions, computeStats, computeChartData, computeAnalyticsReport, computeDomainScores,
  type SessionEntry,
} from '@/lib/patientDataService';

const Analytics = () => {
  const [showAIInsights, setShowAIInsights] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();
  const [sessions, setSessions] = useState<SessionEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = () => getPatientSessions(500).then(data => {
      setSessions(data);
      setLoading(false);
    });
    load();
    window.addEventListener('user-data-changed', load);
    window.addEventListener('focus', load);
    return () => {
      window.removeEventListener('user-data-changed', load);
      window.removeEventListener('focus', load);
    };
  }, []);

  const stats = computeStats(sessions);
  const chartData = computeChartData(sessions);
  const domainScores = computeDomainScores(sessions);
  const analyticsReport = computeAnalyticsReport(sessions, profile?.name || 'Patient');

  const handleGenerateReport = async () => {
    try {
      await generatePDFReport(analyticsReport as any);
      toast({ title: "Report Generated", description: "Your PDF report has been downloaded successfully." });
    } catch {
      toast({ title: "Error", description: "Failed to generate report. Please try again.", variant: "destructive" });
    }
  };

  const handleViewAIInsights = () => setShowAIInsights(true);

  const aiInsights = generateAIInsights(analyticsReport.cognitiveData as any);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="glass-card-strong p-8">
        <h1 className="text-3xl font-bold text-foreground">Analytics & Progress</h1>
        <p className="text-lg text-muted-foreground">Detailed insights into your cognitive training journey</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6 text-center">
          <div className="p-3 bg-gradient-to-br from-primary to-primary-dark rounded-xl w-12 h-12 mx-auto mb-4 flex items-center justify-center">
            <TrendingUp className="h-6 w-6 text-primary-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Overall Improvement</h3>
          <p className="text-2xl font-bold text-success mt-2">{stats.improvement >= 0 ? '+' : ''}{stats.improvement}%</p>
          <p className="text-sm text-muted-foreground">This week</p>
        </div>
        <div className="glass-card p-6 text-center">
          <div className="p-3 bg-gradient-to-br from-success to-success-light rounded-xl w-12 h-12 mx-auto mb-4 flex items-center justify-center">
            <Calendar className="h-6 w-6 text-success-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Training Days</h3>
          <p className="text-2xl font-bold text-foreground mt-2">{new Set(sessions.map(s => s.timestamp.split('T')[0])).size}</p>
          <p className="text-sm text-muted-foreground">Total active days</p>
        </div>
        <div className="glass-card p-6 text-center">
          <div className="p-3 bg-gradient-to-br from-accent to-accent-light rounded-xl w-12 h-12 mx-auto mb-4 flex items-center justify-center">
            <Award className="h-6 w-6 text-accent-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Total Sessions</h3>
          <p className="text-2xl font-bold text-foreground mt-2">{stats.totalSessions}</p>
          <p className="text-sm text-muted-foreground">Games played</p>
        </div>
        <div className="glass-card p-6 text-center">
          <div className="p-3 bg-gradient-to-br from-secondary to-secondary-light rounded-xl w-12 h-12 mx-auto mb-4 flex items-center justify-center">
            <Target className="h-6 w-6 text-secondary-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Best Score</h3>
          <p className="text-2xl font-bold text-foreground mt-2">{stats.bestScore}%</p>
          <p className="text-sm text-muted-foreground">{stats.bestGameName}</p>
        </div>
      </div>

      <CognitiveChart data={chartData} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">📊 Advanced Analytics</h3>
          <div className="space-y-3">
            <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
              <h4 className="font-medium text-foreground">Detailed Performance Reports</h4>
              <p className="text-sm text-muted-foreground mb-3">Export comprehensive PDF reports of your progress</p>
              <button onClick={handleGenerateReport} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                Generate Report
              </button>
            </div>
            <div className="p-3 bg-accent/10 rounded-lg border border-accent/20">
              <h4 className="font-medium text-foreground">AI Trend Analysis</h4>
              <p className="text-sm text-muted-foreground mb-3">Advanced AI insights and predictions</p>
              <button onClick={handleViewAIInsights} className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors">
                View AI Insights
              </button>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">📊 Domain Summary</h3>
          <div className="space-y-4">
            {[
              { name: 'Memory Games', score: domainScores.memory },
              { name: 'Attention Training', score: domainScores.attention },
              { name: 'Executive Function', score: domainScores.executive },
              { name: 'Processing Speed', score: domainScores.processing },
            ].map(d => (
              <div key={d.name} className="flex justify-between items-center p-3 bg-background-secondary rounded-lg">
                <span className="text-sm font-medium text-foreground">{d.name}</span>
                <span className={`text-sm ${d.score > 0 ? 'text-success' : 'text-muted-foreground'}`}>
                  {d.score > 0 ? `${d.score}% avg` : 'No data'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AIInsightsModal open={showAIInsights} onOpenChange={setShowAIInsights} insights={aiInsights} />
    </div>
  );
};

export default Analytics;
