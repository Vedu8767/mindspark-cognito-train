import { useState, useEffect, useMemo } from 'react';
import { Clock, TrendingUp, Target, Trophy, Calendar, Gamepad2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { getPatientSessions, type SessionEntry } from '@/lib/patientDataService';

const GameHistory = () => {
  const [history, setHistory] = useState<SessionEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPatientSessions(500).then(data => {
      setHistory(data);
      setLoading(false);
    });
  }, []);

  const stats = useMemo(() => {
    if (history.length === 0) return { totalSessions: 0, avgScore: 0, bestScore: 0, totalTime: 0, completionRate: 0 };
    return {
      totalSessions: history.length,
      avgScore: Math.round(history.reduce((s, h) => s + h.score, 0) / history.length),
      bestScore: Math.max(...history.map(h => h.score)),
      totalTime: Math.round(history.reduce((s, h) => s + h.duration, 0) / 60),
      completionRate: Math.round(history.filter(h => h.completed).length / history.length * 100),
    };
  }, [history]);

  const scoreTrend = useMemo(() => {
    return history.slice(0, 20).reverse().map((h, i) => ({
      game: i + 1,
      score: h.score,
      level: h.level,
    }));
  }, [history]);

  const gameBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    history.forEach(h => { counts[h.gameName] = (counts[h.gameName] || 0) + 1; });
    return Object.entries(counts).map(([name, count]) => ({
      name: name.split(' ')[0],
      sessions: count,
    })).sort((a, b) => b.sessions - a.sessions);
  }, [history]);

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="glass-card-strong p-8 text-center">
          <Gamepad2 className="h-16 w-16 text-muted-foreground mx-auto mb-4 animate-pulse" />
          <h1 className="text-3xl font-bold text-foreground mb-2">Loading History...</h1>
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="glass-card-strong p-8 text-center">
          <Gamepad2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-foreground mb-2">Game History</h1>
          <p className="text-lg text-muted-foreground">No games played yet. Start training to see your history!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="glass-card-strong p-8">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-br from-primary to-primary-dark rounded-xl">
            <Clock className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Game History</h1>
            <p className="text-lg text-muted-foreground">Detailed performance tracking across all sessions</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Sessions', value: stats.totalSessions, icon: Gamepad2, color: 'primary' },
          { label: 'Avg Score', value: `${stats.avgScore}%`, icon: Target, color: 'success' },
          { label: 'Best Score', value: `${stats.bestScore}%`, icon: Trophy, color: 'accent' },
          { label: 'Total Time', value: `${stats.totalTime}m`, icon: Clock, color: 'secondary' },
          { label: 'Completion', value: `${stats.completionRate}%`, icon: TrendingUp, color: 'primary' },
        ].map(s => (
          <Card key={s.label} className="glass-card">
            <CardContent className="p-4 text-center">
              <s.icon className={`h-5 w-5 mx-auto mb-2 text-${s.color}`} />
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-xl font-bold text-foreground">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card p-6">
          <CardHeader className="p-0 pb-4"><CardTitle className="text-lg">Score Trend (Recent)</CardTitle></CardHeader>
          <CardContent className="p-0">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={scoreTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="game" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
                <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-card p-6">
          <CardHeader className="p-0 pb-4"><CardTitle className="text-lg">Games Played Breakdown</CardTitle></CardHeader>
          <CardContent className="p-0">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={gameBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
                <Bar dataKey="sessions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card p-6">
        <CardHeader className="p-0 pb-4">
          <CardTitle className="text-lg flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-primary" />
            Recent Sessions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
            {history.slice(0, 50).map(entry => (
              <div key={entry.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg hover:bg-muted/30 transition-colors">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${entry.completed ? 'bg-success' : 'bg-destructive'}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{entry.gameName}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(entry.timestamp).toLocaleDateString()} · {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">{entry.score}%</p>
                    <p className="text-xs text-muted-foreground">Lvl {entry.level}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{entry.duration}s</p>
                    <p className="text-xs capitalize text-muted-foreground">{entry.domain}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GameHistory;
