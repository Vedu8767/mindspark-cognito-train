// User-scoped storage for bandit state.
// All 12 bandits use scopedKey() so per-user data never bleeds across accounts.

let currentUserId: string | null = null;

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

// Registry of bandit instances so we can rebind/reset them all on auth changes.
type BanditLike = { reload?: () => void; reset?: () => void };
const registry: BanditLike[] = [];

export function registerBandit(b: BanditLike) {
  registry.push(b);
}

/** Called on login: switch all bandits to the new user's stored state. */
export function bindBanditsToUser(userId: string) {
  currentUserId = userId;
  for (const b of registry) {
    try { b.reload?.(); } catch (e) { console.warn('[Bandit] reload failed', e); }
  }
}

/** Called on logout: clear in-memory bandit state (does not delete other users' data). */
export function unbindBandits() {
  currentUserId = null;
  for (const b of registry) {
    try { b.reload?.(); } catch (e) { console.warn('[Bandit] unbind reload failed', e); }
  }
}