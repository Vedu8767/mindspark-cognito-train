import { supabase } from '@/integrations/supabase/client';
import { toCanonicalKey, aliasesFor } from './canonicalKeys';

/**
 * User-scoped persistence for bandit state.
 *
 * Rules enforced here:
 *  - The backend row is authoritative; localStorage is only a per-user cache.
 *  - Binding is deterministic: nothing is persisted until the user's stored state
 *    has been loaded, so a fast first game can never overwrite learned state.
 *  - A stale async load (older bind sequence) can never overwrite newer state.
 *  - Legacy `bandit_name` variants are read and migrated to canonical game ids;
 *    old rows are never deleted, and the richest (most pulls) row wins.
 */

let currentUserId: string | null = null;
let bindSeq = 0;
let ready = false;
const stateCache = new Map<string, unknown>();
/** Saves attempted before the backend load finished, flushed once ready. */
const pendingSaves = new Map<string, unknown>();

export function setCurrentUserId(id: string | null) {
  currentUserId = id;
}

export function getCurrentUserId(): string | null {
  return currentUserId;
}

export function isBanditStorageReady(): boolean {
  return ready;
}

/** localStorage key namespaced by user + canonical bandit key. */
export function scopedKey(name: string): string {
  const uid = currentUserId ?? 'guest';
  return `bandit:${uid}:${toCanonicalKey(name)}`;
}

function notifyBanditStateChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('bandit-state-changed'));
  }
}

function pullsOf(state: unknown): number {
  const v = (state as { totalPulls?: unknown })?.totalPulls;
  return typeof v === 'number' ? v : 0;
}

async function persistState(userId: string, name: string, state: unknown) {
  const canonical = toCanonicalKey(name);
  const { error } = await supabase
    .from('user_bandit_states')
    .upsert(
      { user_id: userId, bandit_name: canonical, state: state as any },
      { onConflict: 'user_id,bandit_name' }
    );

  if (error) {
    console.warn(`[Bandit] Failed to persist ${canonical}:`, error.message);
  }
}

export function saveBanditState(name: string, state: unknown): void {
  if (!currentUserId) {
    notifyBanditStateChanged();
    return;
  }

  const canonical = toCanonicalKey(name);

  // Guard: never let a reset/empty state clobber richer learned state.
  const known = stateCache.get(canonical);
  if (known && pullsOf(state) < pullsOf(known)) {
    console.warn(`[Bandit] Ignoring lower-pull write for ${canonical}`);
    return;
  }

  if (!ready) {
    // Backend state has not arrived yet — buffer and reconcile after load.
    pendingSaves.set(canonical, state);
    return;
  }

  stateCache.set(canonical, state);

  try {
    localStorage.setItem(scopedKey(canonical), JSON.stringify(state));
  } catch (e) {
    console.warn(`[Bandit] Failed to cache ${canonical}:`, e);
  }

  void persistState(currentUserId, canonical, state);

  notifyBanditStateChanged();
}

export function loadBanditState<T = any>(name: string): T | null {
  if (!currentUserId) return null;
  const canonical = toCanonicalKey(name);

  if (stateCache.has(canonical)) {
    return stateCache.get(canonical) as T;
  }

  try {
    const saved = localStorage.getItem(scopedKey(canonical));
    if (!saved) return null;

    const parsed = JSON.parse(saved) as T;
    stateCache.set(canonical, parsed);
    return parsed;
  } catch (e) {
    console.warn(`[Bandit] Failed to load ${canonical}:`, e);
    return null;
  }
}

export function removeBanditState(name: string): void {
  const canonical = toCanonicalKey(name);
  stateCache.delete(canonical);

  if (!currentUserId) {
    notifyBanditStateChanged();
    return;
  }

  try {
    localStorage.removeItem(scopedKey(canonical));
  } catch (e) {
    console.warn(`[Bandit] Failed to clear ${canonical}:`, e);
  }

  const userId = currentUserId;
  void supabase
    .from('user_bandit_states')
    .delete()
    .eq('user_id', userId)
    .eq('bandit_name', canonical)
    .then(({ error }) => {
      if (error) console.warn(`[Bandit] Failed to remove ${canonical}:`, error.message);
    });

  notifyBanditStateChanged();
}

// Registry of bandit instances so we can rebind/reset them all on auth changes.
type BanditLike = { reload?: () => void; reset?: () => void };
const registry: BanditLike[] = [];

export function registerBandit(b: BanditLike) {
  registry.push(b);
}

function reloadAll() {
  for (const b of registry) {
    try { b.reload?.(); } catch (e) { console.warn('[Bandit] reload failed', e); }
  }
}

function resetAllInMemory() {
  for (const b of registry) {
    try { b.reset?.(); } catch (e) { console.warn('[Bandit] reset failed', e); }
  }
}

/**
 * Called on login. Clears in-memory state, then loads the user's persisted state
 * before any save is allowed through (`ready` gate + bind sequence guard).
 */
export function bindBanditsToUser(userId: string): Promise<void> {
  const seq = ++bindSeq;

  // Block persistence and clear the previous account's values first.
  ready = false;
  currentUserId = null;
  stateCache.clear();
  pendingSaves.clear();
  resetAllInMemory();

  currentUserId = userId;
  notifyBanditStateChanged();

  return supabase
    .from('user_bandit_states')
    .select('bandit_name,state')
    .eq('user_id', userId)
    .then(({ data, error }) => {
      // Stale response from an earlier bind: discard.
      if (seq !== bindSeq || currentUserId !== userId) return;

      if (error) {
        console.warn('[Bandit] Failed to load backend states:', error.message);
        // Fall back to the user-scoped browser cache so we do not start blank.
        ready = true;
        reloadAll();
        notifyBanditStateChanged();
        return;
      }

      // Coalesce canonical + legacy rows, keeping the richest (most pulls).
      const byCanonical = new Map<string, unknown>();
      for (const row of data ?? []) {
        const canonical = toCanonicalKey(row.bandit_name);
        const existing = byCanonical.get(canonical);
        if (!existing || pullsOf(row.state) > pullsOf(existing)) {
          byCanonical.set(canonical, row.state);
        }
      }

      stateCache.clear();
      for (const [canonical, state] of byCanonical) {
        stateCache.set(canonical, state);
        try {
          localStorage.setItem(scopedKey(canonical), JSON.stringify(state));
        } catch (e) {
          console.warn(`[Bandit] Failed to cache backend state for ${canonical}:`, e);
        }
      }

      ready = true;
      reloadAll();

      // Migrate legacy rows onto canonical keys (legacy rows are left untouched).
      const legacyNames = new Set((data ?? []).map((r) => r.bandit_name));
      for (const [canonical, state] of byCanonical) {
        const hasCanonicalRow = legacyNames.has(canonical);
        const hadLegacy = aliasesFor(canonical).some((a) => a !== canonical && legacyNames.has(a));
        if (!hasCanonicalRow && hadLegacy) {
          void persistState(userId, canonical, state);
        }
      }

      // Flush buffered saves that are still richer than what we loaded.
      for (const [canonical, state] of pendingSaves) {
        const loaded = stateCache.get(canonical);
        if (!loaded || pullsOf(state) >= pullsOf(loaded)) {
          stateCache.set(canonical, state);
          void persistState(userId, canonical, state);
        }
      }
      pendingSaves.clear();

      notifyBanditStateChanged();
    }) as unknown as Promise<void>;
}

/** Called on logout: clear in-memory bandit state (does not delete stored data). */
export function unbindBandits() {
  bindSeq++;
  ready = false;
  currentUserId = null;
  stateCache.clear();
  pendingSaves.clear();
  resetAllInMemory();
  notifyBanditStateChanged();
}
