// Epsilon-Greedy Contextual Bandit for Reaction Speed Game
import { PerformanceMetrics } from './types';

export interface ReactionContext {
  currentLevel: number;
  avgReactionTime: number;
  recentAccuracy: number;
  sessionLength: number;
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  previousDifficulty: number;
  streakCount: number;
  userType: 'fast_reactor' | 'consistent' | 'improving';
  frustrationLevel: number;
  engagementLevel: number;
  successRate: number;
  earlyClickRate: number;
  bestReactionTime: number;
  consistencyScore: number;
}

export interface ReactionAction {
  trialCount: number;
  minDelay: number;
  maxDelay: number;
  targetTime: number;
  allowEarlyPenalty: boolean;
  showCountdown: boolean;
  difficultyMultiplier: number;
  adaptiveDelay: boolean;
  feedbackDuration: number;
}

interface ReactionArmStats {
  actionKey: string;
  pulls: number;
  totalReward: number;
  averageReward: number;
  lastPulled: number;
  contextWeights: number[];
}

interface ReactionUserProfile {
  preferredDifficulty: number;
  optimalTargetTime: number;
  bestDelayRange: { min: number; max: number };
  skillLevel: number;
  adaptationSpeed: 'fast' | 'medium' | 'slow';
  avgReactionTime: number;
}

interface ReactionRewardSignal {
  action: ReactionAction;
  reward: number;
  context: ReactionContext;
  metrics: PerformanceMetrics;
  timestamp: number;
}

const STORAGE_KEY = 'reactionBandit';
const FEATURE_DIM = 24;

function generateReactionActions(): ReactionAction[] {
  const actions: ReactionAction[] = [];
  
  for (let level = 1; level <= 25; level++) {
    const baseTrials = Math.min(5 + Math.floor(level / 2), 20);
    const baseMinDelay = Math.max(300, 1200 - level * 30);
    const baseMaxDelay = Math.max(800, 3500 - level * 80);
    const baseTargetTime = Math.max(200, 600 - level * 15);
    
    const variations = [
      { trialMod: 0.8, delayMod: 1.2, countdown: true, adaptive: true, penalty: false },
      { trialMod: 1.0, delayMod: 1.0, countdown: true, adaptive: false, penalty: false },
      { trialMod: 1.0, delayMod: 1.0, countdown: false, adaptive: true, penalty: true },
      { trialMod: 1.2, delayMod: 0.9, countdown: false, adaptive: false, penalty: true },
      { trialMod: 1.3, delayMod: 0.8, countdown: false, adaptive: false, penalty: true },
    ];
    
    variations.forEach((v, idx) => {
      actions.push({
        trialCount: Math.floor(baseTrials * v.trialMod),
        minDelay: Math.floor(baseMinDelay * v.delayMod),
        maxDelay: Math.floor(baseMaxDelay * v.delayMod),
        targetTime: baseTargetTime,
        allowEarlyPenalty: v.penalty,
        showCountdown: v.countdown,
        difficultyMultiplier: 1 + (level - 1) * 0.08 + idx * 0.05,
        adaptiveDelay: v.adaptive,
        feedbackDuration: Math.max(800, 1500 - level * 20),
      });
    });
  }
  
  return actions;
}

function getReactionActionKey(action: ReactionAction): string {
  return `${action.trialCount}_${action.minDelay}_${action.maxDelay}_${action.targetTime}_${action.showCountdown ? 1 : 0}`;
}

function extractReactionFeatures(context: ReactionContext): number[] {
  return [
    context.currentLevel / 25,
    context.previousDifficulty,
    context.recentAccuracy,
    context.successRate,
    1 - context.earlyClickRate,
    context.avgReactionTime ? Math.min(1, 400 / context.avgReactionTime) : 0.5,
    context.bestReactionTime ? Math.min(1, 300 / context.bestReactionTime) : 0.5,
    context.consistencyScore,
    context.streakCount / 15,
    context.engagementLevel,
    1 - context.frustrationLevel,
    Math.min(1, context.sessionLength / 3600),
    context.timeOfDay === 'morning' ? 1 : 0,
    context.timeOfDay === 'afternoon' ? 1 : 0,
    context.timeOfDay === 'evening' ? 1 : 0,
    context.userType === 'fast_reactor' ? 1 : 0,
    context.userType === 'consistent' ? 1 : 0,
    context.userType === 'improving' ? 1 : 0,
  ];
}

function extractReactionActionFeatures(action: ReactionAction): number[] {
  return [
    action.trialCount / 20,
    action.minDelay / 1200,
    action.maxDelay / 3500,
    action.targetTime / 600,
    action.difficultyMultiplier / 3,
    action.showCountdown ? 1 : 0,
  ];
}

export class ReactionBandit {
  private actions: ReactionAction[];
  private arms: Map<string, ReactionArmStats>;
  private epsilon: number;
  private epsilonDecay: number;
  private minEpsilon: number;
  private learningRate: number;
  private totalPulls: number;
  private history: ReactionRewardSignal[];
  private userProfile: ReactionUserProfile;
  
  constructor() {
    this.actions = generateReactionActions();
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
  
  private initUserProfile(): ReactionUserProfile {
    return {
      preferredDifficulty: 1.0,
      optimalTargetTime: 450,
      bestDelayRange: { min: 800, max: 2500 },
      skillLevel: 0.5,
      adaptationSpeed: 'medium',
      avgReactionTime: 400,
    };
  }
  
  private initializeArms(): void {
    this.actions.forEach(action => {
      const key = getReactionActionKey(action);
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
  
  selectAction(context: ReactionContext): ReactionAction {
    const levelActions = this.getActionsForLevel(context.currentLevel);
    const candidates = levelActions.length > 0 ? levelActions : this.actions.slice(0, 10);
    
    if (Math.random() < this.epsilon) {
      console.log('[ReactionBandit] Exploring: Random action');
      return candidates[Math.floor(Math.random() * candidates.length)];
    }
    
    console.log('[ReactionBandit] Exploiting: Best action');
    return this.selectBestAction(context, candidates);
  }
  
  private getActionsForLevel(level: number): ReactionAction[] {
    const minDiff = 1 + (level - 1) * 0.08;
    const maxDiff = 1 + level * 0.15;
    return this.actions.filter(a => 
      a.difficultyMultiplier >= minDiff && a.difficultyMultiplier <= maxDiff
    );
  }
  
  private selectBestAction(context: ReactionContext, actions: ReactionAction[]): ReactionAction {
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
  
  private predictReward(context: ReactionContext, action: ReactionAction): number {
    const key = getReactionActionKey(action);
    const arm = this.arms.get(key);
    
    if (!arm || arm.pulls === 0) {
      return this.getDefaultPrediction(context, action);
    }
    
    const features = [...extractReactionFeatures(context), ...extractReactionActionFeatures(action)];
    let prediction = features.reduce((sum, f, i) => sum + f * arm.contextWeights[i], 0);
    
    const blendFactor = Math.min(1, arm.pulls / 10);
    return prediction * blendFactor + arm.averageReward * (1 - blendFactor);
  }
  
  private getDefaultPrediction(context: ReactionContext, action: ReactionAction): number {
    let score = 50;
    
    const targetDiff = Math.abs(action.targetTime - this.userProfile.optimalTargetTime);
    score -= (targetDiff / 100) * 5;
    
    const diffDiff = Math.abs(action.difficultyMultiplier - this.userProfile.preferredDifficulty);
    score -= diffDiff * 10;
    
    if (context.userType === 'fast_reactor') {
      if (action.targetTime < 350) score += 10;
      if (!action.showCountdown) score += 5;
    }
    
    if (context.userType === 'consistent') {
      if (action.adaptiveDelay) score += 10;
      if (action.showCountdown) score += 5;
    }
    
    if (context.earlyClickRate > 0.3 && action.showCountdown) {
      score += 15;
    }
    
    if (context.frustrationLevel > 0.5) {
      if (action.adaptiveDelay) score += 10;
      if (!action.allowEarlyPenalty) score += 10;
    }
    
    return score;
  }
  
  private calculateUCBBonus(action: ReactionAction): number {
    const key = getReactionActionKey(action);
    const arm = this.arms.get(key);
    
    if (!arm || arm.pulls === 0) return 100;
    return Math.sqrt(2 * Math.log(this.totalPulls + 1) / arm.pulls);
  }
  
  updateModel(context: ReactionContext, action: ReactionAction, reward: number, metrics: PerformanceMetrics): void {
    const key = getReactionActionKey(action);
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
    
    console.log(`[ReactionBandit] Updated: epsilon=${this.epsilon.toFixed(3)}, reward=${reward.toFixed(1)}`);
  }
  
  private updateWeights(arm: ReactionArmStats, context: ReactionContext, action: ReactionAction, reward: number): void {
    const features = [...extractReactionFeatures(context), ...extractReactionActionFeatures(action)];
    const prediction = features.reduce((sum, f, i) => sum + f * arm.contextWeights[i], 0);
    const error = reward - prediction;
    
    for (let i = 0; i < arm.contextWeights.length; i++) {
      arm.contextWeights[i] += this.learningRate * error * features[i];
      arm.contextWeights[i] *= 0.999;
    }
  }
  
  private updateUserProfile(context: ReactionContext, action: ReactionAction, reward: number, metrics: PerformanceMetrics): void {
    const alpha = 0.1;
    
    if (metrics.completed && metrics.accuracy > 0.8) {
      this.userProfile.skillLevel = Math.min(1, this.userProfile.skillLevel + alpha);
    } else if (!metrics.completed || metrics.accuracy < 0.4) {
      this.userProfile.skillLevel = Math.max(0, this.userProfile.skillLevel - alpha * 0.5);
    }
    
    if (reward > 60) {
      this.userProfile.preferredDifficulty += alpha * (action.difficultyMultiplier - this.userProfile.preferredDifficulty);
    }
    
    if (metrics.avgReactionTime && metrics.avgReactionTime > 0) {
      this.userProfile.avgReactionTime = Math.round(
        this.userProfile.avgReactionTime * (1 - alpha) + metrics.avgReactionTime * alpha
      );
      this.userProfile.optimalTargetTime = Math.max(200, Math.round(this.userProfile.avgReactionTime * 0.8));
    }
  }
  
  calculateReward(metrics: PerformanceMetrics & { avgReactionTime: number; earlyClicks: number; totalTrials: number }): number {
    let reward = 0;
    
    if (metrics.completed) reward += 30;
    reward += metrics.accuracy * 25;
    
    // Reaction time bonus (faster is better, up to a point)
    const rtScore = Math.max(0, 1 - metrics.avgReactionTime / 800);
    reward += rtScore * 25;
    
    // Consistency bonus
    reward += (1 - metrics.earlyClicks / Math.max(1, metrics.totalTrials)) * 15;
    
    reward += metrics.engagement * 10;
    reward -= metrics.frustration * 25;
    
    return Math.max(-100, Math.min(100, reward));
  }
  
  getOptimalLevel(context: ReactionContext): number {
    const recentRewards = this.history.slice(-5).map(h => h.reward);
    if (recentRewards.length === 0) return context.currentLevel;
    
    const avgReward = recentRewards.reduce((a, b) => a + b, 0) / recentRewards.length;
    
    if (avgReward > 70 && this.userProfile.skillLevel > 0.7) {
      return Math.min(context.currentLevel + 2, 25);
    } else if (avgReward > 55) {
      return Math.min(context.currentLevel + 1, 25);
    } else if (avgReward < 20) {
      return Math.max(context.currentLevel - 1, 1);
    }
    
    return context.currentLevel;
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
        console.log(`[ReactionBandit] Loaded: ${this.totalPulls} pulls`);
      }
    } catch (e) {
      console.warn('[ReactionBandit] Failed to load:', e);
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

export const reactionBandit = new ReactionBandit();
