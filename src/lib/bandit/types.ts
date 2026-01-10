// Epsilon-Greedy Contextual Bandit Types

export interface UserContext {
  currentLevel: number;
  recentAccuracy: number;
  recentSpeed: number;
  sessionLength: number;
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  previousDifficulty: number;
  streakCount: number;
  userType: 'speed_focused' | 'accuracy_focused' | 'balanced';
  // Extended context features
  avgMoveTime: number;
  frustrationLevel: number;
  engagementLevel: number;
  preferredGridSize: number;
  successRate: number;
  dayOfWeek: number;
}

export interface GameAction {
  gridSize: number;
  timeLimit: number;
  symbolCount: number;
  flipDuration: number;
  previewTime: number;
  difficultyMultiplier: number;
  hintEnabled: boolean;
  adaptiveTimer: boolean;
}

export interface ArmStatistics {
  actionKey: string;
  pulls: number;
  totalReward: number;
  averageReward: number;
  lastPulled: number;
  contextWeights: number[];
  ucbScore: number;
}

export interface PerformanceMetrics {
  completed: boolean;
  accuracy: number;
  timeEfficiency: number;
  engagement: number;
  frustration: number;
  optimalMoves: number;
  actualMoves: number;
  avgReactionTime: number;
}

export interface RewardSignal {
  action: GameAction;
  reward: number;
  context: UserContext;
  metrics: PerformanceMetrics;
  timestamp: number;
}

export interface BanditState {
  arms: Map<string, ArmStatistics>;
  epsilon: number;
  totalPulls: number;
  history: RewardSignal[];
  userProfile: UserProfile;
}

export interface UserProfile {
  preferredDifficulty: number;
  optimalGridSize: number;
  bestTimeOfDay: 'morning' | 'afternoon' | 'evening';
  learningRate: number;
  adaptationSpeed: 'fast' | 'medium' | 'slow';
  skillLevel: number;
}
