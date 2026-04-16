// Service to fetch real patient data from game_sessions table
import { supabase } from '@/integrations/supabase/client';

export interface PatientStats {
  totalSessions: number;
  averageScore: number;
  streakDays: number;
  improvement: number;
  bestScore: number;
  bestGameName: string;
  totalTimeMins: number;
  completionRate: number;
  achievementsCount: number;
  weeklyProgress: {
    sessions: { current: number; target: number };
    improvement: { current: number; target: number };
    newGames: { current: number; target: number };
  };
}

export interface DomainScores {
  memory: number;
  attention: number;
  executive: number;
  processing: number;
}

export interface ChartDataPoint {
  date: string;
  memory: number;
  attention: number;
  executive: number;
  processing: number;
}

export interface ActivityItem {
  id: string;
  type: 'game';
  title: string;
  description: string;
  timestamp: string;
  domain: string;
  score: number;
}

export interface SessionEntry {
  id: string;
  gameId: string;
  gameName: string;
  score: number;
  level: number;
  duration: number;
  completed: boolean;
  timestamp: string;
  domain: string;
  difficulty: string;
}

const DOMAIN_MAP: Record<string, string> = {
  'memory-matching': 'memory',
  'word-memory': 'memory',
  'audio-memory': 'memory',
  'spatial-navigation': 'memory',
  'attention-focus': 'attention',
  'reaction-speed': 'processing',
  'processing-speed': 'processing',
  'visual-processing': 'processing',
  'pattern-recognition': 'executive',
  'math-challenge': 'executive',
  'executive-function': 'executive',
  'tower-of-hanoi': 'executive',
  'tower-hanoi': 'executive',
};

function getDomain(gameId: string, rawDomain?: string): string {
  return DOMAIN_MAP[gameId] || rawDomain || 'memory';
}

export async function getPatientSessions(limit = 500): Promise<SessionEntry[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('game_sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data.map((s: any) => ({
    id: s.id,
    gameId: s.game_id,
    gameName: s.game_name,
    score: s.score ?? 0,
    level: s.level ?? 1,
    duration: s.duration ?? 0,
    completed: s.completed ?? false,
    timestamp: s.created_at,
    domain: getDomain(s.game_id, s.domain),
    difficulty: s.difficulty ?? 'medium',
  }));
}

export function computeStats(sessions: SessionEntry[]): PatientStats {
  if (sessions.length === 0) {
    return {
      totalSessions: 0, averageScore: 0, streakDays: 0, improvement: 0,
      bestScore: 0, bestGameName: '-', totalTimeMins: 0, completionRate: 0,
      achievementsCount: 0,
      weeklyProgress: {
        sessions: { current: 0, target: 7 },
        improvement: { current: 0, target: 10 },
        newGames: { current: 0, target: 3 },
      },
    };
  }

  const totalSessions = sessions.length;
  const averageScore = Math.round(sessions.reduce((s, h) => s + h.score, 0) / totalSessions);
  const best = sessions.reduce((a, b) => a.score > b.score ? a : b);
  const totalTimeMins = Math.round(sessions.reduce((s, h) => s + h.duration, 0) / 60);
  const completionRate = Math.round(sessions.filter(s => s.completed).length / totalSessions * 100);

  // Streak calculation
  const days = new Set(sessions.map(s => s.timestamp.split('T')[0]));
  const sortedDays = Array.from(days).sort().reverse();
  let streakDays = 0;
  for (let i = 0; i < sortedDays.length; i++) {
    const expected = new Date();
    expected.setDate(expected.getDate() - i);
    if (sortedDays[i] === expected.toISOString().split('T')[0]) {
      streakDays++;
    } else break;
  }

  // Weekly progress
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const thisWeek = sessions.filter(s => new Date(s.timestamp) >= oneWeekAgo);
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  const lastWeek = sessions.filter(s => {
    const d = new Date(s.timestamp);
    return d >= twoWeeksAgo && d < oneWeekAgo;
  });

  const thisWeekAvg = thisWeek.length ? thisWeek.reduce((s, h) => s + h.score, 0) / thisWeek.length : 0;
  const lastWeekAvg = lastWeek.length ? lastWeek.reduce((s, h) => s + h.score, 0) / lastWeek.length : 0;
  const improvement = lastWeekAvg > 0 ? Math.round(((thisWeekAvg - lastWeekAvg) / lastWeekAvg) * 100) : 0;

  const uniqueGamesThisWeek = new Set(thisWeek.map(s => s.gameId)).size;

  return {
    totalSessions,
    averageScore,
    streakDays,
    improvement,
    bestScore: best.score,
    bestGameName: best.gameName,
    totalTimeMins,
    completionRate,
    achievementsCount: 0, // Will be computed from achievements table if needed
    weeklyProgress: {
      sessions: { current: thisWeek.length, target: 7 },
      improvement: { current: Math.max(0, improvement), target: 10 },
      newGames: { current: uniqueGamesThisWeek, target: 3 },
    },
  };
}

export function computeDomainScores(sessions: SessionEntry[]): DomainScores {
  const domains: Record<string, number[]> = { memory: [], attention: [], executive: [], processing: [] };
  
  // Use recent sessions (last 20 per domain) for current scores
  sessions.forEach(s => {
    const d = getDomain(s.gameId, s.domain);
    if (domains[d] && domains[d].length < 20) {
      domains[d].push(s.score);
    }
  });

  const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

  return {
    memory: avg(domains.memory),
    attention: avg(domains.attention),
    executive: avg(domains.executive),
    processing: avg(domains.processing),
  };
}

export function computeChartData(sessions: SessionEntry[]): ChartDataPoint[] {
  if (sessions.length === 0) return [];

  // Group sessions by day, compute domain averages per day for last 8 days
  const days: Map<string, Record<string, number[]>> = new Map();
  const now = new Date();

  for (let i = 7; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    days.set(key, { memory: [], attention: [], executive: [], processing: [] });
  }

  sessions.forEach(s => {
    const day = s.timestamp.split('T')[0];
    const bucket = days.get(day);
    if (bucket) {
      const domain = getDomain(s.gameId, s.domain);
      if (bucket[domain]) bucket[domain].push(s.score);
    }
  });

  const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

  // Carry forward last known scores
  let lastMemory = 0, lastAttention = 0, lastExec = 0, lastProc = 0;
  const result: ChartDataPoint[] = [];

  for (const [date, scores] of days) {
    const m = avg(scores.memory) || lastMemory;
    const a = avg(scores.attention) || lastAttention;
    const e = avg(scores.executive) || lastExec;
    const p = avg(scores.processing) || lastProc;
    lastMemory = m; lastAttention = a; lastExec = e; lastProc = p;

    const d = new Date(date);
    const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    result.push({ date: label, memory: m, attention: a, executive: e, processing: p });
  }

  return result;
}

export function computeRecentActivity(sessions: SessionEntry[], limit = 5): ActivityItem[] {
  return sessions.slice(0, limit).map(s => ({
    id: s.id,
    type: 'game' as const,
    title: `${s.gameName} Completed`,
    description: `Score: ${s.score}% · Level ${s.level} · ${s.difficulty}`,
    timestamp: s.timestamp,
    domain: s.domain,
    score: s.score,
  }));
}

export function computeHeatmapData(sessions: SessionEntry[]): Map<string, number> {
  const map = new Map<string, number>();
  sessions.forEach(s => {
    const day = s.timestamp.split('T')[0];
    map.set(day, (map.get(day) || 0) + 1);
  });
  return map;
}

export function computeAnalyticsReport(sessions: SessionEntry[], userName: string) {
  const stats = computeStats(sessions);
  const domainScores = computeDomainScores(sessions);

  // Compute per-game stats
  const gameMap: Record<string, { scores: number[]; count: number; totalDuration: number }> = {};
  sessions.forEach(s => {
    if (!gameMap[s.gameName]) gameMap[s.gameName] = { scores: [], count: 0, totalDuration: 0 };
    gameMap[s.gameName].scores.push(s.score);
    gameMap[s.gameName].count++;
    gameMap[s.gameName].totalDuration += s.duration;
  });

  const gameStats = Object.entries(gameMap).map(([name, data]) => ({
    name,
    sessionsPlayed: data.count,
    averageScore: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length),
    bestScore: Math.max(...data.scores),
    timeSpent: `${Math.round(data.totalDuration / 60)}m`,
  }));

  // Weekly domain changes
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const recentSessions = sessions.filter(s => new Date(s.timestamp) >= oneWeekAgo);
  const olderSessions = sessions.filter(s => new Date(s.timestamp) < oneWeekAgo);
  
  const recentDomain = computeDomainScores(recentSessions);
  const olderDomain = computeDomainScores(olderSessions);

  const domainChange = (recent: number, old: number) => {
    if (old === 0) return '+0%';
    const diff = Math.round(((recent - old) / old) * 100);
    return diff >= 0 ? `+${diff}% improvement` : `${diff}% change`;
  };

  return {
    userName,
    reportDate: new Date().toLocaleDateString(),
    overallImprovement: stats.improvement >= 0 ? `+${stats.improvement}%` : `${stats.improvement}%`,
    trainingDays: new Set(sessions.map(s => s.timestamp.split('T')[0])).size,
    achievements: stats.achievementsCount,
    bestScore: `${stats.bestScore}% (${stats.bestGameName})`,
    totalSessions: stats.totalSessions,
    avgSessionDuration: `${stats.totalTimeMins > 0 ? Math.round(stats.totalTimeMins / stats.totalSessions) : 0} minutes`,
    longestStreak: stats.streakDays, // Simplified
    currentStreak: stats.streakDays,
    weeklyProgress: {
      memory: domainChange(recentDomain.memory, olderDomain.memory),
      attention: domainChange(recentDomain.attention, olderDomain.attention),
      executive: domainChange(recentDomain.executive, olderDomain.executive),
      processing: domainChange(recentDomain.processing, olderDomain.processing),
    },
    detailedScores: {
      memory: { current: domainScores.memory, previous: olderDomain.memory, best: Math.max(domainScores.memory, olderDomain.memory) },
      attention: { current: domainScores.attention, previous: olderDomain.attention, best: Math.max(domainScores.attention, olderDomain.attention) },
      executive: { current: domainScores.executive, previous: olderDomain.executive, best: Math.max(domainScores.executive, olderDomain.executive) },
      processing: { current: domainScores.processing, previous: olderDomain.processing, best: Math.max(domainScores.processing, olderDomain.processing) },
    },
    gameStats,
    cognitiveData: {
      memory: [olderDomain.memory || 50, domainScores.memory || 50],
      attention: [olderDomain.attention || 50, domainScores.attention || 50],
      executive: [olderDomain.executive || 50, domainScores.executive || 50],
      processing: [olderDomain.processing || 50, domainScores.processing || 50],
    },
  };
}
