// Executive Function Game Epsilon-Greedy Contextual Bandit

export interface ExecutiveContext {
  currentLevel: number;
  recentAccuracy: number;
  recentSpeed: number;
  sessionLength: number;
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  streakCount: number;
  stroopAccuracy: number;
  switchingAccuracy: number;
  inhibitionAccuracy: number;
  updatingAccuracy: number;
  taskSwitchCost: number;
}

export interface ExecutiveAction {
  taskCount: number;
  taskTypes: ('stroop' | 'switching' | 'inhibition' | 'updating')[];
  timeLimit: number;
  switchFrequency: number;
  stroopDifficulty: number;
  inhibitionDifficulty: number;
  difficultyMultiplier: number;
}

interface ArmStats {
  pulls: number;
  totalReward: number;
  avgReward: number;
}

interface ExecutiveUserProfile {
  stroopStrength: number;
  switchingStrength: number;
  inhibitionStrength: number;
  updatingStrength: number;
  overallExecutiveControl: number;
  preferredTaskMix: number;
}

const TASK_TYPES: ('stroop' | 'switching' | 'inhibition' | 'updating')[] = 
  ['stroop', 'switching', 'inhibition', 'updating'];

// Generate action space for 25 levels with 5 variations each
function generateExecutiveActionSpace(): ExecutiveAction[] {
  const actions: ExecutiveAction[] = [];
  
  for (let level = 1; level <= 25; level++) {
    const baseTasks = Math.min(12 + Math.floor(level * 1.2), 40);
    const baseTimeLimit = Math.max(60, 120 - level * 2);
    const numTaskTypes = Math.min(1 + Math.floor(level / 5), 4);
    const taskTypes = TASK_TYPES.slice(0, numTaskTypes);
    
    const variations = [
      { taskMod: 0.8, timeMod: 1.3, switchFreq: 0.2 },
      { taskMod: 0.9, timeMod: 1.15, switchFreq: 0.35 },
      { taskMod: 1.0, timeMod: 1.0, switchFreq: 0.5 },
      { taskMod: 1.1, timeMod: 0.9, switchFreq: 0.65 },
      { taskMod: 1.2, timeMod: 0.8, switchFreq: 0.8 },
    ];
    
    variations.forEach((v, idx) => {
      actions.push({
        taskCount: Math.floor(baseTasks * v.taskMod),
        taskTypes: [...taskTypes],
        timeLimit: Math.floor(baseTimeLimit * v.timeMod),
        switchFrequency: v.switchFreq,
        stroopDifficulty: Math.min(1 + level * 0.1, 3),
        inhibitionDifficulty: Math.min(1 + level * 0.08, 2.5),
        difficultyMultiplier: 1 + (level - 1) * 0.08 + idx * 0.04,
      });
    });
  }
  
  return actions;
}

function getActionKey(action: ExecutiveAction): string {
  return `${action.taskCount}_${action.taskTypes.length}_${action.timeLimit}_${action.switchFrequency.toFixed(2)}`;
}

export class ExecutiveFunctionBandit {
  private actions: ExecutiveAction[];
  private arms: Map<string, ArmStats>;
  private epsilon: number;
  private minEpsilon: number;
  private decayRate: number;
  private totalPulls: number;
  private userProfile: ExecutiveUserProfile;
  private storageKey = 'executive_function_bandit_state';

  constructor() {
    this.actions = generateExecutiveActionSpace();
    this.arms = new Map();
    this.epsilon = 0.3;
    this.minEpsilon = 0.05;
    this.decayRate = 0.995;
    this.totalPulls = 0;
    this.userProfile = {
      stroopStrength: 0.5,
      switchingStrength: 0.5,
      inhibitionStrength: 0.5,
      updatingStrength: 0.5,
      overallExecutiveControl: 0.5,
      preferredTaskMix: 2,
    };
    this.initializeArms();
    this.loadState();
  }

  private initializeArms(): void {
    this.actions.forEach(action => {
      const key = getActionKey(action);
      if (!this.arms.has(key)) {
        this.arms.set(key, { pulls: 0, totalReward: 0, avgReward: 0 });
      }
    });
  }

  selectAction(context: ExecutiveContext): ExecutiveAction {
    const levelActions = this.getActionsForLevel(context.currentLevel);
    
    if (Math.random() < this.epsilon) {
      return levelActions[Math.floor(Math.random() * levelActions.length)];
    }
    
    return this.selectBestAction(context, levelActions);
  }

  private getActionsForLevel(level: number): ExecutiveAction[] {
    const targetDifficulty = 1 + (level - 1) * 0.08;
    const tolerance = 0.25;
    
    return this.actions.filter(a => 
      Math.abs(a.difficultyMultiplier - targetDifficulty) <= tolerance
    );
  }

  private selectBestAction(context: ExecutiveContext, actions: ExecutiveAction[]): ExecutiveAction {
    let bestAction = actions[0];
    let bestScore = -Infinity;
    
    actions.forEach(action => {
      const key = getActionKey(action);
      const arm = this.arms.get(key);
      const score = this.predictReward(context, action, arm);
      
      if (score > bestScore) {
        bestScore = score;
        bestAction = action;
      }
    });
    
    return bestAction;
  }

  private predictReward(context: ExecutiveContext, action: ExecutiveAction, arm?: ArmStats): number {
    if (!arm || arm.pulls < 3) {
      return this.getDefaultPrediction(context, action);
    }
    
    const ucbBonus = Math.sqrt(2 * Math.log(this.totalPulls + 1) / arm.pulls);
    return arm.avgReward + ucbBonus * 0.3;
  }

  private getDefaultPrediction(context: ExecutiveContext, action: ExecutiveAction): number {
    let score = 0.5;
    
    // Match task types to user strengths
    const avgStrength = action.taskTypes.reduce((sum, type) => {
      switch (type) {
        case 'stroop': return sum + this.userProfile.stroopStrength;
        case 'switching': return sum + this.userProfile.switchingStrength;
        case 'inhibition': return sum + this.userProfile.inhibitionStrength;
        case 'updating': return sum + this.userProfile.updatingStrength;
        default: return sum;
      }
    }, 0) / action.taskTypes.length;
    
    score += (avgStrength - 0.5) * 0.3;
    
    // Switch frequency matching
    const switchCostPenalty = context.taskSwitchCost * action.switchFrequency * 0.2;
    score -= switchCostPenalty;
    
    return Math.max(0, Math.min(1, score));
  }

  updateModel(
    context: ExecutiveContext,
    action: ExecutiveAction,
    metrics: {
      accuracy: number;
      avgResponseTime: number;
      completed: boolean;
      timeRemaining: number;
      taskTypeAccuracy: Record<string, number>;
    }
  ): void {
    const reward = this.calculateReward(metrics, action);
    const key = getActionKey(action);
    const arm = this.arms.get(key) || { pulls: 0, totalReward: 0, avgReward: 0 };
    
    arm.pulls++;
    arm.totalReward += reward;
    arm.avgReward = arm.totalReward / arm.pulls;
    this.arms.set(key, arm);
    
    this.totalPulls++;
    this.epsilon = Math.max(this.minEpsilon, this.epsilon * this.decayRate);
    
    this.updateUserProfile(metrics);
    this.saveState();
  }

  private calculateReward(
    metrics: {
      accuracy: number;
      avgResponseTime: number;
      completed: boolean;
      timeRemaining: number;
    },
    action: ExecutiveAction
  ): number {
    const accuracyReward = metrics.accuracy * 0.4;
    const speedReward = Math.min(1, 2000 / Math.max(300, metrics.avgResponseTime)) * 0.25;
    const completionReward = metrics.completed ? 0.2 : 0;
    const efficiencyReward = (metrics.timeRemaining / action.timeLimit) * 0.15;
    
    return accuracyReward + speedReward + completionReward + efficiencyReward;
  }

  private updateUserProfile(
    metrics: { taskTypeAccuracy: Record<string, number> }
  ): void {
    const learningRate = 0.15;
    
    if (metrics.taskTypeAccuracy.stroop !== undefined) {
      this.userProfile.stroopStrength += (metrics.taskTypeAccuracy.stroop - 0.5) * learningRate;
      this.userProfile.stroopStrength = Math.max(0, Math.min(1, this.userProfile.stroopStrength));
    }
    
    if (metrics.taskTypeAccuracy.switching !== undefined) {
      this.userProfile.switchingStrength += (metrics.taskTypeAccuracy.switching - 0.5) * learningRate;
      this.userProfile.switchingStrength = Math.max(0, Math.min(1, this.userProfile.switchingStrength));
    }
    
    if (metrics.taskTypeAccuracy.inhibition !== undefined) {
      this.userProfile.inhibitionStrength += (metrics.taskTypeAccuracy.inhibition - 0.5) * learningRate;
      this.userProfile.inhibitionStrength = Math.max(0, Math.min(1, this.userProfile.inhibitionStrength));
    }
    
    if (metrics.taskTypeAccuracy.updating !== undefined) {
      this.userProfile.updatingStrength += (metrics.taskTypeAccuracy.updating - 0.5) * learningRate;
      this.userProfile.updatingStrength = Math.max(0, Math.min(1, this.userProfile.updatingStrength));
    }
    
    this.userProfile.overallExecutiveControl = (
      this.userProfile.stroopStrength +
      this.userProfile.switchingStrength +
      this.userProfile.inhibitionStrength +
      this.userProfile.updatingStrength
    ) / 4;
  }

  getOptimalLevel(context: ExecutiveContext): number {
    const { recentAccuracy, recentSpeed } = context;
    const currentLevel = context.currentLevel;
    
    // Strict +1/-1 level progression
    if (recentAccuracy >= 0.85 && recentSpeed >= 0.7) {
      return Math.min(25, currentLevel + 1);
    } else if (recentAccuracy < 0.5 || recentSpeed < 0.3) {
      return Math.max(1, currentLevel - 1);
    }
    
    return currentLevel;
  }

  predictNextLevelDifficulty(context: ExecutiveContext): 'easier' | 'same' | 'harder' {
    const optimalLevel = this.getOptimalLevel(context);
    const currentLevel = context.currentLevel;
    
    if (optimalLevel > currentLevel) return 'harder';
    if (optimalLevel < currentLevel) return 'easier';
    return 'same';
  }

  getPerformanceInsight(context: ExecutiveContext): string {
    const { recentAccuracy, recentSpeed, stroopAccuracy, switchingAccuracy } = context;
    
    if (recentAccuracy >= 0.9 && recentSpeed >= 0.8) {
      return "🧠 Exceptional executive control! Your cognitive flexibility is outstanding.";
    } else if (recentAccuracy >= 0.8 && recentSpeed >= 0.6) {
      return "⚡ Excellent performance! You're handling task switches smoothly.";
    } else if (stroopAccuracy < 0.6) {
      return "🎨 Focus on the color, not the word text. The Stroop effect is tricky!";
    } else if (switchingAccuracy < 0.6) {
      return "🔄 Take a moment to read instructions when tasks switch types.";
    } else if (recentAccuracy >= 0.7) {
      return "🎯 Good control! Keep practicing to reduce your switch costs.";
    } else if (recentSpeed >= 0.7) {
      return "⏱️ Great speed! Slow down slightly for better accuracy.";
    }
    
    return "💪 Keep training! Executive function improves with practice.";
  }

  getStats() {
    return {
      epsilon: this.epsilon,
      totalPulls: this.totalPulls,
      skillLevel: this.userProfile.overallExecutiveControl,
      userProfile: this.userProfile,
    };
  }

  private saveState(): void {
    try {
      const state = {
        arms: Array.from(this.arms.entries()),
        epsilon: this.epsilon,
        totalPulls: this.totalPulls,
        userProfile: this.userProfile,
      };
      localStorage.setItem(this.storageKey, JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to save executive function bandit state');
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
      }
    } catch (e) {
      console.warn('Failed to load executive function bandit state');
    }
  }

  reset(): void {
    this.arms = new Map();
    this.epsilon = 0.3;
    this.totalPulls = 0;
    this.userProfile = {
      stroopStrength: 0.5,
      switchingStrength: 0.5,
      inhibitionStrength: 0.5,
      updatingStrength: 0.5,
      overallExecutiveControl: 0.5,
      preferredTaskMix: 2,
    };
    this.initializeArms();
    localStorage.removeItem(this.storageKey);
  }
}

export const executiveFunctionBandit = new ExecutiveFunctionBandit();
