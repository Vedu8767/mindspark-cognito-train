/**
 * Canonical bandit storage keys.
 *
 * Historically each bandit invented its own `bandit_name` (class-style names like
 * `attentionBandit` and snake-case names like `hanoi_bandit_state`). Storage now
 * normalises every read/write to the canonical game id, while still recognising the
 * legacy aliases so previously learned state is preserved (never deleted).
 */

export const CANONICAL_BANDIT_KEYS = [
  'memory-matching',
  'attention-focus',
  'reaction-speed',
  'pattern-recognition',
  'word-memory',
  'math-challenge',
  'visual-processing',
  'executive-function',
  'spatial-navigation',
  'processing-speed',
  'audio-memory',
  'tower-of-hanoi',
] as const;

export type CanonicalBanditKey = (typeof CANONICAL_BANDIT_KEYS)[number];

/** canonical key -> legacy bandit_name values that may exist in the database. */
export const LEGACY_ALIASES: Record<CanonicalBanditKey, string[]> = {
  'memory-matching': ['epsilonGreedyBandit', 'memoryGameBandit'],
  'attention-focus': ['attentionBandit'],
  'reaction-speed': ['reactionBandit'],
  'pattern-recognition': ['pattern_bandit_state', 'patternBandit'],
  'word-memory': ['wordMemoryBandit'],
  'math-challenge': ['mathChallengeBandit'],
  'visual-processing': ['visual_processing_bandit_state', 'visualProcessingBandit'],
  'executive-function': ['executive_function_bandit_state', 'executiveFunctionBandit'],
  'spatial-navigation': ['spatialBandit'],
  'processing-speed': ['processingSpeedBandit'],
  'audio-memory': ['audio_bandit_state', 'audioMemoryBandit'],
  'tower-of-hanoi': ['hanoi_bandit_state', 'towerOfHanoiBandit'],
};

const ALIAS_TO_CANONICAL: Record<string, CanonicalBanditKey> = (() => {
  const map: Record<string, CanonicalBanditKey> = {};
  for (const canonical of CANONICAL_BANDIT_KEYS) {
    map[canonical] = canonical;
    for (const alias of LEGACY_ALIASES[canonical]) map[alias] = canonical;
  }
  return map;
})();

/** Normalise any legacy or canonical name to the canonical game id. */
export function toCanonicalKey(name: string): string {
  return ALIAS_TO_CANONICAL[name] ?? name;
}

/** All names (canonical + legacy) that may hold state for a given name. */
export function aliasesFor(name: string): string[] {
  const canonical = toCanonicalKey(name);
  const legacy = LEGACY_ALIASES[canonical as CanonicalBanditKey] ?? [];
  return [canonical, ...legacy];
}
