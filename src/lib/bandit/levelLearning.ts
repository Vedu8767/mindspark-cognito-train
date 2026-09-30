/**
 * Shared level-progression learning for all 12 game bandits.
 *
 * Each bandit keeps its own epsilon-greedy arm selection (which variation of a
 * level to play). This module adds the missing learned signal for *which level*
 * to suggest next: every updateModel call records the bounded reward observed at
 * the level actually played, and next-level suggestions come from
 * `decideNextLevel` — ranked from observed per-level rewards once enough data
 * exists, otherwise an explicitly labelled cold-start heuristic.
 *
 * Level stats persist per user under `<canonical-key>:levels` in user_bandit_states.
 */
import {
  decideNextLevel,
  recordLevelOutcome,
  toUnitReward,
  totalLevelObservations,
  trainingStatus,
  type LevelDecision,
  type LevelStats,
  type TrainingStatus,
} from './policy';
import { loadBanditState, registerBandit, saveBanditState } from './storage';
import { memoryGameBandit } from './epsilonGreedy';
import { attentionBandit } from './attentionBandit';
import { reactionBandit } from './reactionBandit';
import { patternRecognitionBandit } from './patternBandit';
import { wordMemoryBandit } from './wordMemoryBandit';
import { mathChallengeBandit } from './mathChallengeBandit';
import { visualProcessingBandit } from './visualProcessingBandit';
import { executiveFunctionBandit } from './executiveFunctionBandit';
import { spatialBandit } from './spatialBandit';
import { processingSpeedBandit } from './processingSpeedBandit';
import { audioMemoryBandit } from './audioMemoryBandit';
import { towerOfHanoiBandit } from './towerOfHanoiBandit';

type Direction = 'easier' | 'same' | 'harder';

interface LevelState {
  stats: LevelStats;
  totalPulls: number;
  lastLevel: number;
  lastUnitReward: number | null;
}

// Loosely typed view of the heterogeneous legacy bandit classes.
type AnyFn = (...args: unknown[]) => unknown;
type PatchableBandit = Record<string, unknown> & {
  updateModel: AnyFn;
  getStats: () => Record<string, unknown>;
};

const learners = new Map<string, LevelLearner>();

class LevelLearner {
  state: LevelState = { stats: {}, totalPulls: 0, lastLevel: 1, lastUnitReward: null };
  constructor(public readonly key: string) {}

  private get storageName() {
    return `${this.key}:levels`;
  }

  load() {
    const saved = loadBanditState<LevelState>(this.storageName);
    this.state = saved
      ? { stats: saved.stats ?? {}, totalPulls: saved.totalPulls ?? 0, lastLevel: saved.lastLevel ?? 1, lastUnitReward: saved.lastUnitReward ?? null }
      : { stats: {}, totalPulls: 0, lastLevel: 1, lastUnitReward: null };
  }

  reset() {
    this.state = { stats: {}, totalPulls: 0, lastLevel: 1, lastUnitReward: null };
  }

  record(level: number, rawReward: number) {
    // Legacy bandits use either 0..1 or -100..100 reward scales.
    const unit = Math.abs(rawReward) > 1 ? toUnitReward(rawReward, 'centered100') : toUnitReward(rawReward, 'unit');
    recordLevelOutcome(this.state.stats, level, unit, 'unit');
    this.state.totalPulls = totalLevelObservations(this.state.stats);
    this.state.lastLevel = level;
    this.state.lastUnitReward = unit;
    saveBanditState(this.storageName, this.state);
  }

  decide(currentLevel?: number): LevelDecision {
    return decideNextLevel({
      stats: this.state.stats,
      currentLevel: currentLevel ?? this.state.lastLevel,
      recentUnitReward: this.state.lastUnitReward,
    });
  }

  status(): TrainingStatus {
    return trainingStatus(this.state.totalPulls);
  }
}

function levelFrom(arg: unknown): number | undefined {
  const l = (arg as { currentLevel?: unknown } | undefined)?.currentLevel;
  return typeof l === 'number' && l >= 1 ? l : undefined;
}

function attach(key: string, bandit: object) {
  const b = bandit as PatchableBandit;
  const learner = new LevelLearner(key);
  learners.set(key, learner);
  learner.load();
  registerBandit({ reload: () => learner.load(), reset: () => learner.reset() });

  const origUpdate = b.updateModel.bind(b);
  b.updateModel = (...args: unknown[]) => {
    const result = origUpdate(...args);
    const [context, , reward] = args;
    const level = levelFrom(context) ?? learner.state.lastLevel;
    if (typeof reward === 'number' && Number.isFinite(reward)) learner.record(level, reward);
    return result;
  };

  if (typeof b.getOptimalLevel === 'function') {
    b.getOptimalLevel = (context?: unknown) => learner.decide(levelFrom(context)).level;
  }
  for (const name of ['predictNextLevelDifficulty', 'predictNextDifficulty']) {
    if (typeof b[name] === 'function') {
      b[name] = (arg?: unknown): Direction => learner.decide(levelFrom(arg)).direction;
    }
  }

  const origStats = b.getStats.bind(b);
  b.getStats = () => {
    const base = origStats();
    const st = learner.status();
    return { ...base, levelObservations: st.observations, trained: st.trained, trainingLabel: st.label, policyMode: learner.decide().mode };
  };
}

attach('memory-matching', memoryGameBandit);
attach('attention-focus', attentionBandit);
attach('reaction-speed', reactionBandit);
attach('pattern-recognition', patternRecognitionBandit);
attach('word-memory', wordMemoryBandit);
attach('math-challenge', mathChallengeBandit);
attach('visual-processing', visualProcessingBandit);
attach('executive-function', executiveFunctionBandit);
attach('spatial-navigation', spatialBandit);
attach('processing-speed', processingSpeedBandit);
attach('audio-memory', audioMemoryBandit);
attach('tower-of-hanoi', towerOfHanoiBandit);

/** Latest learned/cold-start level decision for a game (for UI/auditing). */
export function getLevelDecision(gameId: string, currentLevel?: number): LevelDecision | null {
  return learners.get(gameId)?.decide(currentLevel) ?? null;
}

export function getLevelTrainingStatus(gameId: string): TrainingStatus | null {
  return learners.get(gameId)?.status() ?? null;
}
