// Visual Processing Game Epsilon-Greedy Contextual Bandit

export interface VisualContext {
  currentLevel: number;
  recentAccuracy: number;
  recentSpeed: number;
  sessionLength: number;
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  streakCount: number;
  avgResponseTime: number;
  shapeRecognitionSpeed: number;
  colorAccuracy: number;
  distractorResistance: number;
}

export interface VisualAction {
  trials: number;
  gridSize: number;
  distractors: number;
  timeLimit: number;
  targetDisplayTime: number;
  shapeComplexity: number;
  colorVariety: number;
  difficultyMultiplier: number;
}

interface ArmStats {
  pulls: number;
  totalReward: number;
  avgReward: number;
}

interface VisualUserProfile {
  preferredGridSize: number;
  optimalTrialCount: number;
  shapeStrength: number;
  colorStrength: number;
  speedLevel: number;
}

// Generate action space for 25 levels with 5 variations each
function generateVisualActionSpace(): VisualAction[] {
  const actions: VisualAction[] = [];
  
  for (let level = 1; level <= 25; level++) {
    const baseTrials = Math.min(8 + Math.floor(level * 0.8), 25);
    const baseGridSize = Math.min(3 + Math.floor(level / 5), 7);
    const baseDistractors = Math.min(5 + level * 2, 35);
    const baseTimeLimit = Math.max(30, 60 - level);
    
    const variations = [
      { trialMod: 0.8, timeMod: 1.3, complexity: 0.7 },
      { trialMod: 0.9, timeMod: 1.15, complexity: 0.85 },
      { trialMod: 1.0, timeMod: 1.0, complexity: 1.0 },
      { trialMod: 1.1, timeMod: 0.9, complexity: 1.15 },
      { trialMod: 1.2, timeMod: 0.8, complexity: 1.3 },
    ];
    
    variations.forEach((v, idx) => {
      actions.push({
        trials: Math.floor(baseTrials * v.trialMod),
        gridSize: baseGridSize,
        distractors: Math.floor(baseDistractors * v.complexity),
        timeLimit: Math.floor(baseTimeLimit * v.timeMod),
        targetDisplayTime: Math.max(1000, 3000 - level * 80),
        shapeComplexity: Math.min(1 + level * 0.1, 3),
        colorVariety: Math.min(3 + Math.floor(level / 4), 6),
        difficultyMultiplier: 1 + (level - 1) * 0.08 + idx * 0.04,
      });
    });
  }
  
  return actions;
}

function getActionKey(action: VisualAction): string {
  return `${action.gridSize}_${action.trials}_${action.distractors}_${action.timeLimit}`;
}

export class VisualProcessingBandit {
  private actions: VisualAction[];
  private arms: Map<string, ArmStats>;
  private epsilon: number;
  private minEpsilon: number;
  private decayRate: number;
  private totalPulls: number;
  private userProfile: VisualUserProfile;
  private storageKey = 'visual_processing_bandit_state';

  constructor() {
    this.actions = generateVisualActionSpace();
    this.arms = new Map();
    this.epsilon = 0.3;
    this.minEpsilon = 0.05;
    this.decayRate = 0.995;
    this.totalPulls = 0;
    this.userProfile = {
      preferredGridSize: 3,
      optimalTrialCount: 10,
      shapeStrength: 0.5,
      colorStrength: 0.5,
      speedLevel: 1,
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

  selectAction(context: VisualContext): VisualAction {
    const levelActions = this.getActionsForLevel(context.currentLevel);
    
    if (Math.random() < this.epsilon) {
      return levelActions[Math.floor(Math.random() * levelActions.length)];
    }
    
    return this.selectBestAction(context, levelActions);
  }

  private getActionsForLevel(level: number): VisualAction[] {
    const targetDifficulty = 1 + (level - 1) * 0.08;
    const tolerance = 0.25;
    
    return this.actions.filter(a => 
      Math.abs(a.difficultyMultiplier - targetDifficulty) <= tolerance
    );
  }

  private selectBestAction(context: VisualContext, actions: VisualAction[]): VisualAction {
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

  private predictReward(context: VisualContext, action: VisualAction, arm?: ArmStats): number {
    if (!arm || arm.pulls < 3) {
      return this.getDefaultPrediction(context, action);
    }
    
    const ucbBonus = Math.sqrt(2 * Math.log(this.totalPulls + 1) / arm.pulls);
    return arm.avgReward + ucbBonus * 0.3;
  }

  private getDefaultPrediction(context: VisualContext, action: VisualAction): number {
    let score = 0.5;
    
    // Match grid size to user preference
    const gridDiff = Math.abs(action.gridSize - this.userProfile.preferredGridSize);
    score -= gridDiff * 0.1;
    
    // Match complexity to skill level
    const skillMatch = 1 - Math.abs(action.shapeComplexity - this.userProfile.shapeStrength * 3);
    score += skillMatch * 0.2;
    
    // Time pressure preference
    if (context.recentSpeed > 0.7 && action.timeLimit < 40) {
      score += 0.1;
    }
    
    return Math.max(0, Math.min(1, score));
  }

  updateModel(
    context: VisualContext,
    action: VisualAction,
    metrics: { accuracy: number; avgResponseTime: number; completed: boolean; timeRemaining: number }
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
    
    this.updateUserProfile(context, action, metrics);
    this.saveState();
  }

  private calculateReward(
    metrics: { accuracy: number; avgResponseTime: number; completed: boolean; timeRemaining: number },
    action: VisualAction
  ): number {
    const accuracyReward = metrics.accuracy * 0.4;
    const speedReward = Math.min(1, 3000 / Math.max(500, metrics.avgResponseTime)) * 0.25;
    const completionReward = metrics.completed ? 0.2 : 0;
    const efficiencyReward = (metrics.timeRemaining / action.timeLimit) * 0.15;
    
    return accuracyReward + speedReward + completionReward + efficiencyReward;
  }

  private updateUserProfile(
    context: VisualContext,
    action: VisualAction,
    metrics: { accuracy: number; avgResponseTime: number }
  ): void {
    const learningRate = 0.1;
    
    if (metrics.accuracy > 0.8) {
      this.userProfile.preferredGridSize = Math.min(7, 
        this.userProfile.preferredGridSize + learningRate);
      this.userProfile.shapeStrength = Math.min(1,
        this.userProfile.shapeStrength + learningRate * 0.5);
    } else if (metrics.accuracy < 0.5) {
      this.userProfile.preferredGridSize = Math.max(3,
        this.userProfile.preferredGridSize - learningRate);
      this.userProfile.shapeStrength = Math.max(0,
        this.userProfile.shapeStrength - learningRate * 0.5);
    }
    
    if (metrics.avgResponseTime < 1500) {
      this.userProfile.speedLevel = Math.min(5,
        this.userProfile.speedLevel + learningRate);
    }
  }

  getOptimalLevel(context: VisualContext): number {
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

  predictNextLevelDifficulty(context: VisualContext): 'easier' | 'same' | 'harder' {
    const optimalLevel = this.getOptimalLevel(context);
    const currentLevel = context.currentLevel;
    
    if (optimalLevel > currentLevel) return 'harder';
    if (optimalLevel < currentLevel) return 'easier';
    return 'same';
  }

  getPerformanceInsight(context: VisualContext): string {
    const { recentAccuracy, recentSpeed } = context;
    
    if (recentAccuracy >= 0.9 && recentSpeed >= 0.8) {
      return "🌟 Outstanding visual processing! Your pattern recognition is exceptional.";
    } else if (recentAccuracy >= 0.8 && recentSpeed >= 0.6) {
      return "👁️ Excellent work! You're quickly identifying targets among distractors.";
    } else if (recentAccuracy >= 0.7) {
      return "🎯 Good accuracy! Focus on scanning the grid more systematically.";
    } else if (recentSpeed >= 0.7) {
      return "⚡ Great speed! Take a moment longer to verify your selections.";
    } else if (recentAccuracy < 0.5) {
      return "🔍 Study the target shape carefully before searching the grid.";
    }
    
    return "💪 Keep practicing! Your visual processing skills are developing.";
  }

  getStats() {
    return {
      epsilon: this.epsilon,
      totalPulls: this.totalPulls,
      skillLevel: this.userProfile.shapeStrength,
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
      console.warn('Failed to save visual processing bandit state');
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
      console.warn('Failed to load visual processing bandit state');
    }
  }

  reset(): void {
    this.arms = new Map();
    this.epsilon = 0.3;
    this.totalPulls = 0;
    this.userProfile = {
      preferredGridSize: 3,
      optimalTrialCount: 10,
      shapeStrength: 0.5,
      colorStrength: 0.5,
      speedLevel: 1,
    };
    this.initializeArms();
    localStorage.removeItem(this.storageKey);
  }
}

export const visualProcessingBandit = new VisualProcessingBandit();
