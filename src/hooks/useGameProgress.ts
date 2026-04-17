import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getProgress, saveProgress } from '@/lib/gameProgressService';

/**
 * Hook for per-user, per-game level persistence.
 * - On mount: fetches the user's saved level from Supabase (falls back to 1).
 * - `save(level)` upserts the new level (debounced via Promise).
 * - `loaded` flips true once initial fetch resolves so games can avoid
 *   rendering at the wrong level on first paint.
 */
export function useGameProgress(gameId: string) {
  const { user } = useAuth();
  const [level, setLevel] = useState<number>(1);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setLoaded(true);
      return;
    }
    getProgress(user.id, gameId).then((p) => {
      if (cancelled) return;
      if (p) setLevel(p.current_level);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [user, gameId]);

  const save = useCallback(
    async (newLevel: number, opts?: { incrementSessions?: boolean }) => {
      setLevel(newLevel);
      if (!user) return;
      await saveProgress(user.id, gameId, newLevel, opts);
    },
    [user, gameId]
  );

  return { level, setLevel, save, loaded };
}
