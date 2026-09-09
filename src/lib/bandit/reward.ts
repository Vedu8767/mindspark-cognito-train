/**
 * Bounded (0..1) reward functions for all 12 games.
 *
 * Raw game scores are NOT comparable across games (audio-memory averages ~6 while
 * spatial-navigation averages ~1000), so rewards are built exclusively from
 * normalised telemetry: accuracy, completion, time/move efficiency and speed.
 * Every reward returned here is clamped to 0..1 and returns its components so the
 * decision can be audited later.
 */

const clamp01 = (v: number) => (Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0);

export interface RewardTelemetry {
  /** Did the player finish the level/session rather than abandoning or timing out. */
  completed: boolean;
  /** 0..1 share of correct responses. */
  accuracy?: number;
  /** 0..1 — 1 means finished well inside the allowed time. */
  timeEfficiency?: number;
  /** 0..1 — 1 means optimal move count (optimalMoves / actualMoves). */
  moveEfficiency?: number;
  /** 0..1 — 1 means very fast responses. */
  speed?: number;
  /** 0..1 — sustained attention / combo quality where the game tracks it. */
  consistency?: number;
  /** 0..1 — inferred frustration; subtracted from the reward. */
  frustration?: number;
}

export interface RewardResult {
  /** Bounded 0..1 reward. This exact value is what updateModel and the session record use. */
  reward: number;
  components: Record<string, number>;
  formula: string;
  version: string;
}

export const REWARD_VERSION = 'reward-v2';

type Weights = Record<string, number>;

/**
 * Per-game weighting of the available telemetry. Weights sum to 1 before the
 * frustration penalty (max 0.15) is applied.
 */
const GAME_WEIGHTS: Record<string, Weights> = {
  // Memory games: accuracy dominates, completion matters, speed is secondary.
  'memory-matching': { accuracy: 0.4, completed: 0.2, moveEfficiency: 0.25, timeEfficiency: 0.15 },
  'word-memory': { accuracy: 0.55, completed: 0.25, timeEfficiency: 0.2 },
  'audio-memory': { accuracy: 0.55, completed: 0.25, consistency: 0.2 },
  'spatial-navigation': { accuracy: 0.35, completed: 0.25, moveEfficiency: 0.25, timeEfficiency: 0.15 },
  // Attention: hit quality plus sustained consistency.
  'attention-focus': { accuracy: 0.45, completed: 0.2, consistency: 0.2, speed: 0.15 },
  // Speed games: reaction speed is the point, but accuracy guards against mashing.
  'reaction-speed': { speed: 0.5, accuracy: 0.3, completed: 0.2 },
  'processing-speed': { speed: 0.4, accuracy: 0.35, completed: 0.25 },
  'visual-processing': { accuracy: 0.45, speed: 0.3, completed: 0.25 },
  // Executive games: correctness and efficiency.
  'pattern-recognition': { accuracy: 0.55, completed: 0.25, timeEfficiency: 0.2 },
  'math-challenge': { accuracy: 0.5, completed: 0.2, speed: 0.3 },
  'executive-function': { accuracy: 0.45, completed: 0.25, speed: 0.3 },
  'tower-of-hanoi': { moveEfficiency: 0.45, completed: 0.3, timeEfficiency: 0.25 },
};

const DEFAULT_WEIGHTS: Weights = { accuracy: 0.5, completed: 0.3, timeEfficiency: 0.2 };

function metricValue(t: RewardTelemetry, key: string): number | undefined {
  if (key === 'completed') return t.completed ? 1 : 0;
  const v = (t as unknown as Record<string, unknown>)[key];
  return typeof v === 'number' && Number.isFinite(v) ? clamp01(v) : undefined;
}

/**
 * Compute the bounded reward for a game session.
 * Missing telemetry is not invented: its weight is redistributed across the
 * metrics the game actually reported (completion is always available).
 */
export function computeReward(gameId: string, telemetry: RewardTelemetry): RewardResult {
  const weights = GAME_WEIGHTS[gameId] ?? DEFAULT_WEIGHTS;

  const available: Array<[string, number, number]> = [];
  let weightSum = 0;
  for (const [key, weight] of Object.entries(weights)) {
    const value = metricValue(telemetry, key);
    if (value === undefined) continue;
    available.push([key, value, weight]);
    weightSum += weight;
  }

  const components: Record<string, number> = {};
  let reward = 0;
  if (weightSum > 0) {
    for (const [key, value, weight] of available) {
      const contribution = (weight / weightSum) * value;
      components[key] = Number(contribution.toFixed(4));
      reward += contribution;
    }
  } else {
    reward = telemetry.completed ? 0.5 : 0;
    components.completed = reward;
  }

  const frustrationPenalty = clamp01(telemetry.frustration ?? 0) * 0.15;
  if (frustrationPenalty > 0) components.frustrationPenalty = -Number(frustrationPenalty.toFixed(4));

  return {
    reward: clamp01(reward - frustrationPenalty),
    components,
    formula: available.map(([k, , w]) => `${k}*${(w / (weightSum || 1)).toFixed(2)}`).join(' + ') || 'completed',
    version: REWARD_VERSION,
  };
}

/** Helper: time efficiency from elapsed vs allowed seconds. */
export function timeEfficiency(elapsedSeconds: number, allowedSeconds: number): number {
  if (!allowedSeconds || allowedSeconds <= 0) return 0.5;
  return clamp01(1 - elapsedSeconds / allowedSeconds);
}

/** Helper: speed score from an average reaction time in ms (300ms ≈ 1, 1500ms ≈ 0). */
export function speedFromReactionTime(ms: number): number {
  if (!ms || ms <= 0) return 0.5;
  return clamp01((1500 - ms) / 1200);
}

/** Helper: move efficiency from optimal vs actual moves. */
export function moveEfficiency(optimalMoves: number, actualMoves: number): number {
  if (!actualMoves || actualMoves <= 0) return 0;
  return clamp01(optimalMoves / actualMoves);
}
