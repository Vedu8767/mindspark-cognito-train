import { useState, useEffect } from 'react';
import { Calendar, Flame, Star, Brain, Target, Trophy } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProgressCard from '@/components/Dashboard/ProgressCard';
import CognitiveChart from '@/components/Dashboard/CognitiveChart';
import StatsOverview from '@/components/Dashboard/StatsOverview';
import ActivityFeed from '@/components/Dashboard/ActivityFeed';
import AssignedTraining from '@/components/Dashboard/AssignedTraining';
import ProgressHeatmap from '@/components/Dashboard/ProgressHeatmap';
import {
  getPatientSessions, computeStats, computeDomainScores,
  computeChartData, computeRecentActivity, computeHeatmapData,
  type SessionEntry, type PatientStats, type DomainScores, type ChartDataPoint, type ActivityItem,
} from '@/lib/patientDataService';

const Dashboard = () => {
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
  const domainScores = computeDomainScores(sessions);
  const chartData = computeChartData(sessions);
  const recentActivity = computeRecentActivity(sessions);
  const heatmapData = computeHeatmapData(sessions);

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
              {getGreeting()}, {profile?.name || 'Guest'}!
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
              <p className="text-xl font-bold text-success">{stats.streakDays} days</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-accent to-accent/80 mb-2 shadow-lg">
                <Star className="h-8 w-8 text-white" />
              </div>
              <p className="text-sm text-muted-foreground">Total Sessions</p>
              <p className="text-xl font-bold text-accent-foreground">{stats.totalSessions}</p>
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
          <StatsOverview data={stats} />
          <CognitiveChart data={chartData} />
          <ProgressHeatmap activityData={heatmapData} />
          <AssignedTraining />
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <ProgressCard
              title="Overall Score"
              value={`${stats.averageScore}%`}
              change={`${stats.improvement >= 0 ? '+' : ''}${stats.improvement}% this week`}
              icon="trending"
              color="primary"
            />
            <ProgressCard
              title="Games Completed"
              value={String(stats.totalSessions)}
              change={`${stats.weeklyProgress.sessions.current} this week`}
              icon="target"
              color="success"
            />
            <ProgressCard
              title="Completion Rate"
              value={`${stats.completionRate}%`}
              change="of games finished"
              icon="zap"
              color="accent"
            />
            <ProgressCard
              title="Best Score"
              value={`${stats.bestScore}%`}
              change={stats.bestGameName}
              icon="award"
              color="secondary"
            />
          </div>
          
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
              <Target className="h-5 w-5 mr-2 text-primary" />
              Domain Breakdown
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { name: 'Memory Training', key: 'memory' as const, color: 'primary' },
                { name: 'Attention Skills', key: 'attention' as const, color: 'accent' },
                { name: 'Executive Function', key: 'executive' as const, color: 'success' },
                { name: 'Processing Speed', key: 'processing' as const, color: 'secondary' },
              ].map(domain => (
                <div key={domain.key} className={`p-4 bg-${domain.color}/10 rounded-lg`}>
                  <h4 className="font-medium text-foreground mb-2">{domain.name}</h4>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-foreground">{domainScores[domain.key]}%</p>
                    <p className="text-sm text-muted-foreground">average score</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ActivityFeed activities={recentActivity} />
            
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-primary" />
                Training Summary
              </h3>
              <div className="space-y-4">
                <div className="p-4 bg-muted/20 rounded-lg text-center">
                  <p className="text-4xl font-bold text-foreground">{stats.totalSessions}</p>
                  <p className="text-sm text-muted-foreground">Total Sessions</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-success/10 rounded-lg text-center">
                    <p className="text-xl font-bold text-success">{stats.streakDays}</p>
                    <p className="text-xs text-muted-foreground">Day Streak</p>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-lg text-center">
                    <p className="text-xl font-bold text-primary">{stats.totalTimeMins}m</p>
                    <p className="text-xs text-muted-foreground">Total Time</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                <Brain className="h-5 w-5 mr-2 text-primary" />
                AI Insights
              </h3>
              <div className="space-y-4">
                {stats.totalSessions === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Play some games to get personalized insights!</p>
                ) : (
                  <>
                    <div className="p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg">
                      <p className="text-sm font-medium text-foreground mb-2">💡 Personalized Recommendation</p>
                      <p className="text-sm text-muted-foreground">
                        Your scores have changed {stats.improvement >= 0 ? `+${stats.improvement}%` : `${stats.improvement}%`} this week. 
                        {stats.improvement > 0 ? ' Great progress — keep it up!' : ' Try playing more consistently for better results.'}
                      </p>
                    </div>
                    <div className="p-4 bg-gradient-to-r from-success/10 to-accent/10 rounded-lg">
                      <p className="text-sm font-medium text-foreground mb-2">🎯 Strongest Domain</p>
                      <p className="text-sm text-muted-foreground">
                        {(() => {
                          const best = Object.entries(domainScores).sort(([,a], [,b]) => b - a)[0];
                          return best ? `Your ${best[0]} skills are your strongest at ${best[1]}%.` : 'Play more games to discover your strengths.';
                        })()}
                      </p>
                    </div>
                    <div className="p-4 bg-gradient-to-r from-accent/10 to-primary/10 rounded-lg">
                      <p className="text-sm font-medium text-foreground mb-2">📈 Focus Area</p>
                      <p className="text-sm text-muted-foreground">
                        {(() => {
                          const weakest = Object.entries(domainScores).filter(([,v]) => v > 0).sort(([,a], [,b]) => a - b)[0];
                          return weakest ? `Consider practicing more ${weakest[0]} games to improve from ${weakest[1]}%.` : 'Play games across all domains for balanced training.';
                        })()}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                <Trophy className="h-5 w-5 mr-2 text-accent" />
                Session Summary
              </h3>
              <div className="space-y-3">
                {sessions.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No sessions yet. Start playing!</p>
                ) : (
                  sessions.slice(0, 5).map(s => (
                    <div key={s.id} className="flex items-center space-x-3 p-3 bg-muted/10 rounded-lg">
                      <div className="p-2 bg-gradient-to-br from-primary to-primary/80 rounded-full">
                        <Star className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{s.gameName}</p>
                        <p className="text-xs text-muted-foreground">Score: {s.score}% · Level {s.level}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
