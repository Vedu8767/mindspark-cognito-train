// Epsilon-Greedy Contextual Bandit for Spatial Navigation Game
import { PerformanceMetrics, UserProfile } from './types';

export interface SpatialContext {
  currentLevel: number;
  recentAccuracy: number;
  recentSpeed: number;
  avgMoveCount: number;
  sessionLength: number;
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  previousDifficulty: number;
  streakCount: number;
  userType: 'efficient_navigator' | 'explorer' | 'balanced';
  frustrationLevel: number;
  engagementLevel: number;
  successRate: number;
  avgPathCompletionRate: number;
  spatialMemoryStrength: number;
}

export interface SpatialAction {
  gridSize: number;
  pathLength: number;
  trialCount: number;
  timeLimit: number;
  studyTime: number;
  difficultyMultiplier: number;
  showPathHints: boolean;
  allowBacktracking: boolean;
}

interface SpatialArmStats {
  actionKey: string;
  pulls: number;
  totalReward: number;
  averageReward: number;
  lastPulled: number;
  contextWeights: number[];
}

interface SpatialUserProfile {
  preferredDifficulty: number;
  optimalGridSize: number;
  optimalPathLength: number;
  skillLevel: number;
  adaptationSpeed: 'fast' | 'medium' | 'slow';
  spatialMemoryCapacity: number;
}

interface SpatialRewardSignal {
  action: SpatialAction;
  reward: number;
  context: SpatialContext;
  metrics: PerformanceMetrics;
  timestamp: number;
}

const STORAGE_KEY = 'spatialBandit';
const FEATURE_DIM = 26;

// Generate action space for spatial navigation game
function generateSpatialActions(): SpatialAction[] {
  const actions: SpatialAction[] = [];
  
  for (let level = 1; level <= 25; level++) {
    const baseGridSize = Math.min(5 + Math.floor(level / 3), 12);
    const basePathLength = Math.min(3 + Math.floor(level / 2), 10);
    const baseTrials = Math.min(6 + Math.floor(level / 2), 16);
    const baseTimeLimit = Math.max(120, 300 - level * 6);
    const baseStudyTime = Math.max(3000, 8000 - level * 150);
    
    const variations = [
      { timeMod: 1.3, studyMod: 1.3, hints: true, backtrack: true },
      { timeMod: 1.1, studyMod: 1.1, hints: true, backtrack: false },
      { timeMod: 1.0, studyMod: 1.0, hints: false, backtrack: true },
      { timeMod: 0.9, studyMod: 0.85, hints: false, backtrack: false },
      { timeMod: 0.8, studyMod: 0.7, hints: false, backtrack: false },
    ];
    
    variations.forEach((v, idx) => {
      actions.push({
        gridSize: baseGridSize,
        pathLength: basePathLength,
        trialCount: baseTrials,
        timeLimit: Math.floor(baseTimeLimit * v.timeMod),
        studyTime: Math.floor(baseStudyTime * v.studyMod),
        difficultyMultiplier: 1 + (level - 1) * 0.08 + idx * 0.05,
        showPathHints: v.hints,
        allowBacktracking: v.backtrack,
      });
    });
  }
  
  return actions;
}

function getSpatialActionKey(action: SpatialAction): string {
  return `${action.gridSize}_${action.pathLength}_${action.trialCount}_${action.timeLimit}_${action.showPathHints ? 1 : 0}`;
}

function extractSpatialFeatures(context: SpatialContext): number[] {
  return [
    context.currentLevel / 25,
    context.previousDifficulty,
    context.recentAccuracy,
    context.recentSpeed,
    context.successRate,
    context.avgPathCompletionRate,
    context.spatialMemoryStrength,
    context.streakCount / 15,
    context.avgMoveCount ? Math.min(1, 10 / context.avgMoveCount) : 0.5,
    context.engagementLevel,
    1 - context.frustrationLevel,
    Math.min(1, context.sessionLength / 3600),
    context.timeOfDay === 'morning' ? 1 : 0,
    context.timeOfDay === 'afternoon' ? 1 : 0,
    context.timeOfDay === 'evening' ? 1 : 0,
    context.userType === 'efficient_navigator' ? 1 : 0,
    context.userType === 'explorer' ? 1 : 0,
    context.userType === 'balanced' ? 1 : 0,
  ];
}

function extractSpatialActionFeatures(action: SpatialAction): number[] {
  return [
    action.gridSize / 12,
    action.pathLength / 10,
    action.trialCount / 16,
    action.timeLimit / 300,
    action.studyTime / 8000,
    action.difficultyMultiplier / 3,
    action.showPathHints ? 1 : 0,
    action.allowBacktracking ? 1 : 0,
  ];
}

export class SpatialBandit {
  private actions: SpatialAction[];
  private arms: Map<string, SpatialArmStats>;
  private epsilon: number;
  private epsilonDecay: number;
  private minEpsilon: number;
  private learningRate: number;
  private totalPulls: number;
  private history: SpatialRewardSignal[];
  private userProfile: SpatialUserProfile;
  
  constructor() {
    this.actions = generateSpatialActions();
    this.arms = new Map();
    this.epsilon = 0.3;
    this.epsilonDecay = 0.995;
    this.minEpsilon = 0.05;
    this.learningRate = 0.1;
    this.totalPulls = 0;
    this.history = [];
    this.userProfile = this.initUserProfile();
    
    this.initializeArms();
    this.loadState();
  }
  
  private initUserProfile(): SpatialUserProfile {
    return {
      preferredDifficulty: 1.0,
      optimalGridSize: 6,
      optimalPathLength: 4,
      skillLevel: 0.5,
      adaptationSpeed: 'medium',
      spatialMemoryCapacity: 5,
    };
  }
  
  private initializeArms(): void {
    this.actions.forEach(action => {
      const key = getSpatialActionKey(action);
      if (!this.arms.has(key)) {
        this.arms.set(key, {
          actionKey: key,
          pulls: 0,
          totalReward: 0,
          averageReward: 0,
          lastPulled: 0,
          contextWeights: new Array(FEATURE_DIM).fill(0),
        });
      }
    });
  }
  
  selectAction(context: SpatialContext): SpatialAction {
    const levelActions = this.getActionsForLevel(context.currentLevel);
    const candidates = levelActions.length > 0 ? levelActions : this.actions.slice(0, 10);
    
    if (Math.random() < this.epsilon) {
      console.log('[SpatialBandit] Exploring: Random action');
      return candidates[Math.floor(Math.random() * candidates.length)];
    }
    
    console.log('[SpatialBandit] Exploiting: Best action');
    return this.selectBestAction(context, candidates);
  }
  
  private getActionsForLevel(level: number): SpatialAction[] {
    const minDiff = 1 + (level - 1) * 0.08;
    const maxDiff = 1 + level * 0.15;
    return this.actions.filter(a => 
      a.difficultyMultiplier >= minDiff && a.difficultyMultiplier <= maxDiff
    );
  }
  
  private selectBestAction(context: SpatialContext, actions: SpatialAction[]): SpatialAction {
    let best = actions[0];
    let bestScore = -Infinity;
    
    actions.forEach(action => {
      const score = this.predictReward(context, action);
      const ucbBonus = this.calculateUCBBonus(action);
      const total = score + ucbBonus * 0.1;
      
      if (total > bestScore) {
        bestScore = total;
        best = action;
      }
    });
    
    return best;
  }
  
  private predictReward(context: SpatialContext, action: SpatialAction): number {
    const key = getSpatialActionKey(action);
    const arm = this.arms.get(key);
    
    if (!arm || arm.pulls === 0) {
      return this.getDefaultPrediction(context, action);
    }
    
    const features = [...extractSpatialFeatures(context), ...extractSpatialActionFeatures(action)];
    let prediction = features.reduce((sum, f, i) => sum + f * arm.contextWeights[i], 0);
    
    const blendFactor = Math.min(1, arm.pulls / 10);
    return prediction * blendFactor + arm.averageReward * (1 - blendFactor);
  }
  
  private getDefaultPrediction(context: SpatialContext, action: SpatialAction): number {
    let score = 50;
    
    const gridDiff = Math.abs(action.gridSize - this.userProfile.optimalGridSize);
    score -= gridDiff * 3;
    
    const pathDiff = Math.abs(action.pathLength - this.userProfile.optimalPathLength);
    score -= pathDiff * 4;
    
    const diffDiff = Math.abs(action.difficultyMultiplier - this.userProfile.preferredDifficulty);
    score -= diffDiff * 10;
    
    if (context.userType === 'efficient_navigator') {
      if (!action.allowBacktracking) score += 8;
      if (action.studyTime < 5000) score += 5;
    }
    
    if (context.userType === 'explorer') {
      if (action.allowBacktracking) score += 10;
      if (action.studyTime > 5000) score += 5;
    }
    
    if (context.frustrationLevel > 0.5 && action.showPathHints) {
      score += 15;
    }
    
    return score;
  }
  
  private calculateUCBBonus(action: SpatialAction): number {
    const key = getSpatialActionKey(action);
    const arm = this.arms.get(key);
    
    if (!arm || arm.pulls === 0) return 100;
    return Math.sqrt(2 * Math.log(this.totalPulls + 1) / arm.pulls);
  }
  
  updateModel(context: SpatialContext, action: SpatialAction, reward: number, metrics: PerformanceMetrics): void {
    const key = getSpatialActionKey(action);
    let arm = this.arms.get(key);
    
    if (!arm) {
      arm = {
        actionKey: key,
        pulls: 0,
        totalReward: 0,
        averageReward: 0,
        lastPulled: 0,
        contextWeights: new Array(FEATURE_DIM).fill(0),
      };
      this.arms.set(key, arm);
    }
    
    arm.pulls++;
    arm.totalReward += reward;
    arm.averageReward = arm.totalReward / arm.pulls;
    arm.lastPulled = Date.now();
    
    this.updateWeights(arm, context, action, reward);
    this.totalPulls++;
    this.epsilon = Math.max(this.minEpsilon, this.epsilon * this.epsilonDecay);
    this.updateUserProfile(context, action, reward, metrics);
    
    this.history.push({ action, reward, context, metrics, timestamp: Date.now() });
    this.saveState();
    
    console.log(`[SpatialBandit] Updated: epsilon=${this.epsilon.toFixed(3)}, reward=${reward.toFixed(1)}`);
  }
  
  private updateWeights(arm: SpatialArmStats, context: SpatialContext, action: SpatialAction, reward: number): void {
    const features = [...extractSpatialFeatures(context), ...extractSpatialActionFeatures(action)];
    const prediction = features.reduce((sum, f, i) => sum + f * arm.contextWeights[i], 0);
    const error = reward - prediction;
    
    for (let i = 0; i < arm.contextWeights.length; i++) {
      arm.contextWeights[i] += this.learningRate * error * features[i];
      arm.contextWeights[i] *= 0.999;
    }
  }
  
  private updateUserProfile(context: SpatialContext, action: SpatialAction, reward: number, metrics: PerformanceMetrics): void {
    const alpha = 0.1;
    
    if (metrics.completed && metrics.accuracy > 0.8) {
      this.userProfile.skillLevel = Math.min(1, this.userProfile.skillLevel + alpha);
    } else if (!metrics.completed || metrics.accuracy < 0.4) {
      this.userProfile.skillLevel = Math.max(0, this.userProfile.skillLevel - alpha * 0.5);
    }
    
    if (reward > 60) {
      this.userProfile.preferredDifficulty += alpha * (action.difficultyMultiplier - this.userProfile.preferredDifficulty);
    }
    
    if (metrics.completed && metrics.accuracy > 0.7) {
      this.userProfile.optimalGridSize = Math.round(
        this.userProfile.optimalGridSize * (1 - alpha) + action.gridSize * alpha
      );
      this.userProfile.optimalPathLength = Math.round(
        this.userProfile.optimalPathLength * (1 - alpha) + action.pathLength * alpha
      );
      this.userProfile.spatialMemoryCapacity = Math.round(
        this.userProfile.spatialMemoryCapacity * (1 - alpha) + action.pathLength * alpha
      );
    }
  }
  
  calculateReward(metrics: PerformanceMetrics & { pathCompletionRate: number; moveEfficiency: number }): number {
    let reward = 0;
    
    if (metrics.completed) reward += 30;
    reward += metrics.accuracy * 25;
    reward += metrics.pathCompletionRate * 20;
    reward += metrics.moveEfficiency * 15;
    reward += metrics.timeEfficiency * 10;
    reward += metrics.engagement * 10;
    reward -= metrics.frustration * 25;
    
    return Math.max(-100, Math.min(100, reward));
  }
  
  getOptimalLevel(context: SpatialContext): number {
    const recentRewards = this.history.slice(-5).map(h => h.reward);
    if (recentRewards.length === 0) return Math.min(context.currentLevel + 1, 25);
    
    const avgReward = recentRewards.reduce((a, b) => a + b, 0) / recentRewards.length;
    
    // Never skip levels - always go +1 or -1 or stay
    if (avgReward > 60) {
      return Math.min(context.currentLevel + 1, 25);
    } else if (avgReward < 25) {
      return Math.max(context.currentLevel - 1, 1);
    }
    
    return Math.min(context.currentLevel + 1, 25);
  }
  
  predictNextLevelDifficulty(context: SpatialContext): 'easier' | 'same' | 'harder' {
    const recentRewards = this.history.slice(-5).map(h => h.reward);
    if (recentRewards.length === 0) return 'same';
    
    const avgReward = recentRewards.reduce((a, b) => a + b, 0) / recentRewards.length;
    
    if (avgReward > 70) return 'harder';
    if (avgReward < 30) return 'easier';
    return 'same';
  }
  
  getPerformanceInsight(context: SpatialContext): string {
    const recentRewards = this.history.slice(-3).map(h => h.reward);
    if (recentRewards.length === 0) return "Let's test your spatial memory!";
    
    const avgReward = recentRewards.reduce((a, b) => a + b, 0) / recentRewards.length;
    const accuracy = context.recentAccuracy;
    const moveEfficiency = context.avgMoveCount ? 10 / context.avgMoveCount : 0.5;
    
    if (avgReward > 75) {
      return "🔥 Outstanding navigation! Expect a tougher maze!";
    } else if (avgReward > 55) {
      return "👍 Great spatial awareness! Keeping the challenge balanced.";
    } else if (avgReward > 35) {
      if (accuracy < 0.6) return "🎯 Focus on memorizing the path carefully!";
      if (moveEfficiency < 0.5) return "⚡ Try to find shorter routes!";
      return "📈 Good progress! Your spatial memory is improving.";
    } else {
      return "💪 Simplifying the maze to help you build confidence.";
    }
  }
  
  getStats() {
    return {
      epsilon: this.epsilon,
      totalPulls: this.totalPulls,
      skillLevel: this.userProfile.skillLevel,
      userProfile: this.userProfile,
    };
  }
  
  private saveState(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      arms: Array.from(this.arms.entries()),
      epsilon: this.epsilon,
      totalPulls: this.totalPulls,
      history: this.history.slice(-100),
      userProfile: this.userProfile,
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
        console.log(`[SpatialBandit] Loaded: ${this.totalPulls} pulls`);
      }
    } catch (e) {
      console.warn('[SpatialBandit] Failed to load:', e);
    }
  }
  
  reset(): void {
    this.arms = new Map();
    this.epsilon = 0.3;
    this.totalPulls = 0;
    this.history = [];
    this.userProfile = this.initUserProfile();
    this.initializeArms();
    localStorage.removeItem(STORAGE_KEY);
  }
}

export const spatialBandit = new SpatialBandit();
