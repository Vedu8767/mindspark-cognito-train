// Epsilon-Greedy Contextual Bandit for Adaptive Game Difficulty
// This module implements a reinforcement learning approach to personalize game difficulty

export * from './types';
export * from './actionSpace';
export * from './featureExtractor';
export { EpsilonGreedyBandit, memoryGameBandit } from './epsilonGreedy';
export { AttentionBandit, attentionBandit, type AttentionContext, type AttentionAction } from './attentionBandit';
export { ReactionBandit, reactionBandit, type ReactionContext, type ReactionAction } from './reactionBandit';

// Re-export main types with aliases for backward compatibility
export type { UserContext as Context, GameAction as GameConfig } from './types';
