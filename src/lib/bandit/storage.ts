import { supabase } from '@/integrations/supabase/client';

// User-scoped persistence for bandit state.
// The backend is the source of truth; localStorage is only a user-scoped cache.

let currentUserId: string | null = null;
const stateCache = new Map<string, unknown>();

export function setCurrentUserId(id: string | null) {
  currentUserId = id;
}

export function getCurrentUserId(): string | null {
  return currentUserId;
}

/**
 * Returns a localStorage key namespaced by the current user.
 * If no user is signed in yet, falls back to a "guest" namespace so we don't
 * pollute another user's state.
 */
export function scopedKey(name: string): string {
  const uid = currentUserId ?? 'guest';
  return `bandit:${uid}:${name}`;
}

function notifyBanditStateChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('bandit-state-changed'));
  }
}

async function persistState(userId: string, name: string, state: unknown) {
  const { error } = await supabase
    .from('user_bandit_states')
    .upsert(
      { user_id: userId, bandit_name: name, state: state as any },
      { onConflict: 'user_id,bandit_name' }
    );

  if (error) {
    console.warn(`[Bandit] Failed to persist ${name}:`, error.message);
  }
}

export function saveBanditState(name: string, state: unknown): void {
  stateCache.set(name, state);

  try {
    localStorage.setItem(scopedKey(name), JSON.stringify(state));
  } catch (e) {
    console.warn(`[Bandit] Failed to cache ${name}:`, e);
  }

  if (currentUserId) {
    void persistState(currentUserId, name, state);
  }

  notifyBanditStateChanged();
}

export function loadBanditState<T = any>(name: string): T | null {
  if (stateCache.has(name)) {
    return stateCache.get(name) as T;
  }

  try {
    const saved = localStorage.getItem(scopedKey(name));
    if (!saved) return null;

    const parsed = JSON.parse(saved) as T;
    stateCache.set(name, parsed);

    // Migrate existing user-scoped browser cache into the backend.
    if (currentUserId) {
      void persistState(currentUserId, name, parsed);
    }

    return parsed;
  } catch (e) {
    console.warn(`[Bandit] Failed to load ${name}:`, e);
    return null;
  }
}

export function removeBanditState(name: string): void {
  stateCache.delete(name);

  try {
    localStorage.removeItem(scopedKey(name));
  } catch (e) {
    console.warn(`[Bandit] Failed to clear ${name}:`, e);
  }

  if (currentUserId) {
    const userId = currentUserId;
    void supabase
      .from('user_bandit_states')
      .delete()
      .eq('user_id', userId)
      .eq('bandit_name', name)
      .then(({ error }) => {
        if (error) console.warn(`[Bandit] Failed to remove ${name}:`, error.message);
      });
  }

  notifyBanditStateChanged();
}

// Registry of bandit instances so we can rebind/reset them all on auth changes.
type BanditLike = { reload?: () => void; reset?: () => void };
const registry: BanditLike[] = [];

export function registerBandit(b: BanditLike) {
  registry.push(b);
}

/** Called on login: switch all bandits to the new user's stored state. */
export function bindBanditsToUser(userId: string) {
  // Clear in-memory values before switching accounts so AI Lab never renders
  // the previous user's stats while the new user's backend state is loading.
  currentUserId = null;
  stateCache.clear();
  for (const b of registry) {
    try { b.reset?.(); } catch (e) { console.warn('[Bandit] pre-bind reset failed', e); }
  }

  currentUserId = userId;

  // Immediately re-read the user-scoped cache so the previous account's in-memory
  // stats are cleared before the backend request returns.
  for (const b of registry) {
    try { b.reload?.(); } catch (e) { console.warn('[Bandit] reload failed', e); }
  }
  notifyBanditStateChanged();

  void supabase
    .from('user_bandit_states')
    .select('bandit_name,state')
    .eq('user_id', userId)
    .then(({ data, error }) => {
      if (currentUserId !== userId) return;

      if (error) {
        console.warn('[Bandit] Failed to load backend states:', error.message);
        return;
      }

      stateCache.clear();
      for (const row of data ?? []) {
        stateCache.set(row.bandit_name, row.state);
        try {
          localStorage.setItem(scopedKey(row.bandit_name), JSON.stringify(row.state));
        } catch (e) {
          console.warn(`[Bandit] Failed to cache backend state for ${row.bandit_name}:`, e);
        }
      }

      for (const b of registry) {
        try { b.reload?.(); } catch (e) { console.warn('[Bandit] backend reload failed', e); }
      }
      notifyBanditStateChanged();
    });
}

/** Called on logout: clear in-memory bandit state (does not delete other users' data). */
export function unbindBandits() {
  currentUserId = null;
  stateCache.clear();
  for (const b of registry) {
    try { b.reset?.(); } catch (e) { console.warn('[Bandit] unbind reset failed', e); }
  }
  notifyBanditStateChanged();
}