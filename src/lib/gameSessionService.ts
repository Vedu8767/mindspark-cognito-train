// Database-backed game session recording
import { supabase } from '@/integrations/supabase/client';

export interface GameSessionData {
  gameId: string;
  gameName: string;
  domain: string;
  score: number;
  level: number;
  duration: number; // seconds
  completed: boolean;
  difficulty: string;
  accuracy?: number;
  reactionTime?: number;
  moves?: number;
  metadata?: Record<string, any>;
}

export async function recordGameSession(data: GameSessionData) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.warn('[GameSessions] No authenticated user, skipping DB save');
    // Fallback to localStorage
    saveFallback(data);
    return;
  }

  const { error } = await supabase.from('game_sessions').insert({
    user_id: user.id,
    game_id: data.gameId,
    game_name: data.gameName,
    domain: data.domain,
    score: data.score,
    level: data.level,
    duration: data.duration,
    completed: data.completed,
    difficulty: data.difficulty,
    accuracy: data.accuracy ?? null,
    reaction_time: data.reactionTime ?? null,
    moves: data.moves ?? null,
    metadata: data.metadata ?? {},
  });

  if (error) {
    console.error('[GameSessions] DB insert failed, falling back to localStorage', error);
    saveFallback(data);
  }
}

export async function getGameSessions(limit = 100) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return getFallbackHistory();

  const { data, error } = await supabase
    .from('game_sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) return getFallbackHistory();
  return data;
}

// Fallback for unauthenticated / offline usage
const FALLBACK_KEY = 'mci-game-history';

function saveFallback(data: GameSessionData) {
  try {
    const history = getFallbackHistory();
    history.push({
      id: crypto.randomUUID(),
      ...data,
      timestamp: new Date().toISOString(),
    });
    if (history.length > 500) history.splice(0, history.length - 500);
    localStorage.setItem(FALLBACK_KEY, JSON.stringify(history));
  } catch {}
}

function getFallbackHistory() {
  try {
    const stored = localStorage.getItem(FALLBACK_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}
