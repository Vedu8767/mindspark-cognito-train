// Epsilon-Greedy Contextual Bandit for Adaptive Game Difficulty
// This module implements a reinforcement learning approach to personalize game difficulty

export * from './types';
export * from './actionSpace';
export * from './featureExtractor';
export { EpsilonGreedyBandit, memoryGameBandit } from './epsilonGreedy';

// Re-export main types with aliases for backward compatibility
export type { UserContext as Context, GameAction as GameConfig } from './types';
