import { supabase } from '@/integrations/supabase/client';

export interface GameProgress {
  user_id: string;
  game_id: string;
  current_level: number;
  highest_level: number;
  total_sessions: number;
  last_played_at: string;
}

/** Fetch the user's saved progress for a specific game. Returns null if none yet. */
export async function getProgress(userId: string, gameId: string): Promise<GameProgress | null> {
  const { data, error } = await supabase
    .from('game_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('game_id', gameId)
    .maybeSingle();

  if (error) {
    console.warn('[gameProgress] getProgress error:', error.message);
    return null;
  }
  return data as GameProgress | null;
}

/** Upsert the user's current level + bump session count + update last_played. */
export async function saveProgress(
  userId: string,
  gameId: string,
  currentLevel: number,
  options: { incrementSessions?: boolean } = {}
): Promise<void> {
  const existing = await getProgress(userId, gameId);
  const highest = Math.max(existing?.highest_level ?? 1, currentLevel);
  const sessions = (existing?.total_sessions ?? 0) + (options.incrementSessions ? 1 : 0);

  const { error } = await supabase
    .from('game_progress')
    .upsert(
      {
        user_id: userId,
        game_id: gameId,
        current_level: currentLevel,
        highest_level: highest,
        total_sessions: sessions,
        last_played_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,game_id' }
    );

  if (error) {
    console.warn('[gameProgress] saveProgress error:', error.message);
  }
}
