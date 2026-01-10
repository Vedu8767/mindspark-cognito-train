import { 
  UserContext, 
  GameAction, 
  ArmStatistics, 
  RewardSignal, 
  BanditState, 
  UserProfile,
  PerformanceMetrics 
} from './types';
import { generateActionSpace, getActionKey, getActionsForLevel } from './actionSpace';
import { getContextActionFeatures, getFeatureDimension } from './featureExtractor';

const STORAGE_KEY = 'epsilonGreedyBandit';
const FEATURE_DIM = getFeatureDimension();

export class EpsilonGreedyBandit {
  private actions: GameAction[];
  private arms: Map<string, ArmStatistics>;
  private epsilon: number;
  private epsilonDecay: number;
  private minEpsilon: number;
  private learningRate: number;
  private totalPulls: number;
  private history: RewardSignal[];
  private userProfile: UserProfile;
  
  constructor() {
    this.actions = generateActionSpace();
    this.arms = new Map();
    this.epsilon = 0.3; // Start with 30% exploration
    this.epsilonDecay = 0.995;
    this.minEpsilon = 0.05;
    this.learningRate = 0.1;
    this.totalPulls = 0;
    this.history = [];
    this.userProfile = this.initUserProfile();
    
    this.initializeArms();
    this.loadState();
  }
  
  private initUserProfile(): UserProfile {
    return {
      preferredDifficulty: 1.0,
      optimalGridSize: 4,
      bestTimeOfDay: 'afternoon',
      learningRate: 0.1,
      adaptationSpeed: 'medium',
      skillLevel: 0.5
    };
  }
  
  private initializeArms(): void {
    this.actions.forEach(action => {
      const key = getActionKey(action);
      if (!this.arms.has(key)) {
        this.arms.set(key, {
          actionKey: key,
          pulls: 0,
          totalReward: 0,
          averageReward: 0,
          lastPulled: 0,
          contextWeights: new Array(FEATURE_DIM).fill(0),
          ucbScore: Infinity // Ensures unexplored arms are tried
        });
      }
    });
  }
  
  // Epsilon-Greedy Action Selection
  selectAction(context: UserContext): GameAction {
    const levelActions = getActionsForLevel(this.actions, context.currentLevel);
    const candidateActions = levelActions.length > 0 ? levelActions : this.actions.slice(0, 10);
    
    // Exploration: Random action with probability epsilon
    if (Math.random() < this.epsilon) {
      console.log('[Bandit] Exploring: Selecting random action');
      return candidateActions[Math.floor(Math.random() * candidateActions.length)];
    }
    
    // Exploitation: Select best action based on predicted reward
    console.log('[Bandit] Exploiting: Selecting best predicted action');
    return this.selectBestAction(context, candidateActions);
  }
  
  private selectBestAction(context: UserContext, actions: GameAction[]): GameAction {
    let bestAction = actions[0];
    let bestScore = -Infinity;
    
    actions.forEach(action => {
      const score = this.predictReward(context, action);
      const ucbBonus = this.calculateUCBBonus(action);
      const totalScore = score + ucbBonus * 0.1; // Small UCB component for tie-breaking
      
      if (totalScore > bestScore) {
        bestScore = totalScore;
        bestAction = action;
      }
    });
    
    return bestAction;
  }
  
  // Linear prediction with context-action features
  private predictReward(context: UserContext, action: GameAction): number {
    const key = getActionKey(action);
    const arm = this.arms.get(key);
    
    if (!arm || arm.pulls === 0) {
      return this.getDefaultPrediction(context, action);
    }
    
    const features = getContextActionFeatures(context, action);
    let prediction = features.reduce((sum, f, i) => sum + f * arm.contextWeights[i], 0);
    
    // Blend with average reward (Thompson sampling inspired)
    const blendFactor = Math.min(1, arm.pulls / 10);
    prediction = prediction * blendFactor + arm.averageReward * (1 - blendFactor);
    
    return prediction;
  }
  
  // Default prediction for new actions based on context similarity
  private getDefaultPrediction(context: UserContext, action: GameAction): number {
    // Heuristic: Match action to user profile
    let score = 50;
    
    // Prefer grid sizes close to user's optimal
    const gridDiff = Math.abs(action.gridSize - this.userProfile.optimalGridSize);
    score -= gridDiff * 5;
    
    // Prefer difficulty close to skill level
    const difficultyDiff = Math.abs(action.difficultyMultiplier - this.userProfile.preferredDifficulty);
    score -= difficultyDiff * 10;
    
    // Accuracy-focused users prefer more time and hints
    if (context.userType === 'accuracy_focused') {
      if (action.hintEnabled) score += 10;
      if (action.timeLimit > 90) score += 5;
    }
    
    // Speed-focused users prefer less time and faster flips
    if (context.userType === 'speed_focused') {
      if (action.flipDuration < 800) score += 10;
      if (!action.hintEnabled) score += 5;
    }
    
    // Adaptive timer helps frustrated users
    if ((context.frustrationLevel || 0) > 0.5 && action.adaptiveTimer) {
      score += 15;
    }
    
    return score;
  }
  
  // UCB bonus for exploration
  private calculateUCBBonus(action: GameAction): number {
    const key = getActionKey(action);
    const arm = this.arms.get(key);
    
    if (!arm || arm.pulls === 0) {
      return 100; // High bonus for unexplored arms
    }
    
    return Math.sqrt(2 * Math.log(this.totalPulls + 1) / arm.pulls);
  }
  
  // Update model with observed reward
  updateModel(context: UserContext, action: GameAction, reward: number, metrics: PerformanceMetrics): void {
    const key = getActionKey(action);
    let arm = this.arms.get(key);
    
    if (!arm) {
      arm = {
        actionKey: key,
        pulls: 0,
        totalReward: 0,
        averageReward: 0,
        lastPulled: 0,
        contextWeights: new Array(FEATURE_DIM).fill(0),
        ucbScore: 0
      };
      this.arms.set(key, arm);
    }
    
    // Update arm statistics
    arm.pulls++;
    arm.totalReward += reward;
    arm.averageReward = arm.totalReward / arm.pulls;
    arm.lastPulled = Date.now();
    
    // Update context weights using gradient descent
    this.updateWeights(arm, context, action, reward);
    
    // Update total pulls
    this.totalPulls++;
    
    // Decay epsilon
    this.epsilon = Math.max(this.minEpsilon, this.epsilon * this.epsilonDecay);
    
    // Update user profile
    this.updateUserProfile(context, action, reward, metrics);
    
    // Store in history
    this.history.push({
      action,
      reward,
      context,
      metrics,
      timestamp: Date.now()
    });
    
    // Save state
    this.saveState();
    
    console.log(`[Bandit] Updated: epsilon=${this.epsilon.toFixed(3)}, arm=${key}, reward=${reward.toFixed(1)}, avgReward=${arm.averageReward.toFixed(1)}`);
  }
  
  private updateWeights(arm: ArmStatistics, context: UserContext, action: GameAction, reward: number): void {
    const features = getContextActionFeatures(context, action);
    const prediction = features.reduce((sum, f, i) => sum + f * arm.contextWeights[i], 0);
    const error = reward - prediction;
    
    // Gradient descent update
    for (let i = 0; i < arm.contextWeights.length; i++) {
      arm.contextWeights[i] += this.learningRate * error * features[i];
      // L2 regularization
      arm.contextWeights[i] *= 0.999;
    }
  }
  
  private updateUserProfile(context: UserContext, action: GameAction, reward: number, metrics: PerformanceMetrics): void {
    const alpha = 0.1; // Profile learning rate
    
    // Update skill level based on performance
    if (metrics.completed && metrics.accuracy > 0.8) {
      this.userProfile.skillLevel = Math.min(1, this.userProfile.skillLevel + alpha);
    } else if (!metrics.completed || metrics.accuracy < 0.4) {
      this.userProfile.skillLevel = Math.max(0, this.userProfile.skillLevel - alpha * 0.5);
    }
    
    // Update preferred difficulty
    if (reward > 60) {
      this.userProfile.preferredDifficulty += alpha * (action.difficultyMultiplier - this.userProfile.preferredDifficulty);
    }
    
    // Update optimal grid size
    if (metrics.completed && metrics.accuracy > 0.7) {
      this.userProfile.optimalGridSize = Math.round(
        this.userProfile.optimalGridSize * (1 - alpha) + action.gridSize * alpha
      );
    }
    
    // Track best time of day
    if (reward > 70) {
      this.userProfile.bestTimeOfDay = context.timeOfDay;
    }
    
    // Determine adaptation speed
    const recentRewards = this.history.slice(-10).map(h => h.reward);
    if (recentRewards.length >= 5) {
      const variance = this.calculateVariance(recentRewards);
      if (variance < 100) this.userProfile.adaptationSpeed = 'fast';
      else if (variance < 300) this.userProfile.adaptationSpeed = 'medium';
      else this.userProfile.adaptationSpeed = 'slow';
    }
  }
  
  private calculateVariance(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  }
  
  // Calculate comprehensive reward from performance
  calculateReward(metrics: PerformanceMetrics): number {
    const { completed, accuracy, timeEfficiency, engagement, frustration, optimalMoves, actualMoves } = metrics;
    
    let reward = 0;
    
    // Completion bonus (primary goal)
    if (completed) reward += 40;
    
    // Accuracy bonus
    reward += accuracy * 25;
    
    // Time efficiency bonus
    reward += timeEfficiency * 15;
    
    // Engagement bonus
    reward += engagement * 15;
    
    // Frustration penalty
    reward -= frustration * 30;
    
    // Move efficiency bonus
    const moveEfficiency = optimalMoves > 0 ? Math.min(1, optimalMoves / actualMoves) : 0.5;
    reward += moveEfficiency * 10;
    
    // Clamp reward
    return Math.max(-100, Math.min(100, reward));
  }
  
  // Analyze user playstyle from recent history
  analyzePlaystyle(recentGames: Array<{accuracy: number; speed: number}>): UserContext['userType'] {
    if (recentGames.length < 3) return 'balanced';
    
    const avgAccuracy = recentGames.reduce((sum, g) => sum + g.accuracy, 0) / recentGames.length;
    const avgSpeed = recentGames.reduce((sum, g) => sum + g.speed, 0) / recentGames.length;
    
    // Calculate tendency
    const accuracyTendency = avgAccuracy - 0.5;
    const speedTendency = avgSpeed - 0.5;
    
    if (speedTendency > 0.15 && accuracyTendency < -0.1) return 'speed_focused';
    if (accuracyTendency > 0.15 && speedTendency < -0.1) return 'accuracy_focused';
    return 'balanced';
  }
  
  // Get optimal level based on performance
  getOptimalLevel(context: UserContext): number {
    const recentRewards = this.history.slice(-5).map(h => h.reward);
    
    if (recentRewards.length === 0) return context.currentLevel;
    
    const avgReward = recentRewards.reduce((a, b) => a + b, 0) / recentRewards.length;
    
    // Progressive adjustment based on skill
    if (avgReward > 70 && this.userProfile.skillLevel > 0.7) {
      return Math.min(context.currentLevel + 2, 25);
    } else if (avgReward > 55) {
      return Math.min(context.currentLevel + 1, 25);
    } else if (avgReward < 20) {
      return Math.max(context.currentLevel - 1, 1);
    }
    
    return context.currentLevel;
  }
  
  // Get current stats for display
  getStats(): { epsilon: number; totalPulls: number; skillLevel: number; userProfile: UserProfile } {
    return {
      epsilon: this.epsilon,
      totalPulls: this.totalPulls,
      skillLevel: this.userProfile.skillLevel,
      userProfile: this.userProfile
    };
  }
  
  // Persistence
  private saveState(): void {
    const state: BanditState = {
      arms: this.arms,
      epsilon: this.epsilon,
      totalPulls: this.totalPulls,
      history: this.history.slice(-100),
      userProfile: this.userProfile
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      arms: Array.from(state.arms.entries()),
      epsilon: state.epsilon,
      totalPulls: state.totalPulls,
      history: state.history,
      userProfile: state.userProfile
    }));
  }
  
  private loadState(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.arms = new Map(data.arms || []);
        this.epsilon = data.epsilon || 0.3;
        this.totalPulls = data.totalPulls || 0;
        this.history = data.history || [];
        this.userProfile = data.userProfile || this.initUserProfile();
        
        console.log(`[Bandit] Loaded state: ${this.totalPulls} pulls, epsilon=${this.epsilon.toFixed(3)}`);
      }
    } catch (error) {
      console.warn('[Bandit] Failed to load state:', error);
    }
  }
  
  // Reset bandit (for testing)
  reset(): void {
    this.arms = new Map();
    this.epsilon = 0.3;
    this.totalPulls = 0;
    this.history = [];
    this.userProfile = this.initUserProfile();
    this.initializeArms();
    localStorage.removeItem(STORAGE_KEY);
    console.log('[Bandit] Reset complete');
  }
}

// Singleton instance
export const memoryGameBandit = new EpsilonGreedyBandit();
