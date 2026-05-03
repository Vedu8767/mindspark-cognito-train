import { useState, useMemo, useEffect } from 'react';
import { Brain, Cpu, Activity, TrendingUp, Gauge, Zap, Eye, Target, Volume2, Calculator, Puzzle, Navigation } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, Legend } from 'recharts';
import {
  memoryGameBandit,
  attentionBandit,
  reactionBandit,
  wordMemoryBandit,
  mathChallengeBandit,
  visualProcessingBandit,
  executiveFunctionBandit,
  spatialBandit,
  processingSpeedBandit,
  towerOfHanoiBandit,
  audioMemoryBandit,
} from '@/lib/bandit';
import { patternRecognitionBandit } from '@/lib/bandit/patternBandit';

interface GameBanditInfo {
  id: string;
  name: string;
  icon: React.ElementType;
  domain: 'memory' | 'attention' | 'executive' | 'processing';
  explorationRate: number;
  skillLevel: number;
  totalPulls: number;
  currentLevel: number;
}

function getAdaptationSpeed(epsilon: number): string {
  if (epsilon <= 0.10) return 'slow';
  if (epsilon <= 0.20) return 'medium';
  return 'fast';
}

function collectBanditData(): GameBanditInfo[] {
  const memStats = memoryGameBandit.getStats();
  const attStats = attentionBandit.getStats();
  const reactStats = reactionBandit.getStats();
  const patStats = patternRecognitionBandit.getStats();
  const wordStats = wordMemoryBandit.getStats();
  const mathStats = mathChallengeBandit.getStats();
  const visStats = visualProcessingBandit.getStats();
  const execStats = executiveFunctionBandit.getStats();
  const spatStats = spatialBandit.getStats();
  const procStats = processingSpeedBandit.getStats();
  const hanoiStats = towerOfHanoiBandit.getStats();
  const audioStats = audioMemoryBandit.getStats();

  // For new users (no pulls), force skill=0 and level=1 so default model
  // parameters never render as if they were real patient progress.
  const zeroIfFresh = (pulls: number, value: number) => (pulls > 0 ? value : 0);
  const lvlIfFresh = (pulls: number, value: number) => (pulls > 0 ? value : 1);

  return [
    { id: 'memory-matching', name: 'Memory Matching', icon: Brain, domain: 'memory', explorationRate: memStats.epsilon, skillLevel: zeroIfFresh(memStats.totalPulls, memStats.skillLevel), totalPulls: memStats.totalPulls, currentLevel: lvlIfFresh(memStats.totalPulls, Math.round(memStats.skillLevel * 25) || 1) },
    { id: 'attention-focus', name: 'Attention Focus', icon: Target, domain: 'attention', explorationRate: attStats.epsilon, skillLevel: zeroIfFresh(attStats.totalPulls, attStats.skillLevel), totalPulls: attStats.totalPulls, currentLevel: lvlIfFresh(attStats.totalPulls, Math.round(attStats.skillLevel * 25) || 1) },
    { id: 'reaction-speed', name: 'Reaction Speed', icon: Zap, domain: 'processing', explorationRate: reactStats.epsilon, skillLevel: zeroIfFresh(reactStats.totalPulls, reactStats.skillLevel), totalPulls: reactStats.totalPulls, currentLevel: lvlIfFresh(reactStats.totalPulls, Math.round(reactStats.skillLevel * 25) || 1) },
    { id: 'pattern-recognition', name: 'Pattern Recognition', icon: Puzzle, domain: 'executive', explorationRate: patStats.epsilon, skillLevel: zeroIfFresh(patStats.totalPulls, patStats.skillLevel), totalPulls: patStats.totalPulls, currentLevel: lvlIfFresh(patStats.totalPulls, patStats.currentLevel ?? 1) },
    { id: 'word-memory', name: 'Word Memory', icon: Brain, domain: 'memory', explorationRate: wordStats.epsilon, skillLevel: zeroIfFresh(wordStats.totalPulls, (wordStats.currentLevel ?? 1) / 25), totalPulls: wordStats.totalPulls, currentLevel: lvlIfFresh(wordStats.totalPulls, wordStats.currentLevel ?? 1) },
    { id: 'math-challenge', name: 'Math Challenge', icon: Calculator, domain: 'executive', explorationRate: mathStats.epsilon, skillLevel: zeroIfFresh(mathStats.totalPulls, (mathStats.currentLevel ?? 1) / 25), totalPulls: mathStats.totalPulls, currentLevel: lvlIfFresh(mathStats.totalPulls, mathStats.currentLevel ?? 1) },
    { id: 'visual-processing', name: 'Visual Processing', icon: Eye, domain: 'processing', explorationRate: visStats.epsilon, skillLevel: zeroIfFresh(visStats.totalPulls, visStats.skillLevel), totalPulls: visStats.totalPulls, currentLevel: lvlIfFresh(visStats.totalPulls, Math.round(visStats.skillLevel * 25) || 1) },
    { id: 'executive-function', name: 'Executive Function', icon: Cpu, domain: 'executive', explorationRate: execStats.epsilon, skillLevel: zeroIfFresh(execStats.totalPulls, execStats.skillLevel), totalPulls: execStats.totalPulls, currentLevel: lvlIfFresh(execStats.totalPulls, Math.round(execStats.skillLevel * 25) || 1) },
    { id: 'spatial-navigation', name: 'Spatial Navigation', icon: Navigation, domain: 'memory', explorationRate: spatStats.epsilon, skillLevel: zeroIfFresh(spatStats.totalPulls, spatStats.skillLevel), totalPulls: spatStats.totalPulls, currentLevel: lvlIfFresh(spatStats.totalPulls, Math.round(spatStats.skillLevel * 25) || 1) },
    { id: 'processing-speed', name: 'Processing Speed', icon: Zap, domain: 'processing', explorationRate: procStats.epsilon, skillLevel: zeroIfFresh(procStats.totalPulls, procStats.skillLevel), totalPulls: procStats.totalPulls, currentLevel: lvlIfFresh(procStats.totalPulls, Math.round(procStats.skillLevel * 25) || 1) },
    { id: 'audio-memory', name: 'Audio Memory', icon: Volume2, domain: 'memory', explorationRate: audioStats.epsilon, skillLevel: zeroIfFresh(audioStats.totalPulls, audioStats.skillLevel / 100), totalPulls: audioStats.totalPulls, currentLevel: lvlIfFresh(audioStats.totalPulls, Math.max(1, Math.round(audioStats.skillLevel / 4))) },
    { id: 'tower-of-hanoi', name: 'Tower of Hanoi', icon: Puzzle, domain: 'executive', explorationRate: hanoiStats.epsilon, skillLevel: zeroIfFresh(hanoiStats.totalPulls, hanoiStats.skillLevel / 100), totalPulls: hanoiStats.totalPulls, currentLevel: lvlIfFresh(hanoiStats.totalPulls, Math.max(1, Math.round(hanoiStats.skillLevel / 4))) },
  ];
}

const AIInsightsDashboard = () => {
  const [gameBandits, setGameBandits] = useState<GameBanditInfo[]>(() => collectBanditData());

  // Refresh data periodically when tab is focused
  useEffect(() => {
    const refresh = () => setGameBandits(collectBanditData());
    const interval = setInterval(refresh, 5000);
    window.addEventListener('focus', refresh);
    window.addEventListener('bandit-state-changed', refresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', refresh);
      window.removeEventListener('bandit-state-changed', refresh);
    };
  }, []);

  const domainAverages = useMemo(() => {
    const domains = ['memory', 'attention', 'executive', 'processing'] as const;
    return domains.map(d => {
      const games = gameBandits.filter(g => g.domain === d);
      const avgSkill = games.length > 0 ? games.reduce((s, g) => s + g.skillLevel, 0) / games.length : 0;
      const avgLevel = games.length > 0 ? games.reduce((s, g) => s + g.currentLevel, 0) / games.length : 0;
      const avgExploration = games.length > 0 ? games.reduce((s, g) => s + g.explorationRate, 0) / games.length : 0;
      return {
        domain: d.charAt(0).toUpperCase() + d.slice(1),
        skillLevel: Math.round(Math.min(100, avgSkill * 100)),
        avgLevel: Math.round(avgLevel),
        explorationRate: Math.round(avgExploration * 100),
      };
    });
  }, [gameBandits]);

  const radarData = domainAverages.map(d => ({
    subject: d.domain,
    skill: d.skillLevel,
    level: (d.avgLevel / 25) * 100,
    fullMark: 100,
  }));

  const overallExploration = Math.round(gameBandits.reduce((s, g) => s + g.explorationRate, 0) / gameBandits.length * 100);
  const overallSkill = Math.round(gameBandits.reduce((s, g) => s + Math.min(1, g.skillLevel), 0) / gameBandits.length * 100);
  const totalSessions = gameBandits.reduce((s, g) => s + g.totalPulls, 0);
  const adaptedCount = gameBandits.filter(g => g.totalPulls > 0).length;

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
              Live data from your Epsilon-Greedy Contextual Bandits across all 12 games
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
            <p className="text-sm text-muted-foreground">Avg Exploration ε</p>
            <p className="text-2xl font-bold text-foreground">{overallExploration}%</p>
            <p className="text-xs text-muted-foreground mt-1">
              {overallExploration > 20 ? 'Still learning your style' : overallExploration > 10 ? 'Adapting well' : totalSessions === 0 ? 'No data yet — play games!' : 'Fully personalized'}
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
            <p className="text-sm text-muted-foreground">Games With Data</p>
            <p className="text-2xl font-bold text-foreground">{adaptedCount}/12</p>
            <p className="text-xs text-muted-foreground mt-1">{adaptedCount === 12 ? '✅ All games active' : `Play ${12 - adaptedCount} more to complete`}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-fit">
          <TabsTrigger value="overview">Domain Overview</TabsTrigger>
          <TabsTrigger value="games">Per-Game Detail</TabsTrigger>
          <TabsTrigger value="learning">Exploration Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {gameBandits.map(game => {
              const Icon = game.icon;
              const domainBg = game.domain === 'memory' ? 'bg-cognitive-memory/10' :
                game.domain === 'attention' ? 'bg-cognitive-attention/10' :
                game.domain === 'executive' ? 'bg-cognitive-executive/10' :
                'bg-cognitive-processing/10';
              const speed = getAdaptationSpeed(game.explorationRate);
              const clampedSkill = Math.min(100, Math.round(game.skillLevel * 100));

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
                        game.totalPulls === 0 ? 'bg-muted/30 text-muted-foreground' :
                        speed === 'slow' ? 'bg-success/10 text-success' :
                        speed === 'medium' ? 'bg-accent/10 text-accent-foreground' :
                        'bg-primary/10 text-primary'
                      }`}>
                        {game.totalPulls === 0 ? '⏳ No data' : speed === 'slow' ? '✅ Stable' : speed === 'medium' ? '🔄 Adapting' : '🔍 Learning'}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Level</span>
                          <span className="font-medium text-foreground">{game.currentLevel}/25</span>
                        </div>
                        <Progress value={(game.currentLevel / 25) * 100} className="h-1.5" />
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 bg-muted/30 rounded-lg">
                          <p className="text-xs text-muted-foreground">Skill</p>
                          <p className="text-sm font-bold text-foreground">{clampedSkill}%</p>
                        </div>
                        <div className="p-2 bg-muted/30 rounded-lg">
                          <p className="text-xs text-muted-foreground">ε-Rate</p>
                          <p className="text-sm font-bold text-foreground">{Math.round(game.explorationRate * 100)}%</p>
                        </div>
                        <div className="p-2 bg-muted/30 rounded-lg">
                          <p className="text-xs text-muted-foreground">Pulls</p>
                          <p className="text-sm font-bold text-foreground">{game.totalPulls}</p>
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground text-center">
                        {game.totalPulls === 0 ? 'Play this game to start AI adaptation' : `${game.totalPulls} AI decision${game.totalPulls !== 1 ? 's' : ''} made`}
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
            {/* Exploration rates bar chart */}
            <Card className="glass-card p-6">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-lg">Exploration Rate (ε) by Game</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={gameBandits.map(g => ({ name: g.name.split(' ')[0], epsilon: Math.round(g.explorationRate * 100), pulls: g.totalPulls }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} domain={[0, 35]} label={{ value: 'ε %', position: 'insideLeft', fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }}
                      formatter={(value: number) => [`${value}%`, 'Exploration Rate']}
                    />
                    <Bar dataKey="epsilon" fill="hsl(var(--primary))" name="ε %" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Skill vs Pulls scatter-like bar */}
            <Card className="glass-card p-6">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-lg">Skill Level vs Training Volume</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={gameBandits.map(g => ({ name: g.name.split(' ')[0], skill: Math.min(100, Math.round(g.skillLevel * 100)), pulls: g.totalPulls }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
                    <Legend />
                    <Bar dataKey="skill" fill="hsl(var(--primary))" name="Skill %" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="pulls" fill="hsl(var(--accent))" name="Total Pulls" radius={[4, 4, 0, 0]} />
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
