import { useState, useMemo } from 'react';
import { Brain, Cpu, Activity, TrendingUp, Gauge, Zap, Eye, Target, Volume2, Calculator, Puzzle, Navigation, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, Legend } from 'recharts';

interface GameBanditInfo {
  id: string;
  name: string;
  icon: React.ElementType;
  domain: 'memory' | 'attention' | 'executive' | 'processing';
  currentLevel: number;
  maxLevel: number;
  explorationRate: number;
  skillLevel: number;
  totalPulls: number;
  avgReward: number;
  adaptationSpeed: string;
}

const AIInsightsDashboard = () => {
  // Mock bandit data for all 12 games (in real app, pull from bandit instances)
  const gameBandits: GameBanditInfo[] = [
    { id: 'memory-matching', name: 'Memory Matching', icon: Brain, domain: 'memory', currentLevel: 12, maxLevel: 25, explorationRate: 0.15, skillLevel: 0.72, totalPulls: 48, avgReward: 7.2, adaptationSpeed: 'fast' },
    { id: 'attention-focus', name: 'Attention Focus', icon: Target, domain: 'attention', currentLevel: 15, maxLevel: 25, explorationRate: 0.12, skillLevel: 0.78, totalPulls: 35, avgReward: 7.8, adaptationSpeed: 'medium' },
    { id: 'reaction-speed', name: 'Reaction Speed', icon: Zap, domain: 'processing', currentLevel: 8, maxLevel: 25, explorationRate: 0.22, skillLevel: 0.55, totalPulls: 22, avgReward: 6.1, adaptationSpeed: 'fast' },
    { id: 'pattern-recognition', name: 'Pattern Recognition', icon: Puzzle, domain: 'executive', currentLevel: 10, maxLevel: 25, explorationRate: 0.18, skillLevel: 0.65, totalPulls: 30, avgReward: 6.8, adaptationSpeed: 'medium' },
    { id: 'word-memory', name: 'Word Memory', icon: Brain, domain: 'memory', currentLevel: 14, maxLevel: 25, explorationRate: 0.10, skillLevel: 0.80, totalPulls: 52, avgReward: 8.1, adaptationSpeed: 'slow' },
    { id: 'math-challenge', name: 'Math Challenge', icon: Calculator, domain: 'executive', currentLevel: 7, maxLevel: 25, explorationRate: 0.25, skillLevel: 0.48, totalPulls: 18, avgReward: 5.5, adaptationSpeed: 'fast' },
    { id: 'visual-processing', name: 'Visual Processing', icon: Eye, domain: 'processing', currentLevel: 16, maxLevel: 25, explorationRate: 0.08, skillLevel: 0.85, totalPulls: 60, avgReward: 8.5, adaptationSpeed: 'slow' },
    { id: 'executive-function', name: 'Executive Function', icon: Cpu, domain: 'executive', currentLevel: 11, maxLevel: 25, explorationRate: 0.16, skillLevel: 0.68, totalPulls: 40, avgReward: 7.0, adaptationSpeed: 'medium' },
    { id: 'spatial-navigation', name: 'Spatial Navigation', icon: Navigation, domain: 'memory', currentLevel: 9, maxLevel: 25, explorationRate: 0.20, skillLevel: 0.58, totalPulls: 25, avgReward: 6.3, adaptationSpeed: 'fast' },
    { id: 'processing-speed', name: 'Processing Speed', icon: Zap, domain: 'processing', currentLevel: 13, maxLevel: 25, explorationRate: 0.14, skillLevel: 0.75, totalPulls: 45, avgReward: 7.5, adaptationSpeed: 'medium' },
    { id: 'audio-memory', name: 'Audio Memory', icon: Volume2, domain: 'memory', currentLevel: 6, maxLevel: 25, explorationRate: 0.28, skillLevel: 0.42, totalPulls: 15, avgReward: 5.0, adaptationSpeed: 'fast' },
    { id: 'tower-hanoi', name: 'Tower of Hanoi', icon: Puzzle, domain: 'executive', currentLevel: 18, maxLevel: 25, explorationRate: 0.06, skillLevel: 0.90, totalPulls: 70, avgReward: 8.9, adaptationSpeed: 'slow' },
  ];

  const domainColors: Record<string, string> = {
    memory: 'hsl(var(--memory))',
    attention: 'hsl(var(--attention))',
    executive: 'hsl(var(--executive))',
    processing: 'hsl(var(--processing))',
  };

  const domainAverages = useMemo(() => {
    const domains = ['memory', 'attention', 'executive', 'processing'] as const;
    return domains.map(d => {
      const games = gameBandits.filter(g => g.domain === d);
      return {
        domain: d.charAt(0).toUpperCase() + d.slice(1),
        skillLevel: Math.round((games.reduce((s, g) => s + g.skillLevel, 0) / games.length) * 100),
        avgLevel: Math.round(games.reduce((s, g) => s + g.currentLevel, 0) / games.length),
        explorationRate: Math.round((games.reduce((s, g) => s + g.explorationRate, 0) / games.length) * 100),
      };
    });
  }, []);

  const radarData = domainAverages.map(d => ({
    subject: d.domain,
    skill: d.skillLevel,
    level: (d.avgLevel / 25) * 100,
    fullMark: 100,
  }));

  // Simulated learning curve data
  const learningCurve = Array.from({ length: 20 }, (_, i) => ({
    session: i + 1,
    exploration: Math.max(5, 30 - i * 1.3),
    avgReward: Math.min(9.5, 4 + i * 0.28 + Math.sin(i) * 0.3),
    skillLevel: Math.min(95, 30 + i * 3.2 + Math.sin(i * 0.5) * 2),
  }));

  const overallExploration = Math.round(gameBandits.reduce((s, g) => s + g.explorationRate, 0) / gameBandits.length * 100);
  const overallSkill = Math.round(gameBandits.reduce((s, g) => s + g.skillLevel, 0) / gameBandits.length * 100);
  const totalSessions = gameBandits.reduce((s, g) => s + g.totalPulls, 0);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="glass-card-strong p-8">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-br from-primary to-secondary rounded-xl">
            <Cpu className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">AI Adaptation Dashboard</h1>
            <p className="text-lg text-muted-foreground">
              Real-time view of how the AI personalizes your training across all 12 games
            </p>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-6 text-center">
            <div className="p-3 bg-primary/10 rounded-xl w-12 h-12 mx-auto mb-3 flex items-center justify-center">
              <Gauge className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Exploration Rate</p>
            <p className="text-2xl font-bold text-foreground">{overallExploration}%</p>
            <p className="text-xs text-muted-foreground mt-1">
              {overallExploration > 20 ? 'Still learning your style' : overallExploration > 10 ? 'Adapting well' : 'Fully personalized'}
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6 text-center">
            <div className="p-3 bg-success/10 rounded-xl w-12 h-12 mx-auto mb-3 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-success" />
            </div>
            <p className="text-sm text-muted-foreground">Overall Skill</p>
            <p className="text-2xl font-bold text-foreground">{overallSkill}%</p>
            <p className="text-xs text-success mt-1">Across all domains</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6 text-center">
            <div className="p-3 bg-accent/10 rounded-xl w-12 h-12 mx-auto mb-3 flex items-center justify-center">
              <Activity className="h-6 w-6 text-accent" />
            </div>
            <p className="text-sm text-muted-foreground">Total AI Decisions</p>
            <p className="text-2xl font-bold text-foreground">{totalSessions}</p>
            <p className="text-xs text-muted-foreground mt-1">Difficulty adjustments made</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6 text-center">
            <div className="p-3 bg-secondary/10 rounded-xl w-12 h-12 mx-auto mb-3 flex items-center justify-center">
              <Brain className="h-6 w-6 text-secondary" />
            </div>
            <p className="text-sm text-muted-foreground">Games Adapted</p>
            <p className="text-2xl font-bold text-foreground">12/12</p>
            <p className="text-xs text-success mt-1">All games personalized</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-fit">
          <TabsTrigger value="overview">Domain Overview</TabsTrigger>
          <TabsTrigger value="games">Per-Game Detail</TabsTrigger>
          <TabsTrigger value="learning">Learning Curve</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Radar Chart */}
            <Card className="glass-card p-6">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-lg">Cognitive Domain Balance</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                    <Radar name="Skill Level" dataKey="skill" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                    <Radar name="Level Progress" dataKey="level" stroke="hsl(var(--success))" fill="hsl(var(--success))" fillOpacity={0.2} />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Domain Breakdown */}
            <Card className="glass-card p-6">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-lg">Domain Skill Levels</CardTitle>
              </CardHeader>
              <CardContent className="p-0 space-y-5">
                {domainAverages.map(d => (
                  <div key={d.domain} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">{d.domain}</span>
                      <div className="flex items-center space-x-3">
                        <span className="text-xs text-muted-foreground">Lvl {d.avgLevel}/25</span>
                        <span className="text-sm font-bold text-foreground">{d.skillLevel}%</span>
                      </div>
                    </div>
                    <Progress value={d.skillLevel} className="h-2" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Exploration: {d.explorationRate}%</span>
                      <span>{d.explorationRate < 10 ? '✅ Fully adapted' : d.explorationRate < 20 ? '🔄 Adapting' : '🔍 Exploring'}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="games" className="space-y-6">
          {/* Per-Game Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {gameBandits.map(game => {
              const Icon = game.icon;
              const domainBg = game.domain === 'memory' ? 'bg-cognitive-memory/10' :
                game.domain === 'attention' ? 'bg-cognitive-attention/10' :
                game.domain === 'executive' ? 'bg-cognitive-executive/10' :
                'bg-cognitive-processing/10';

              return (
                <Card key={game.id} className="glass-card hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-5">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className={`p-2 rounded-lg ${domainBg}`}>
                        <Icon className="h-5 w-5 text-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-foreground truncate">{game.name}</h4>
                        <p className="text-xs text-muted-foreground capitalize">{game.domain}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        game.adaptationSpeed === 'slow' ? 'bg-success/10 text-success' :
                        game.adaptationSpeed === 'medium' ? 'bg-accent/10 text-accent-foreground' :
                        'bg-primary/10 text-primary'
                      }`}>
                        {game.adaptationSpeed === 'slow' ? '✅ Stable' : game.adaptationSpeed === 'medium' ? '🔄 Adapting' : '🔍 Learning'}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Level</span>
                          <span className="font-medium text-foreground">{game.currentLevel}/{game.maxLevel}</span>
                        </div>
                        <Progress value={(game.currentLevel / game.maxLevel) * 100} className="h-1.5" />
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 bg-muted/30 rounded-lg">
                          <p className="text-xs text-muted-foreground">Skill</p>
                          <p className="text-sm font-bold text-foreground">{Math.round(game.skillLevel * 100)}%</p>
                        </div>
                        <div className="p-2 bg-muted/30 rounded-lg">
                          <p className="text-xs text-muted-foreground">ε-Rate</p>
                          <p className="text-sm font-bold text-foreground">{Math.round(game.explorationRate * 100)}%</p>
                        </div>
                        <div className="p-2 bg-muted/30 rounded-lg">
                          <p className="text-xs text-muted-foreground">Reward</p>
                          <p className="text-sm font-bold text-foreground">{game.avgReward.toFixed(1)}</p>
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground text-center">
                        {game.totalPulls} AI decisions made
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="learning" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Learning Curve */}
            <Card className="glass-card p-6">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-lg">AI Learning Curve</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={learningCurve}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="session" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        background: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        color: 'hsl(var(--foreground))',
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="skillLevel" stroke="hsl(var(--primary))" name="Skill Level %" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="exploration" stroke="hsl(var(--accent))" name="Exploration %" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Reward Distribution */}
            <Card className="glass-card p-6">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-lg">Reward Distribution by Game</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={gameBandits.map(g => ({ name: g.name.split(' ')[0], reward: g.avgReward, pulls: g.totalPulls }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        background: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        color: 'hsl(var(--foreground))',
                      }}
                    />
                    <Bar dataKey="reward" fill="hsl(var(--primary))" name="Avg Reward" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* How it works */}
          <Card className="glass-card p-6">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-lg">🤖 How AI Adaptation Works</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-primary/10 rounded-lg text-center">
                  <p className="text-2xl mb-2">🔍</p>
                  <h4 className="font-medium text-foreground text-sm">1. Explore</h4>
                  <p className="text-xs text-muted-foreground mt-1">AI tries different difficulty settings to learn your capabilities</p>
                </div>
                <div className="p-4 bg-success/10 rounded-lg text-center">
                  <p className="text-2xl mb-2">📊</p>
                  <h4 className="font-medium text-foreground text-sm">2. Measure</h4>
                  <p className="text-xs text-muted-foreground mt-1">Performance metrics like accuracy, speed, and engagement are tracked</p>
                </div>
                <div className="p-4 bg-accent/10 rounded-lg text-center">
                  <p className="text-2xl mb-2">🧠</p>
                  <h4 className="font-medium text-foreground text-sm">3. Learn</h4>
                  <p className="text-xs text-muted-foreground mt-1">The bandit model updates its understanding of your optimal challenge level</p>
                </div>
                <div className="p-4 bg-secondary/10 rounded-lg text-center">
                  <p className="text-2xl mb-2">🎯</p>
                  <h4 className="font-medium text-foreground text-sm">4. Adapt</h4>
                  <p className="text-xs text-muted-foreground mt-1">Difficulty is personalized to keep you in the optimal learning zone</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIInsightsDashboard;
