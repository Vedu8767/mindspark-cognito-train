// Epsilon-Greedy Contextual Bandit for Attention Focus Game
import { PerformanceMetrics, UserProfile } from './types';

export interface AttentionContext {
  currentLevel: number;
  recentAccuracy: number;
  recentSpeed: number;
  avgReactionTime: number;
  sessionLength: number;
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  previousDifficulty: number;
  streakCount: number;
  userType: 'precision_focused' | 'speed_focused' | 'balanced';
  frustrationLevel: number;
  engagementLevel: number;
  successRate: number;
  hitRate: number;
  missRate: number;
  comboStreak: number;
}

export interface AttentionAction {
  targetCount: number;
  distractorCount: number;
  timeLimit: number;
  spawnRate: number;
  targetSize: number;
  targetDuration: number;
  difficultyMultiplier: number;
  showHints: boolean;
  slowMotionEnabled: boolean;
}

interface AttentionArmStats {
  actionKey: string;
  pulls: number;
  totalReward: number;
  averageReward: number;
  lastPulled: number;
  contextWeights: number[];
}

interface AttentionUserProfile {
  preferredDifficulty: number;
  optimalTargetCount: number;
  bestSpawnRate: number;
  skillLevel: number;
  adaptationSpeed: 'fast' | 'medium' | 'slow';
  preferredTargetSize: number;
}

interface AttentionRewardSignal {
  action: AttentionAction;
  reward: number;
  context: AttentionContext;
  metrics: PerformanceMetrics;
  timestamp: number;
}

const STORAGE_KEY = 'attentionBandit';
const FEATURE_DIM = 26;

// Generate action space for attention game
function generateAttentionActions(): AttentionAction[] {
  const actions: AttentionAction[] = [];
  
  for (let level = 1; level <= 25; level++) {
    const baseTargets = Math.min(3 + Math.floor(level / 3), 15);
    const baseDistractors = Math.min(2 + Math.floor(level / 2), 20);
    const baseTime = Math.max(20, 60 - level);
    const baseSpawnRate = Math.max(800, 2500 - level * 60);
    
    const variations = [
      { timeMod: 1.3, spawnMod: 1.2, size: 50, hints: true, slowMo: true },
      { timeMod: 1.1, spawnMod: 1.0, size: 45, hints: true, slowMo: false },
      { timeMod: 1.0, spawnMod: 1.0, size: 40, hints: false, slowMo: false },
      { timeMod: 0.9, spawnMod: 0.85, size: 35, hints: false, slowMo: false },
      { timeMod: 0.8, spawnMod: 0.7, size: 30, hints: false, slowMo: false },
    ];
    
    variations.forEach((v, idx) => {
      actions.push({
        targetCount: baseTargets,
        distractorCount: baseDistractors,
        timeLimit: Math.floor(baseTime * v.timeMod),
        spawnRate: Math.floor(baseSpawnRate * v.spawnMod),
        targetSize: v.size,
        targetDuration: Math.max(1500, 3500 - level * 60),
        difficultyMultiplier: 1 + (level - 1) * 0.08 + idx * 0.05,
        showHints: v.hints,
        slowMotionEnabled: v.slowMo,
      });
    });
  }
  
  return actions;
}

function getAttentionActionKey(action: AttentionAction): string {
  return `${action.targetCount}_${action.distractorCount}_${action.timeLimit}_${action.spawnRate}_${action.showHints ? 1 : 0}`;
}

function extractAttentionFeatures(context: AttentionContext): number[] {
  return [
    context.currentLevel / 25,
    context.previousDifficulty,
    context.recentAccuracy,
    context.recentSpeed,
    context.successRate,
    context.hitRate,
    1 - context.missRate,
    context.streakCount / 15,
    context.comboStreak / 10,
    context.engagementLevel,
    1 - context.frustrationLevel,
    Math.min(1, context.sessionLength / 3600),
    context.avgReactionTime ? Math.min(1, 500 / context.avgReactionTime) : 0.5,
    context.timeOfDay === 'morning' ? 1 : 0,
    context.timeOfDay === 'afternoon' ? 1 : 0,
    context.timeOfDay === 'evening' ? 1 : 0,
    context.userType === 'speed_focused' ? 1 : 0,
    context.userType === 'precision_focused' ? 1 : 0,
    context.userType === 'balanced' ? 1 : 0,
  ];
}

function extractAttentionActionFeatures(action: AttentionAction): number[] {
  return [
    action.targetCount / 15,
    action.distractorCount / 20,
    action.timeLimit / 60,
    action.spawnRate / 2500,
    action.targetSize / 60,
    action.difficultyMultiplier / 3,
    action.showHints ? 1 : 0,
  ];
}

export class AttentionBandit {
  private actions: AttentionAction[];
  private arms: Map<string, AttentionArmStats>;
  private epsilon: number;
  private epsilonDecay: number;
  private minEpsilon: number;
  private learningRate: number;
  private totalPulls: number;
  private history: AttentionRewardSignal[];
  private userProfile: AttentionUserProfile;
  
  constructor() {
    this.actions = generateAttentionActions();
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
  
  private initUserProfile(): AttentionUserProfile {
    return {
      preferredDifficulty: 1.0,
      optimalTargetCount: 5,
      bestSpawnRate: 1800,
      skillLevel: 0.5,
      adaptationSpeed: 'medium',
      preferredTargetSize: 40,
    };
  }
  
  private initializeArms(): void {
    this.actions.forEach(action => {
      const key = getAttentionActionKey(action);
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
  
  selectAction(context: AttentionContext): AttentionAction {
    const levelActions = this.getActionsForLevel(context.currentLevel);
    const candidates = levelActions.length > 0 ? levelActions : this.actions.slice(0, 10);
    
    if (Math.random() < this.epsilon) {
      console.log('[AttentionBandit] Exploring: Random action');
      return candidates[Math.floor(Math.random() * candidates.length)];
    }
    
    console.log('[AttentionBandit] Exploiting: Best action');
    return this.selectBestAction(context, candidates);
  }
  
  private getActionsForLevel(level: number): AttentionAction[] {
    const minDiff = 1 + (level - 1) * 0.08;
    const maxDiff = 1 + level * 0.15;
    return this.actions.filter(a => 
      a.difficultyMultiplier >= minDiff && a.difficultyMultiplier <= maxDiff
    );
  }
  
  private selectBestAction(context: AttentionContext, actions: AttentionAction[]): AttentionAction {
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
  
  private predictReward(context: AttentionContext, action: AttentionAction): number {
    const key = getAttentionActionKey(action);
    const arm = this.arms.get(key);
    
    if (!arm || arm.pulls === 0) {
      return this.getDefaultPrediction(context, action);
    }
    
    const features = [...extractAttentionFeatures(context), ...extractAttentionActionFeatures(action)];
    let prediction = features.reduce((sum, f, i) => sum + f * arm.contextWeights[i], 0);
    
    const blendFactor = Math.min(1, arm.pulls / 10);
    return prediction * blendFactor + arm.averageReward * (1 - blendFactor);
  }
  
  private getDefaultPrediction(context: AttentionContext, action: AttentionAction): number {
    let score = 50;
    
    const targetDiff = Math.abs(action.targetCount - this.userProfile.optimalTargetCount);
    score -= targetDiff * 3;
    
    const diffDiff = Math.abs(action.difficultyMultiplier - this.userProfile.preferredDifficulty);
    score -= diffDiff * 10;
    
    if (context.userType === 'precision_focused') {
      if (action.showHints) score += 10;
      if (action.targetSize > 40) score += 5;
    }
    
    if (context.userType === 'speed_focused') {
      if (action.spawnRate < 1500) score += 10;
      if (action.targetSize < 40) score += 5;
    }
    
    if (context.frustrationLevel > 0.5 && action.slowMotionEnabled) {
      score += 15;
    }
    
    return score;
  }
  
  private calculateUCBBonus(action: AttentionAction): number {
    const key = getAttentionActionKey(action);
    const arm = this.arms.get(key);
    
    if (!arm || arm.pulls === 0) return 100;
    return Math.sqrt(2 * Math.log(this.totalPulls + 1) / arm.pulls);
  }
  
  updateModel(context: AttentionContext, action: AttentionAction, reward: number, metrics: PerformanceMetrics): void {
    const key = getAttentionActionKey(action);
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
    
    console.log(`[AttentionBandit] Updated: epsilon=${this.epsilon.toFixed(3)}, reward=${reward.toFixed(1)}`);
  }
  
  private updateWeights(arm: AttentionArmStats, context: AttentionContext, action: AttentionAction, reward: number): void {
    const features = [...extractAttentionFeatures(context), ...extractAttentionActionFeatures(action)];
    const prediction = features.reduce((sum, f, i) => sum + f * arm.contextWeights[i], 0);
    const error = reward - prediction;
    
    for (let i = 0; i < arm.contextWeights.length; i++) {
      arm.contextWeights[i] += this.learningRate * error * features[i];
      arm.contextWeights[i] *= 0.999;
    }
  }
  
  private updateUserProfile(context: AttentionContext, action: AttentionAction, reward: number, metrics: PerformanceMetrics): void {
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
      this.userProfile.optimalTargetCount = Math.round(
        this.userProfile.optimalTargetCount * (1 - alpha) + action.targetCount * alpha
      );
      this.userProfile.preferredTargetSize = Math.round(
        this.userProfile.preferredTargetSize * (1 - alpha) + action.targetSize * alpha
      );
    }
  }
  
  calculateReward(metrics: PerformanceMetrics & { hitRate: number; missRate: number; comboMax: number }): number {
    let reward = 0;
    
    if (metrics.completed) reward += 35;
    reward += metrics.accuracy * 25;
    reward += metrics.hitRate * 20;
    reward -= metrics.missRate * 15;
    reward += Math.min(1, metrics.comboMax / 10) * 15;
    reward += metrics.engagement * 10;
    reward -= metrics.frustration * 25;
    
    return Math.max(-100, Math.min(100, reward));
  }
  
  getOptimalLevel(context: AttentionContext): number {
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
        console.log(`[AttentionBandit] Loaded: ${this.totalPulls} pulls`);
      }
    } catch (e) {
      console.warn('[AttentionBandit] Failed to load:', e);
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

export const attentionBandit = new AttentionBandit();
