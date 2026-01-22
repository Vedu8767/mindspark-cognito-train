// Tower of Hanoi Epsilon-Greedy Contextual Bandit

export interface HanoiContext {
  currentLevel: number;
  recentAccuracy: number;
  recentSpeed: number;
  sessionLength: number;
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  previousDifficulty: number;
  streakCount: number;
  userType: 'speed_focused' | 'accuracy_focused' | 'balanced';
  avgMoveEfficiency: number;
  frustrationLevel: number;
  engagementLevel: number;
  preferredDiskCount: number;
  successRate: number;
  planningAbility: number;
}

export interface HanoiAction {
  diskCount: number;
  timeLimit: number;
  showMoveCounter: boolean;
  showOptimalMoves: boolean;
  hintEnabled: boolean;
  difficultyMultiplier: number;
  level: number;
}

interface HanoiArmStatistics {
  actionKey: string;
  pulls: number;
  totalReward: number;
  averageReward: number;
  lastPulled: number;
  contextWeights: number[];
}

interface HanoiUserProfile {
  preferredDifficulty: number;
  optimalDiskCount: number;
  bestTimeOfDay: 'morning' | 'afternoon' | 'evening';
  learningRate: number;
  planningSkill: number;
  skillLevel: number;
}

interface HanoiPerformanceMetrics {
  completed: boolean;
  accuracy: number;
  timeEfficiency: number;
  moveEfficiency: number;
  optimalMoves: number;
  actualMoves: number;
  timeUsed: number;
  timeLimit: number;
}

// Generate action space for Tower of Hanoi (25 levels × 5 variations = 125 actions)
function generateHanoiActionSpace(): HanoiAction[] {
  const actions: HanoiAction[] = [];
  
  for (let level = 1; level <= 25; level++) {
    const baseDiskCount = Math.min(3 + Math.floor((level - 1) / 5), 9);
    const baseTimeLimit = 60 + level * 30;
    
    const variations = [
      { timeMod: 1.3, showCounter: true, showOptimal: true, hint: true },
      { timeMod: 1.15, showCounter: true, showOptimal: true, hint: false },
      { timeMod: 1.0, showCounter: true, showOptimal: false, hint: false },
      { timeMod: 0.9, showCounter: false, showOptimal: false, hint: false },
      { timeMod: 0.8, showCounter: false, showOptimal: false, hint: false },
    ];
    
    variations.forEach((variation, idx) => {
      actions.push({
        diskCount: baseDiskCount,
        timeLimit: Math.floor(baseTimeLimit * variation.timeMod),
        showMoveCounter: variation.showCounter,
        showOptimalMoves: variation.showOptimal,
        hintEnabled: variation.hint,
        difficultyMultiplier: 1 + (level - 1) * 0.08 + idx * 0.05,
        level
      });
    });
  }
  
  return actions;
}

function getHanoiActionKey(action: HanoiAction): string {
  return `hanoi_${action.diskCount}_${action.timeLimit}_${action.hintEnabled ? 1 : 0}_${action.level}`;
}

class TowerOfHanoiBandit {
  private arms: Map<string, HanoiArmStatistics>;
  private actions: HanoiAction[];
  private epsilon: number;
  private minEpsilon: number;
  private decayRate: number;
  private totalPulls: number;
  private userProfile: HanoiUserProfile;
  private learningRate: number;
  private storageKey: string = 'hanoi_bandit_state';
  private recentRewards: number[] = [];

  constructor() {
    this.actions = generateHanoiActionSpace();
    this.arms = new Map();
    this.epsilon = 0.3;
    this.minEpsilon = 0.05;
    this.decayRate = 0.995;
    this.totalPulls = 0;
    this.learningRate = 0.1;
    this.userProfile = {
      preferredDifficulty: 1.0,
      optimalDiskCount: 3,
      bestTimeOfDay: 'afternoon',
      learningRate: 0.1,
      planningSkill: 0.5,
      skillLevel: 1
    };
    this.initializeArms();
    this.loadState();
  }

  private initializeArms(): void {
    this.actions.forEach(action => {
      const key = getHanoiActionKey(action);
      if (!this.arms.has(key)) {
        this.arms.set(key, {
          actionKey: key,
          pulls: 0,
          totalReward: 0,
          averageReward: 0.5,
          lastPulled: 0,
          contextWeights: new Array(12).fill(0)
        });
      }
    });
  }

  selectAction(context: HanoiContext): HanoiAction {
    const validActions = this.getActionsForLevel(context.currentLevel);
    
    if (Math.random() < this.epsilon) {
      const randomIndex = Math.floor(Math.random() * validActions.length);
      return validActions[randomIndex];
    }
    
    return this.selectBestAction(context, validActions);
  }

  private getActionsForLevel(level: number): HanoiAction[] {
    return this.actions.filter(a => a.level === level);
  }

  private selectBestAction(context: HanoiContext, actions: HanoiAction[]): HanoiAction {
    let bestAction = actions[0];
    let bestScore = -Infinity;
    
    actions.forEach(action => {
      const arm = this.arms.get(getHanoiActionKey(action));
      if (!arm) return;
      
      const predictedReward = this.predictReward(context, action, arm);
      const ucbBonus = this.calculateUCBBonus(arm);
      const score = predictedReward + ucbBonus;
      
      if (score > bestScore) {
        bestScore = score;
        bestAction = action;
      }
    });
    
    return bestAction;
  }

  private predictReward(context: HanoiContext, action: HanoiAction, arm: HanoiArmStatistics): number {
    if (arm.pulls === 0) {
      return this.getDefaultPrediction(context, action);
    }
    
    const contextFeatures = this.extractContextFeatures(context);
    let prediction = arm.averageReward;
    
    contextFeatures.forEach((feature, idx) => {
      if (idx < arm.contextWeights.length) {
        prediction += arm.contextWeights[idx] * feature * 0.1;
      }
    });
    
    return Math.max(0, Math.min(1, prediction));
  }

  private getDefaultPrediction(context: HanoiContext, action: HanoiAction): number {
    let score = 0.5;
    
    const diskDiff = Math.abs(action.diskCount - context.preferredDiskCount);
    score -= diskDiff * 0.05;
    
    if (context.recentAccuracy > 0.8 && action.difficultyMultiplier > 1.2) {
      score += 0.1;
    } else if (context.recentAccuracy < 0.5 && action.difficultyMultiplier < 1.0) {
      score += 0.1;
    }
    
    if (context.frustrationLevel > 0.7 && action.hintEnabled) {
      score += 0.1;
    }
    
    return Math.max(0.1, Math.min(0.9, score));
  }

  private calculateUCBBonus(arm: HanoiArmStatistics): number {
    if (arm.pulls === 0) return 1.0;
    return Math.sqrt(2 * Math.log(this.totalPulls + 1) / arm.pulls) * 0.2;
  }

  private extractContextFeatures(context: HanoiContext): number[] {
    return [
      context.currentLevel / 25,
      context.recentAccuracy,
      context.recentSpeed,
      context.avgMoveEfficiency,
      context.frustrationLevel,
      context.engagementLevel,
      context.streakCount / 10,
      context.planningAbility,
      context.timeOfDay === 'morning' ? 1 : 0,
      context.timeOfDay === 'afternoon' ? 1 : 0,
      context.userType === 'speed_focused' ? 1 : 0,
      context.userType === 'accuracy_focused' ? 1 : 0
    ];
  }

  updateModel(
    context: HanoiContext,
    action: HanoiAction,
    reward: number,
    metrics: HanoiPerformanceMetrics
  ): void {
    const key = getHanoiActionKey(action);
    const arm = this.arms.get(key);
    
    if (!arm) return;
    
    arm.pulls += 1;
    arm.totalReward += reward;
    arm.averageReward = arm.totalReward / arm.pulls;
    arm.lastPulled = Date.now();
    
    this.updateWeights(arm, context, reward);
    this.updateUserProfile(context, action, reward, metrics);
    
    this.totalPulls += 1;
    this.epsilon = Math.max(this.minEpsilon, this.epsilon * this.decayRate);
    
    this.recentRewards.push(reward);
    if (this.recentRewards.length > 20) {
      this.recentRewards.shift();
    }
    
    this.saveState();
  }

  private updateWeights(arm: HanoiArmStatistics, context: HanoiContext, reward: number): void {
    const features = this.extractContextFeatures(context);
    const prediction = arm.averageReward;
    const error = reward - prediction;
    
    features.forEach((feature, idx) => {
      if (idx < arm.contextWeights.length) {
        arm.contextWeights[idx] += this.learningRate * error * feature;
        arm.contextWeights[idx] = Math.max(-2, Math.min(2, arm.contextWeights[idx]));
      }
    });
  }

  private updateUserProfile(
    context: HanoiContext,
    action: HanoiAction,
    reward: number,
    metrics: HanoiPerformanceMetrics
  ): void {
    const alpha = 0.2;
    
    if (reward > 0.7) {
      this.userProfile.preferredDifficulty = 
        this.userProfile.preferredDifficulty * (1 - alpha) + action.difficultyMultiplier * alpha;
      this.userProfile.optimalDiskCount = 
        Math.round(this.userProfile.optimalDiskCount * (1 - alpha) + action.diskCount * alpha);
    }
    
    if (metrics.moveEfficiency > 0.8) {
      this.userProfile.planningSkill = Math.min(1, this.userProfile.planningSkill + 0.02);
    } else if (metrics.moveEfficiency < 0.5) {
      this.userProfile.planningSkill = Math.max(0, this.userProfile.planningSkill - 0.01);
    }
    
    const avgRecentReward = this.recentRewards.length > 0
      ? this.recentRewards.reduce((a, b) => a + b, 0) / this.recentRewards.length
      : 0.5;
    
    if (avgRecentReward > 0.7) {
      this.userProfile.skillLevel = Math.min(25, this.userProfile.skillLevel + 0.1);
    } else if (avgRecentReward < 0.4) {
      this.userProfile.skillLevel = Math.max(1, this.userProfile.skillLevel - 0.05);
    }
    
    this.userProfile.bestTimeOfDay = context.timeOfDay;
  }

  calculateReward(metrics: HanoiPerformanceMetrics): number {
    if (!metrics.completed) return 0.1;
    
    const completionReward = 0.3;
    const moveEfficiencyReward = metrics.moveEfficiency * 0.35;
    const timeEfficiencyReward = metrics.timeEfficiency * 0.25;
    const accuracyReward = metrics.accuracy * 0.1;
    
    return Math.min(1, completionReward + moveEfficiencyReward + timeEfficiencyReward + accuracyReward);
  }

  getOptimalLevel(context: HanoiContext): number {
    const currentLevel = context.currentLevel;
    
    if (context.recentAccuracy >= 0.85 && context.recentSpeed >= 0.7) {
      return Math.min(25, currentLevel + 1);
    } else if (context.recentAccuracy < 0.5 || context.frustrationLevel > 0.8) {
      return Math.max(1, currentLevel - 1);
    }
    
    return currentLevel;
  }

  predictNextDifficulty(context: HanoiContext): 'easier' | 'same' | 'harder' {
    const optimalLevel = this.getOptimalLevel(context);
    if (optimalLevel > context.currentLevel) return 'harder';
    if (optimalLevel < context.currentLevel) return 'easier';
    return 'same';
  }

  getPerformanceInsight(context: HanoiContext): string {
    if (context.recentAccuracy >= 0.9 && context.avgMoveEfficiency >= 0.8) {
      return "Excellent planning! Ready for more complex puzzles.";
    } else if (context.recentAccuracy >= 0.7) {
      return "Good progress! Focus on move efficiency.";
    } else if (context.frustrationLevel > 0.6) {
      return "Take your time - planning is key!";
    } else if (context.avgMoveEfficiency < 0.5) {
      return "Try to minimize moves by planning ahead.";
    }
    return "Keep practicing to improve your strategy!";
  }

  getStats() {
    return {
      epsilon: this.epsilon,
      totalPulls: this.totalPulls,
      skillLevel: Math.round(this.userProfile.skillLevel),
      userProfile: this.userProfile
    };
  }

  private saveState(): void {
    try {
      const state = {
        arms: Array.from(this.arms.entries()),
        epsilon: this.epsilon,
        totalPulls: this.totalPulls,
        userProfile: this.userProfile,
        recentRewards: this.recentRewards
      };
      localStorage.setItem(this.storageKey, JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to save Hanoi bandit state:', e);
    }
  }

  private loadState(): void {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const state = JSON.parse(saved);
        this.arms = new Map(state.arms);
        this.epsilon = state.epsilon || 0.3;
        this.totalPulls = state.totalPulls || 0;
        this.userProfile = state.userProfile || this.userProfile;
        this.recentRewards = state.recentRewards || [];
        this.initializeArms();
      }
    } catch (e) {
      console.warn('Failed to load Hanoi bandit state:', e);
    }
  }

  reset(): void {
    this.arms = new Map();
    this.epsilon = 0.3;
    this.totalPulls = 0;
    this.recentRewards = [];
    this.userProfile = {
      preferredDifficulty: 1.0,
      optimalDiskCount: 3,
      bestTimeOfDay: 'afternoon',
      learningRate: 0.1,
      planningSkill: 0.5,
      skillLevel: 1
    };
    this.initializeArms();
    localStorage.removeItem(this.storageKey);
  }
}

export const towerOfHanoiBandit = new TowerOfHanoiBandit();
