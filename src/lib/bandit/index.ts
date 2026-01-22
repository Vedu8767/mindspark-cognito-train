// Epsilon-Greedy Contextual Bandit for Adaptive Game Difficulty
// This module implements a reinforcement learning approach to personalize game difficulty

export * from './types';
export * from './patternBandit';
export * from './actionSpace';
export * from './featureExtractor';
export { EpsilonGreedyBandit, memoryGameBandit } from './epsilonGreedy';
export { AttentionBandit, attentionBandit, type AttentionContext, type AttentionAction } from './attentionBandit';
export { ReactionBandit, reactionBandit, type ReactionContext, type ReactionAction } from './reactionBandit';
export { WordMemoryBandit, wordMemoryBandit, type WordMemoryContext, type WordMemoryAction } from './wordMemoryBandit';
export { MathChallengeBandit, mathChallengeBandit, type MathContext, type MathAction } from './mathChallengeBandit';
export { VisualProcessingBandit, visualProcessingBandit, type VisualContext, type VisualAction } from './visualProcessingBandit';
export { ExecutiveFunctionBandit, executiveFunctionBandit, type ExecutiveContext, type ExecutiveAction } from './executiveFunctionBandit';
export { SpatialBandit, spatialBandit, type SpatialContext, type SpatialAction } from './spatialBandit';
export { ProcessingSpeedBandit, processingSpeedBandit, type ProcessingContext, type ProcessingAction } from './processingSpeedBandit';
export { towerOfHanoiBandit, type HanoiContext, type HanoiAction } from './towerOfHanoiBandit';
export { audioMemoryBandit, type AudioContext as AudioBanditContext, type AudioAction } from './audioMemoryBandit';

// Re-export main types with aliases for backward compatibility
export type { UserContext as Context, GameAction as GameConfig } from './types';
