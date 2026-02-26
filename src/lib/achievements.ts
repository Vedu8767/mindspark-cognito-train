// Achievement & Rewards System

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'streak' | 'mastery' | 'exploration' | 'milestone' | 'special';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  requirement: number;
  progress: number;
  unlocked: boolean;
  unlockedAt?: string;
}

const ACHIEVEMENT_DEFINITIONS: Omit<Achievement, 'progress' | 'unlocked' | 'unlockedAt'>[] = [
  // Streak achievements
  { id: 'streak-3', title: 'Getting Started', description: 'Train 3 days in a row', icon: '🔥', category: 'streak', tier: 'bronze', requirement: 3 },
  { id: 'streak-7', title: 'Week Warrior', description: 'Train 7 days in a row', icon: '🔥', category: 'streak', tier: 'silver', requirement: 7 },
  { id: 'streak-14', title: 'Fortnight Fighter', description: 'Train 14 days in a row', icon: '🔥', category: 'streak', tier: 'gold', requirement: 14 },
  { id: 'streak-30', title: 'Monthly Master', description: 'Train 30 days in a row', icon: '🔥', category: 'streak', tier: 'platinum', requirement: 30 },

  // Mastery achievements
  { id: 'perfect-score', title: 'Perfectionist', description: 'Score 100% in any game', icon: '💯', category: 'mastery', tier: 'silver', requirement: 1 },
  { id: 'perfect-5', title: 'Flawless Five', description: 'Score 100% in 5 games', icon: '💯', category: 'mastery', tier: 'gold', requirement: 5 },
  { id: 'level-10', title: 'Rising Star', description: 'Reach level 10 in any game', icon: '⭐', category: 'mastery', tier: 'silver', requirement: 10 },
  { id: 'level-25', title: 'Grand Master', description: 'Reach level 25 in any game', icon: '👑', category: 'mastery', tier: 'platinum', requirement: 25 },
  { id: 'domain-master', title: 'Domain Expert', description: 'Reach 80% skill in all games of one domain', icon: '🧠', category: 'mastery', tier: 'gold', requirement: 1 },

  // Exploration achievements
  { id: 'first-game', title: 'First Steps', description: 'Complete your first game', icon: '🎮', category: 'exploration', tier: 'bronze', requirement: 1 },
  { id: 'try-all', title: 'Explorer', description: 'Play all 12 games at least once', icon: '🗺️', category: 'exploration', tier: 'gold', requirement: 12 },
  { id: 'play-6', title: 'Curious Mind', description: 'Play 6 different games', icon: '🔍', category: 'exploration', tier: 'silver', requirement: 6 },
  { id: 'daily-complete', title: 'Daily Devotee', description: 'Complete a daily challenge', icon: '📅', category: 'exploration', tier: 'bronze', requirement: 1 },
  { id: 'daily-7', title: 'Challenge Champion', description: 'Complete 7 daily challenges', icon: '📅', category: 'exploration', tier: 'gold', requirement: 7 },

  // Milestone achievements
  { id: 'sessions-10', title: 'Warming Up', description: 'Complete 10 game sessions', icon: '🏃', category: 'milestone', tier: 'bronze', requirement: 10 },
  { id: 'sessions-50', title: 'Dedicated Trainer', description: 'Complete 50 game sessions', icon: '💪', category: 'milestone', tier: 'silver', requirement: 50 },
  { id: 'sessions-100', title: 'Century Club', description: 'Complete 100 game sessions', icon: '🏆', category: 'milestone', tier: 'gold', requirement: 100 },
  { id: 'sessions-500', title: 'Brain Athlete', description: 'Complete 500 game sessions', icon: '🥇', category: 'milestone', tier: 'platinum', requirement: 500 },

  // Special achievements
  { id: 'speed-demon', title: 'Speed Demon', description: 'Complete a game in under 30 seconds', icon: '⚡', category: 'special', tier: 'silver', requirement: 1 },
  { id: 'night-owl', title: 'Night Owl', description: 'Train after midnight', icon: '🦉', category: 'special', tier: 'bronze', requirement: 1 },
  { id: 'early-bird', title: 'Early Bird', description: 'Train before 6 AM', icon: '🐦', category: 'special', tier: 'bronze', requirement: 1 },
  { id: 'ai-optimal', title: 'Optimal Challenge', description: 'AI matched your skill perfectly 5 times', icon: '🤖', category: 'special', tier: 'gold', requirement: 5 },
];

const STORAGE_KEY = 'mci-achievements';

function loadAchievements(): Achievement[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return ACHIEVEMENT_DEFINITIONS.map(def => ({ ...def, progress: 0, unlocked: false }));
}

function saveAchievements(achievements: Achievement[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(achievements));
}

export function getAchievements(): Achievement[] {
  return loadAchievements();
}

export function updateAchievementProgress(id: string, progress: number): Achievement | null {
  const achievements = loadAchievements();
  const achievement = achievements.find(a => a.id === id);
  if (!achievement) return null;

  achievement.progress = Math.max(achievement.progress, progress);
  if (achievement.progress >= achievement.requirement && !achievement.unlocked) {
    achievement.unlocked = true;
    achievement.unlockedAt = new Date().toISOString();
  }

  saveAchievements(achievements);
  return achievement.unlocked ? achievement : null;
}

export function incrementAchievement(id: string, amount = 1): Achievement | null {
  const achievements = loadAchievements();
  const achievement = achievements.find(a => a.id === id);
  if (!achievement) return null;

  achievement.progress += amount;
  if (achievement.progress >= achievement.requirement && !achievement.unlocked) {
    achievement.unlocked = true;
    achievement.unlockedAt = new Date().toISOString();
  }

  saveAchievements(achievements);
  return achievement.unlocked ? achievement : null;
}

export interface GameCompletionData {
  gameId: string;
  score: number;
  level: number;
  duration: number; // seconds
  completed: boolean;
}

export function checkGameAchievements(data: GameCompletionData): Achievement[] {
  const newlyUnlocked: Achievement[] = [];

  // First game
  const first = incrementAchievement('first-game', 0);
  if (!first) updateAchievementProgress('first-game', 1);
  const firstResult = updateAchievementProgress('first-game', 1);
  if (firstResult) newlyUnlocked.push(firstResult);

  // Perfect score
  if (data.score >= 100) {
    const r = incrementAchievement('perfect-score');
    if (r) newlyUnlocked.push(r);
    const r2 = incrementAchievement('perfect-5');
    if (r2) newlyUnlocked.push(r2);
  }

  // Level achievements
  if (data.level >= 10) {
    const r = updateAchievementProgress('level-10', data.level);
    if (r) newlyUnlocked.push(r);
  }
  if (data.level >= 25) {
    const r = updateAchievementProgress('level-25', data.level);
    if (r) newlyUnlocked.push(r);
  }

  // Speed demon
  if (data.duration < 30 && data.completed) {
    const r = updateAchievementProgress('speed-demon', 1);
    if (r) newlyUnlocked.push(r);
  }

  // Time-based
  const hour = new Date().getHours();
  if (hour >= 0 && hour < 5) {
    const r = updateAchievementProgress('night-owl', 1);
    if (r) newlyUnlocked.push(r);
  }
  if (hour >= 4 && hour < 6) {
    const r = updateAchievementProgress('early-bird', 1);
    if (r) newlyUnlocked.push(r);
  }

  // Session count
  const history = getGameHistory();
  const totalSessions = history.length;
  ['sessions-10', 'sessions-50', 'sessions-100', 'sessions-500'].forEach(id => {
    const r = updateAchievementProgress(id, totalSessions);
    if (r) newlyUnlocked.push(r);
  });

  // Exploration - unique games played
  const uniqueGames = new Set(history.map(h => h.gameId)).size;
  const r6 = updateAchievementProgress('play-6', uniqueGames);
  if (r6) newlyUnlocked.push(r6);
  const r12 = updateAchievementProgress('try-all', uniqueGames);
  if (r12) newlyUnlocked.push(r12);

  return newlyUnlocked;
}

// Game history (used by achievements and history page)
export interface GameHistoryEntry {
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

const HISTORY_KEY = 'mci-game-history';

export function getGameHistory(): GameHistoryEntry[] {
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
}

export function addGameHistory(entry: Omit<GameHistoryEntry, 'id' | 'timestamp'>): GameHistoryEntry {
  const history = getGameHistory();
  const newEntry: GameHistoryEntry = {
    ...entry,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  };
  history.push(newEntry);
  // Keep last 500 entries
  if (history.length > 500) history.splice(0, history.length - 500);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  return newEntry;
}

export function getStreakDays(): number {
  const history = getGameHistory();
  if (history.length === 0) return 0;

  const days = new Set(history.map(h => h.timestamp.split('T')[0]));
  const sortedDays = Array.from(days).sort().reverse();

  let streak = 0;
  const today = new Date().toISOString().split('T')[0];

  for (let i = 0; i < sortedDays.length; i++) {
    const expected = new Date();
    expected.setDate(expected.getDate() - i);
    const expectedDate = expected.toISOString().split('T')[0];

    if (sortedDays[i] === expectedDate) {
      streak++;
    } else if (i === 0 && sortedDays[0] !== today) {
      // If no session today, check yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (sortedDays[0] === yesterday.toISOString().split('T')[0]) {
        streak++;
      } else break;
    } else break;
  }

  return streak;
}

export const TIER_COLORS = {
  bronze: { bg: 'bg-amber-700/20', text: 'text-amber-600', border: 'border-amber-600/30' },
  silver: { bg: 'bg-slate-400/20', text: 'text-slate-400', border: 'border-slate-400/30' },
  gold: { bg: 'bg-yellow-500/20', text: 'text-yellow-500', border: 'border-yellow-500/30' },
  platinum: { bg: 'bg-cyan-400/20', text: 'text-cyan-400', border: 'border-cyan-400/30' },
};
