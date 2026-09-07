/**
 * Shared epsilon-greedy policy helpers used by all 12 game bandits.
 *
 * Design goals (see repair spec):
 *  - One place that defines when the policy is allowed to call itself "learned".
 *  - Honest separation between cold-start heuristics and learned exploitation.
 *  - Bounded, adjacent-only level progression derived from observed rewards.
 */

/** Bumped whenever the selection/reward semantics change. Persisted with decisions. */
export const POLICY_VERSION = 'epsilon-greedy-v2';

/** Minimum pulls on a single arm before its estimate is trusted for exploitation. */
export const MIN_OBSERVATIONS_PER_ARM = 3;

/** Minimum total observations on a bandit before we stop calling it cold-start. */
export const MIN_OBSERVATIONS_FOR_LEARNED_POLICY = 10;

/** Minimum observations at a level before its mean reward can drive progression. */
export const MIN_OBSERVATIONS_PER_LEVEL = 2;

/** How a concrete action was picked. Surfaced to the UI so nothing is overstated. */
export type SelectionMode = 'cold_start' | 'explore' | 'exploit';

/** Reward scales still present in the legacy bandit code. */
export type RewardScale = 'unit' | 'centered100' | 'percent100';

/** Convert any legacy reward scale into a bounded 0..1 value. */
export function toUnitReward(reward: number, scale: RewardScale = 'unit'): number {
  let v: number;
  switch (scale) {
    case 'centered100':
      v = (reward + 100) / 200;
      break;
    case 'percent100':
      v = reward / 100;
      break;
    default:
      v = reward;
  }
  return Math.max(0, Math.min(1, v));
}

export interface LevelStat {
  pulls: number;
  totalReward: number; // stored in unit (0..1) scale
}

/** Per-level outcome memory: the learned signal used for progression decisions. */
export type LevelStats = Record<number, LevelStat>;

export function recordLevelOutcome(
  stats: LevelStats,
  level: number,
  reward: number,
  scale: RewardScale = 'unit'
): LevelStats {
  const unit = toUnitReward(reward, scale);
  const prev = stats[level] ?? { pulls: 0, totalReward: 0 };
  stats[level] = { pulls: prev.pulls + 1, totalReward: prev.totalReward + unit };
  return stats;
}

export function levelMean(stats: LevelStats, level: number): number | null {
  const s = stats[level];
  if (!s || s.pulls < MIN_OBSERVATIONS_PER_LEVEL) return null;
  return s.totalReward / s.pulls;
}

export function totalLevelObservations(stats: LevelStats): number {
  return Object.values(stats ?? {}).reduce((sum, s) => sum + (s?.pulls ?? 0), 0);
}

export interface LevelDecision {
  level: number;
  direction: 'easier' | 'same' | 'harder';
  /** 'learned' = ranked from observed per-level rewards. 'cold_start' = documented heuristic. */
  mode: 'learned' | 'cold_start';
  observations: number;
  policyVersion: string;
}

/**
 * Adjacent-only (+1 / 0 / -1) level suggestion.
 *
 * Learned path: rank the mean unit reward observed at level-1, level and level+1,
 * using only levels with enough observations; pick the best-performing candidate.
 * Cold-start path: an explicitly labelled threshold heuristic on the most recent
 * unit reward. It is never reported as a learned decision.
 */
export function decideNextLevel(opts: {
  stats: LevelStats;
  currentLevel: number;
  recentUnitReward?: number | null;
  maxLevel?: number;
}): LevelDecision {
  const { stats, currentLevel } = opts;
  const maxLevel = opts.maxLevel ?? 25;
  const clamp = (l: number) => Math.max(1, Math.min(maxLevel, l));
  const observations = totalLevelObservations(stats);

  if (observations >= MIN_OBSERVATIONS_FOR_LEARNED_POLICY) {
    const candidates = [currentLevel - 1, currentLevel, currentLevel + 1]
      .map(clamp)
      .filter((l, i, arr) => arr.indexOf(l) === i)
      .map((l) => ({ level: l, mean: levelMean(stats, l) }))
      .filter((c): c is { level: number; mean: number } => c.mean !== null);

    if (candidates.length > 0) {
      const best = candidates.reduce((a, b) => (b.mean > a.mean ? b : a));
      const currentMean = levelMean(stats, clamp(currentLevel));
      // Unexplored harder level with a strong current level => try one step up.
      let level = best.level;
      if (currentMean !== null && currentMean >= 0.7 && best.level === currentLevel) {
        level = clamp(currentLevel + 1);
      }
      return {
        level,
        direction: level > currentLevel ? 'harder' : level < currentLevel ? 'easier' : 'same',
        mode: 'learned',
        observations,
        policyVersion: POLICY_VERSION,
      };
    }
  }

  // Cold-start heuristic (explicitly not a learned decision).
  const r = opts.recentUnitReward ?? levelMean(stats, currentLevel);
  let level = currentLevel;
  if (r !== null && r !== undefined) {
    if (r >= 0.65) level = clamp(currentLevel + 1);
    else if (r < 0.35) level = clamp(currentLevel - 1);
  }
  return {
    level,
    direction: level > currentLevel ? 'harder' : level < currentLevel ? 'easier' : 'same',
    mode: 'cold_start',
    observations,
    policyVersion: POLICY_VERSION,
  };
}

export interface TrainingStatus {
  trained: boolean;
  observations: number;
  label: string;
}

/** Honest training label for the UI. */
export function trainingStatus(totalPulls: number): TrainingStatus {
  const trained = totalPulls >= MIN_OBSERVATIONS_FOR_LEARNED_POLICY;
  return {
    trained,
    observations: totalPulls,
    label: trained
      ? `Trained — ${totalPulls} observations`
      : `Learning — ${totalPulls}/${MIN_OBSERVATIONS_FOR_LEARNED_POLICY} observations`,
  };
}

/** Pick an arm estimate only when it has enough pulls; otherwise null. */
export function trustedArmMean(arm: { pulls: number; averageReward: number } | undefined): number | null {
  if (!arm || arm.pulls < MIN_OBSERVATIONS_PER_ARM) return null;
  return arm.averageReward;
}
