// Epsilon-Greedy Contextual Bandit for Processing Speed Game
import { PerformanceMetrics, UserProfile } from './types';

export interface ProcessingContext {
  currentLevel: number;
  recentAccuracy: number;
  recentSpeed: number;
  avgResponseTime: number;
  sessionLength: number;
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  previousDifficulty: number;
  streakCount: number;
  userType: 'fast_processor' | 'accurate_processor' | 'balanced';
  frustrationLevel: number;
  engagementLevel: number;
  successRate: number;
  symbolRecognitionSpeed: number;
  codingAccuracy: number;
}

export interface ProcessingAction {
  symbolCount: number;
  trialCount: number;
  timeLimit: number;
  gridSize: number;
  symbolComplexity: number;
  difficultyMultiplier: number;
  showSymbolGuide: boolean;
  timedPressure: boolean;
}

interface ProcessingArmStats {
  actionKey: string;
  pulls: number;
  totalReward: number;
  averageReward: number;
  lastPulled: number;
  contextWeights: number[];
}

interface ProcessingUserProfile {
  preferredDifficulty: number;
  optimalSymbolCount: number;
  optimalGridSize: number;
  skillLevel: number;
  adaptationSpeed: 'fast' | 'medium' | 'slow';
  processingCapacity: number;
}

interface ProcessingRewardSignal {
  action: ProcessingAction;
  reward: number;
  context: ProcessingContext;
  metrics: PerformanceMetrics;
  timestamp: number;
}

const STORAGE_KEY = 'processingSpeedBandit';
const FEATURE_DIM = 26;

// Generate action space for processing speed game
function generateProcessingActions(): ProcessingAction[] {
  const actions: ProcessingAction[] = [];
  
  for (let level = 1; level <= 25; level++) {
    const baseSymbolCount = Math.min(3 + Math.floor(level / 3), 10);
    const baseTrialCount = Math.min(6 + Math.floor(level / 2), 18);
    const baseTimeLimit = Math.max(60, 150 - level * 3);
    const baseGridSize = Math.min(8 + Math.floor(level * 0.8), 32);
    const baseComplexity = Math.min(1 + level * 0.1, 3);
    
    const variations = [
      { timeMod: 1.3, gridMod: 0.8, guide: true, pressure: false },
      { timeMod: 1.1, gridMod: 0.9, guide: true, pressure: false },
      { timeMod: 1.0, gridMod: 1.0, guide: false, pressure: false },
      { timeMod: 0.9, gridMod: 1.1, guide: false, pressure: true },
      { timeMod: 0.8, gridMod: 1.2, guide: false, pressure: true },
    ];
    
    variations.forEach((v, idx) => {
      actions.push({
        symbolCount: baseSymbolCount,
        trialCount: baseTrialCount,
        timeLimit: Math.floor(baseTimeLimit * v.timeMod),
        gridSize: Math.floor(baseGridSize * v.gridMod),
        symbolComplexity: baseComplexity,
        difficultyMultiplier: 1 + (level - 1) * 0.08 + idx * 0.05,
        showSymbolGuide: v.guide,
        timedPressure: v.pressure,
      });
    });
  }
  
  return actions;
}

function getProcessingActionKey(action: ProcessingAction): string {
  return `${action.symbolCount}_${action.trialCount}_${action.gridSize}_${action.timeLimit}_${action.showSymbolGuide ? 1 : 0}`;
}

function extractProcessingFeatures(context: ProcessingContext): number[] {
  return [
    context.currentLevel / 25,
    context.previousDifficulty,
    context.recentAccuracy,
    context.recentSpeed,
    context.successRate,
    context.symbolRecognitionSpeed,
    context.codingAccuracy,
    context.streakCount / 15,
    context.avgResponseTime ? Math.min(1, 2000 / context.avgResponseTime) : 0.5,
    context.engagementLevel,
    1 - context.frustrationLevel,
    Math.min(1, context.sessionLength / 3600),
    context.timeOfDay === 'morning' ? 1 : 0,
    context.timeOfDay === 'afternoon' ? 1 : 0,
    context.timeOfDay === 'evening' ? 1 : 0,
    context.userType === 'fast_processor' ? 1 : 0,
    context.userType === 'accurate_processor' ? 1 : 0,
    context.userType === 'balanced' ? 1 : 0,
  ];
}

function extractProcessingActionFeatures(action: ProcessingAction): number[] {
  return [
    action.symbolCount / 10,
    action.trialCount / 18,
    action.gridSize / 32,
    action.timeLimit / 150,
    action.symbolComplexity / 3,
    action.difficultyMultiplier / 3,
    action.showSymbolGuide ? 1 : 0,
    action.timedPressure ? 1 : 0,
  ];
}

export class ProcessingSpeedBandit {
  private actions: ProcessingAction[];
  private arms: Map<string, ProcessingArmStats>;
  private epsilon: number;
  private epsilonDecay: number;
  private minEpsilon: number;
  private learningRate: number;
  private totalPulls: number;
  private history: ProcessingRewardSignal[];
  private userProfile: ProcessingUserProfile;
  
  constructor() {
    this.actions = generateProcessingActions();
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
  
  private initUserProfile(): ProcessingUserProfile {
    return {
      preferredDifficulty: 1.0,
      optimalSymbolCount: 4,
      optimalGridSize: 12,
      skillLevel: 0.5,
      adaptationSpeed: 'medium',
      processingCapacity: 5,
    };
  }
  
  private initializeArms(): void {
    this.actions.forEach(action => {
      const key = getProcessingActionKey(action);
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
  
  selectAction(context: ProcessingContext): ProcessingAction {
    const levelActions = this.getActionsForLevel(context.currentLevel);
    const candidates = levelActions.length > 0 ? levelActions : this.actions.slice(0, 10);
    
    if (Math.random() < this.epsilon) {
      console.log('[ProcessingSpeedBandit] Exploring: Random action');
      return candidates[Math.floor(Math.random() * candidates.length)];
    }
    
    console.log('[ProcessingSpeedBandit] Exploiting: Best action');
    return this.selectBestAction(context, candidates);
  }
  
  private getActionsForLevel(level: number): ProcessingAction[] {
    const minDiff = 1 + (level - 1) * 0.08;
    const maxDiff = 1 + level * 0.15;
    return this.actions.filter(a => 
      a.difficultyMultiplier >= minDiff && a.difficultyMultiplier <= maxDiff
    );
  }
  
  private selectBestAction(context: ProcessingContext, actions: ProcessingAction[]): ProcessingAction {
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
  
  private predictReward(context: ProcessingContext, action: ProcessingAction): number {
    const key = getProcessingActionKey(action);
    const arm = this.arms.get(key);
    
    if (!arm || arm.pulls === 0) {
      return this.getDefaultPrediction(context, action);
    }
    
    const features = [...extractProcessingFeatures(context), ...extractProcessingActionFeatures(action)];
    let prediction = features.reduce((sum, f, i) => sum + f * arm.contextWeights[i], 0);
    
    const blendFactor = Math.min(1, arm.pulls / 10);
    return prediction * blendFactor + arm.averageReward * (1 - blendFactor);
  }
  
  private getDefaultPrediction(context: ProcessingContext, action: ProcessingAction): number {
    let score = 50;
    
    const symbolDiff = Math.abs(action.symbolCount - this.userProfile.optimalSymbolCount);
    score -= symbolDiff * 4;
    
    const gridDiff = Math.abs(action.gridSize - this.userProfile.optimalGridSize);
    score -= gridDiff * 0.5;
    
    const diffDiff = Math.abs(action.difficultyMultiplier - this.userProfile.preferredDifficulty);
    score -= diffDiff * 10;
    
    if (context.userType === 'fast_processor') {
      if (action.timedPressure) score += 10;
      if (action.gridSize > 16) score += 5;
    }
    
    if (context.userType === 'accurate_processor') {
      if (action.showSymbolGuide) score += 10;
      if (action.timeLimit > 100) score += 5;
    }
    
    if (context.frustrationLevel > 0.5 && action.showSymbolGuide) {
      score += 15;
    }
    
    return score;
  }
  
  private calculateUCBBonus(action: ProcessingAction): number {
    const key = getProcessingActionKey(action);
    const arm = this.arms.get(key);
    
    if (!arm || arm.pulls === 0) return 100;
    return Math.sqrt(2 * Math.log(this.totalPulls + 1) / arm.pulls);
  }
  
  updateModel(context: ProcessingContext, action: ProcessingAction, reward: number, metrics: PerformanceMetrics): void {
    const key = getProcessingActionKey(action);
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
    
    console.log(`[ProcessingSpeedBandit] Updated: epsilon=${this.epsilon.toFixed(3)}, reward=${reward.toFixed(1)}`);
  }
  
  private updateWeights(arm: ProcessingArmStats, context: ProcessingContext, action: ProcessingAction, reward: number): void {
    const features = [...extractProcessingFeatures(context), ...extractProcessingActionFeatures(action)];
    const prediction = features.reduce((sum, f, i) => sum + f * arm.contextWeights[i], 0);
    const error = reward - prediction;
    
    for (let i = 0; i < arm.contextWeights.length; i++) {
      arm.contextWeights[i] += this.learningRate * error * features[i];
      arm.contextWeights[i] *= 0.999;
    }
  }
  
  private updateUserProfile(context: ProcessingContext, action: ProcessingAction, reward: number, metrics: PerformanceMetrics): void {
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
      this.userProfile.optimalSymbolCount = Math.round(
        this.userProfile.optimalSymbolCount * (1 - alpha) + action.symbolCount * alpha
      );
      this.userProfile.optimalGridSize = Math.round(
        this.userProfile.optimalGridSize * (1 - alpha) + action.gridSize * alpha
      );
      this.userProfile.processingCapacity = Math.round(
        this.userProfile.processingCapacity * (1 - alpha) + action.symbolCount * alpha
      );
    }
  }
  
  calculateReward(metrics: PerformanceMetrics & { codingAccuracy: number; processingSpeed: number }): number {
    let reward = 0;
    
    if (metrics.completed) reward += 30;
    reward += metrics.accuracy * 20;
    reward += metrics.codingAccuracy * 20;
    reward += metrics.processingSpeed * 15;
    reward += metrics.timeEfficiency * 10;
    reward += metrics.engagement * 10;
    reward -= metrics.frustration * 25;
    
    return Math.max(-100, Math.min(100, reward));
  }
  
  getOptimalLevel(context: ProcessingContext): number {
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
  
  predictNextLevelDifficulty(context: ProcessingContext): 'easier' | 'same' | 'harder' {
    const recentRewards = this.history.slice(-5).map(h => h.reward);
    if (recentRewards.length === 0) return 'same';
    
    const avgReward = recentRewards.reduce((a, b) => a + b, 0) / recentRewards.length;
    
    if (avgReward > 70) return 'harder';
    if (avgReward < 30) return 'easier';
    return 'same';
  }
  
  getPerformanceInsight(context: ProcessingContext): string {
    const recentRewards = this.history.slice(-3).map(h => h.reward);
    if (recentRewards.length === 0) return "Let's test your processing speed!";
    
    const avgReward = recentRewards.reduce((a, b) => a + b, 0) / recentRewards.length;
    const accuracy = context.recentAccuracy;
    const speed = context.avgResponseTime;
    
    if (avgReward > 75) {
      return "🔥 Lightning fast! Expect more symbols!";
    } else if (avgReward > 55) {
      return "👍 Great processing speed! Keeping the challenge balanced.";
    } else if (avgReward > 35) {
      if (accuracy < 0.6) return "🎯 Focus on accuracy - take your time with each symbol!";
      if (speed > 3000) return "⚡ Try to respond faster to each symbol!";
      return "📈 Good progress! Your processing speed is improving.";
    } else {
      return "💪 Reducing complexity to help you build speed.";
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
        console.log(`[ProcessingSpeedBandit] Loaded: ${this.totalPulls} pulls`);
      }
    } catch (e) {
      console.warn('[ProcessingSpeedBandit] Failed to load:', e);
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

export const processingSpeedBandit = new ProcessingSpeedBandit();
