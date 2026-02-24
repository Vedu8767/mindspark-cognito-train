// Daily Challenge System
// Generates curated daily challenges with streak tracking

export interface DailyChallenge {
  id: string;
  date: string; // YYYY-MM-DD
  gameId: string;
  gameName: string;
  domain: 'memory' | 'attention' | 'executive' | 'processing';
  difficulty: 'easy' | 'medium' | 'hard';
  targetScore: number;
  bonusObjective: string;
  xpReward: number;
  streakBonus: number;
  completed: boolean;
  score?: number;
}

export interface ChallengeStreak {
  current: number;
  longest: number;
  lastCompleted: string | null;
  totalCompleted: number;
  rewards: StreakReward[];
}

export interface StreakReward {
  streakRequired: number;
  name: string;
  icon: string;
  description: string;
  unlocked: boolean;
}

const GAMES = [
  { id: 'memory-matching', name: 'Memory Matching', domain: 'memory' as const },
  { id: 'attention-focus', name: 'Attention Focus', domain: 'attention' as const },
  { id: 'reaction-speed', name: 'Reaction Speed', domain: 'processing' as const },
  { id: 'pattern-recognition', name: 'Pattern Recognition', domain: 'executive' as const },
  { id: 'word-memory', name: 'Word Memory', domain: 'memory' as const },
  { id: 'math-challenge', name: 'Math Challenge', domain: 'executive' as const },
  { id: 'visual-processing', name: 'Visual Processing', domain: 'processing' as const },
  { id: 'executive-function', name: 'Executive Function', domain: 'executive' as const },
  { id: 'spatial-navigation', name: 'Spatial Navigation', domain: 'memory' as const },
  { id: 'processing-speed', name: 'Processing Speed', domain: 'processing' as const },
  { id: 'audio-memory', name: 'Audio Memory', domain: 'memory' as const },
  { id: 'tower-hanoi', name: 'Tower of Hanoi', domain: 'executive' as const },
];

const BONUS_OBJECTIVES = [
  'Complete without any mistakes',
  'Finish in under 60 seconds',
  'Achieve 90%+ accuracy',
  'Complete 3 levels in a row',
  'Beat your personal best',
  'Maintain a perfect streak',
  'Score in the top percentile',
  'Complete with 100% efficiency',
];

const STREAK_REWARDS: StreakReward[] = [
  { streakRequired: 3, name: 'Getting Started', icon: '🌱', description: '3-day training streak', unlocked: false },
  { streakRequired: 7, name: 'Week Warrior', icon: '⚡', description: '7-day training streak', unlocked: false },
  { streakRequired: 14, name: 'Dedicated Learner', icon: '📚', description: '14-day training streak', unlocked: false },
  { streakRequired: 21, name: 'Brain Builder', icon: '🧠', description: '21-day training streak', unlocked: false },
  { streakRequired: 30, name: 'Monthly Master', icon: '🏆', description: '30-day training streak', unlocked: false },
  { streakRequired: 50, name: 'Elite Trainer', icon: '💎', description: '50-day training streak', unlocked: false },
  { streakRequired: 100, name: 'Centurion', icon: '👑', description: '100-day training streak', unlocked: false },
];

// Deterministic daily challenge based on date
const seededRandom = (seed: number): number => {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
};

const getDateSeed = (date: string): number => {
  return date.split('-').reduce((acc, part) => acc * 100 + parseInt(part), 0);
};

export const getDailyChallenge = (date?: string): DailyChallenge => {
  const today = date || new Date().toISOString().split('T')[0];
  const seed = getDateSeed(today);

  const gameIndex = Math.floor(seededRandom(seed) * GAMES.length);
  const game = GAMES[gameIndex];

  const difficulties: ('easy' | 'medium' | 'hard')[] = ['easy', 'medium', 'hard'];
  const difficultyIndex = Math.floor(seededRandom(seed + 1) * 3);
  const difficulty = difficulties[difficultyIndex];

  const bonusIndex = Math.floor(seededRandom(seed + 2) * BONUS_OBJECTIVES.length);

  const targetScore = difficulty === 'easy' ? 70 : difficulty === 'medium' ? 80 : 90;
  const xpReward = difficulty === 'easy' ? 50 : difficulty === 'medium' ? 100 : 150;

  return {
    id: `daily-${today}`,
    date: today,
    gameId: game.id,
    gameName: game.name,
    domain: game.domain,
    difficulty,
    targetScore,
    bonusObjective: BONUS_OBJECTIVES[bonusIndex],
    xpReward,
    streakBonus: 0,
    completed: false,
  };
};

export const getStreakData = (): ChallengeStreak => {
  const stored = localStorage.getItem('daily-challenge-streak');
  if (stored) {
    const data = JSON.parse(stored) as ChallengeStreak;
    // Check if streak is still active
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    if (data.lastCompleted !== today && data.lastCompleted !== yesterday) {
      data.current = 0; // Streak broken
    }
    
    // Update rewards
    data.rewards = STREAK_REWARDS.map(r => ({
      ...r,
      unlocked: data.longest >= r.streakRequired,
    }));
    
    return data;
  }

  return {
    current: 0,
    longest: 0,
    lastCompleted: null,
    totalCompleted: 0,
    rewards: STREAK_REWARDS.map(r => ({ ...r })),
  };
};

export const completeChallenge = (score: number): ChallengeStreak => {
  const today = new Date().toISOString().split('T')[0];
  const streak = getStreakData();

  if (streak.lastCompleted === today) return streak; // Already completed today

  streak.current++;
  streak.totalCompleted++;
  streak.lastCompleted = today;
  if (streak.current > streak.longest) streak.longest = streak.current;

  streak.rewards = STREAK_REWARDS.map(r => ({
    ...r,
    unlocked: streak.longest >= r.streakRequired,
  }));

  localStorage.setItem('daily-challenge-streak', JSON.stringify(streak));

  // Save challenge completion
  const challenge = getDailyChallenge(today);
  challenge.completed = true;
  challenge.score = score;
  challenge.streakBonus = Math.min(streak.current * 10, 100);
  
  const completedChallenges = JSON.parse(localStorage.getItem('completed-challenges') || '[]');
  completedChallenges.push(challenge);
  localStorage.setItem('completed-challenges', JSON.stringify(completedChallenges.slice(-90))); // Keep last 90 days

  return streak;
};

export const getCompletedChallenges = (): DailyChallenge[] => {
  return JSON.parse(localStorage.getItem('completed-challenges') || '[]');
};

export const getActivityData = (days: number = 365): Map<string, number> => {
  const completed = getCompletedChallenges();
  const activityMap = new Map<string, number>();

  // Also include any general session data
  const sessionLog = JSON.parse(localStorage.getItem('session-activity-log') || '[]') as { date: string; count: number }[];

  completed.forEach(c => {
    const current = activityMap.get(c.date) || 0;
    activityMap.set(c.date, current + 1);
  });

  sessionLog.forEach(s => {
    const current = activityMap.get(s.date) || 0;
    activityMap.set(s.date, current + s.count);
  });

  return activityMap;
};

export const logSession = () => {
  const today = new Date().toISOString().split('T')[0];
  const log = JSON.parse(localStorage.getItem('session-activity-log') || '[]') as { date: string; count: number }[];
  
  const todayEntry = log.find(e => e.date === today);
  if (todayEntry) {
    todayEntry.count++;
  } else {
    log.push({ date: today, count: 1 });
  }

  // Keep last 365 days
  const cutoff = new Date(Date.now() - 365 * 86400000).toISOString().split('T')[0];
  const filtered = log.filter(e => e.date >= cutoff);
  localStorage.setItem('session-activity-log', JSON.stringify(filtered));
};
