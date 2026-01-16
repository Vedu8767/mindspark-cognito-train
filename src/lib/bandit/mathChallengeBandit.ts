// Math Challenge Game Epsilon-Greedy Contextual Bandit
// Adapts problem count, operations, number ranges, and time limits based on user performance

export interface MathContext {
  currentLevel: number;
  recentAccuracy: number;
  avgSolveTime: number;
  streakRate: number;
  gamesPlayed: number;
  sessionDuration: number;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  userType: 'quick' | 'methodical' | 'balanced';
  mathStrength: number;
  preferredOperations: string[];
}

export interface MathAction {
  level: number;
  problemCount: number;
  operations: string[];
  maxNumber: number;
  timeLimit: number;
  optionCount: number;
}

interface ArmStatistics {
  pulls: number;
  totalReward: number;
  avgReward: number;
  lastReward: number;
  weights: number[];
}

// Generate 25 levels with 5 variations each = 125 unique configurations
const generateActionSpace = (): MathAction[] => {
  const actions: MathAction[] = [];
  
  for (let level = 1; level <= 25; level++) {
    const baseProblems = Math.min(5 + Math.floor(level / 2), 25);
    const baseTime = Math.max(30, 90 - level * 2);
    const baseMax = Math.min(10 + level * 2, 100);
    
    const operationSets = 
      level <= 5 ? [['add'], ['subtract'], ['add', 'subtract'], ['add'], ['subtract']] :
      level <= 10 ? [['add', 'subtract'], ['multiply'], ['add', 'multiply'], ['subtract', 'multiply'], ['add', 'subtract']] :
      level <= 15 ? [['add', 'subtract', 'multiply'], ['multiply', 'divide'], ['add', 'multiply'], ['subtract', 'divide'], ['add', 'subtract', 'multiply']] :
      level <= 20 ? [['add', 'subtract', 'multiply', 'divide'], ['multiply', 'divide'], ['add', 'subtract', 'multiply', 'divide'], ['multiply', 'divide'], ['add', 'multiply', 'divide']] :
      [['add', 'subtract', 'multiply', 'divide'], ['multiply', 'divide'], ['add', 'subtract', 'multiply', 'divide'], ['multiply', 'divide'], ['add', 'subtract', 'multiply', 'divide']];
    
    // 5 variations per level
    for (let v = 0; v < 5; v++) {
      actions.push({
        level,
        problemCount: baseProblems + (v % 3) - 1,
        operations: operationSets[v],
        maxNumber: baseMax + (v % 3) * 5,
        timeLimit: baseTime + (v % 2) * 10,
        optionCount: level > 15 ? 6 : 4
      });
    }
  }
  
  return actions;
};

export class MathChallengeBandit {
  private actions: MathAction[];
  private arms: Map<string, ArmStatistics>;
  private epsilon: number;
  private minEpsilon: number;
  private decayRate: number;
  private learningRate: number;
  private totalPulls: number;
  private currentLevel: number;
  private recentPerformance: Array<{ accuracy: number; avgSpeed: number; streakMax: number }>;

  constructor() {
    this.actions = generateActionSpace();
    this.arms = new Map();
    this.epsilon = 0.3;
    this.minEpsilon = 0.05;
    this.decayRate = 0.995;
    this.learningRate = 0.15;
    this.totalPulls = 0;
    this.currentLevel = 1;
    this.recentPerformance = [];
    
    this.initializeArms();
    this.loadState();
  }

  private initializeArms(): void {
    for (const action of this.actions) {
      const key = this.getActionKey(action);
      if (!this.arms.has(key)) {
        this.arms.set(key, {
          pulls: 0,
          totalReward: 0,
          avgReward: 0.5,
          lastReward: 0,
          weights: new Array(12).fill(0).map(() => Math.random() * 0.1)
        });
      }
    }
  }

  private getActionKey(action: MathAction): string {
    return `mc_l${action.level}_p${action.problemCount}_m${action.maxNumber}_t${action.timeLimit}_o${action.operations.join('')}`;
  }

  selectAction(context: MathContext): MathAction {
    const optimalLevel = this.getOptimalLevel(context);
    const levelActions = this.actions.filter(a => a.level === optimalLevel);
    
    // Epsilon-greedy: explore vs exploit
    if (Math.random() < this.epsilon) {
      // Explore: random action from current level
      return levelActions[Math.floor(Math.random() * levelActions.length)];
    } else {
      // Exploit: best action from current level
      return this.selectBestAction(context, levelActions);
    }
  }

  private selectBestAction(context: MathContext, actions: MathAction[]): MathAction {
    let bestAction = actions[0];
    let bestScore = -Infinity;

    for (const action of actions) {
      const key = this.getActionKey(action);
      const arm = this.arms.get(key);
      
      if (arm) {
        const predictedReward = this.predictReward(context, action, arm);
        const ucbBonus = this.calculateUCBBonus(arm);
        const score = predictedReward + ucbBonus;
        
        if (score > bestScore) {
          bestScore = score;
          bestAction = action;
        }
      }
    }

    return bestAction;
  }

  private predictReward(context: MathContext, action: MathAction, arm: ArmStatistics): number {
    const features = this.extractFeatures(context, action);
    let prediction = arm.avgReward;
    
    for (let i = 0; i < Math.min(features.length, arm.weights.length); i++) {
      prediction += arm.weights[i] * features[i];
    }
    
    return Math.max(0, Math.min(1, prediction));
  }

  private extractFeatures(context: MathContext, action: MathAction): number[] {
    const operationComplexity = 
      action.operations.includes('divide') ? 1 :
      action.operations.includes('multiply') ? 0.75 :
      action.operations.includes('subtract') ? 0.5 : 0.25;
    
    return [
      context.recentAccuracy,
      context.streakRate,
      context.mathStrength,
      action.problemCount / 25,
      action.maxNumber / 100,
      action.timeLimit / 120,
      operationComplexity,
      action.operations.length / 4,
      context.gamesPlayed / 100,
      context.timeOfDay === 'morning' ? 1 : context.timeOfDay === 'afternoon' ? 0.8 : 0.6,
      action.level / 25,
      context.avgSolveTime / 10
    ];
  }

  private calculateUCBBonus(arm: ArmStatistics): number {
    if (arm.pulls === 0) return 1;
    return Math.sqrt(2 * Math.log(this.totalPulls + 1) / arm.pulls) * 0.2;
  }

  getOptimalLevel(context: MathContext): number {
    const recentGames = this.recentPerformance.slice(-5);
    
    if (recentGames.length < 2) {
      return Math.max(1, Math.min(this.currentLevel, 25));
    }
    
    const avgAccuracy = recentGames.reduce((sum, g) => sum + g.accuracy, 0) / recentGames.length;
    const avgSpeed = recentGames.reduce((sum, g) => sum + g.avgSpeed, 0) / recentGames.length;
    
    let targetLevel = this.currentLevel;
    
    // Only move +1 or -1 level at a time
    if (avgAccuracy >= 0.85 && avgSpeed < 4) {
      targetLevel = this.currentLevel + 1;
    } else if (avgAccuracy < 0.5 || avgSpeed > 8) {
      targetLevel = this.currentLevel - 1;
    }
    
    return Math.max(1, Math.min(targetLevel, 25));
  }

  updateModel(
    context: MathContext,
    action: MathAction,
    reward: number,
    metrics: { accuracy: number; avgSpeed: number; streakMax: number }
  ): void {
    const key = this.getActionKey(action);
    const arm = this.arms.get(key);
    
    if (arm) {
      arm.pulls++;
      arm.totalReward += reward;
      arm.avgReward = arm.totalReward / arm.pulls;
      arm.lastReward = reward;
      
      // Update weights
      const features = this.extractFeatures(context, action);
      const prediction = this.predictReward(context, action, arm);
      const error = reward - prediction;
      
      for (let i = 0; i < arm.weights.length; i++) {
        arm.weights[i] += this.learningRate * error * (features[i] || 0);
      }
    }
    
    this.recentPerformance.push(metrics);
    if (this.recentPerformance.length > 20) {
      this.recentPerformance.shift();
    }
    
    this.currentLevel = action.level;
    this.totalPulls++;
    this.epsilon = Math.max(this.minEpsilon, this.epsilon * this.decayRate);
    
    this.saveState();
  }

  calculateReward(metrics: { 
    accuracy: number; 
    avgSpeed: number; 
    streakMax: number;
    completion: boolean;
    timeRemaining: number;
  }): number {
    const accuracyReward = metrics.accuracy * 0.4;
    const speedReward = Math.max(0, 1 - metrics.avgSpeed / 10) * 0.2;
    const streakReward = Math.min(1, metrics.streakMax / 10) * 0.15;
    const completionReward = metrics.completion ? 0.15 : 0;
    const timeReward = (metrics.timeRemaining / 120) * 0.1;
    
    return accuracyReward + speedReward + streakReward + completionReward + timeReward;
  }

  predictNextLevelDifficulty(context: MathContext): 'easier' | 'same' | 'harder' {
    const recentGames = this.recentPerformance.slice(-5);
    
    if (recentGames.length < 2) return 'same';
    
    const avgAccuracy = recentGames.reduce((sum, g) => sum + g.accuracy, 0) / recentGames.length;
    const avgSpeed = recentGames.reduce((sum, g) => sum + g.avgSpeed, 0) / recentGames.length;
    
    if (avgAccuracy >= 0.85 && avgSpeed < 4) {
      return 'harder';
    } else if (avgAccuracy < 0.5 || avgSpeed > 8) {
      return 'easier';
    }
    
    return 'same';
  }

  getPerformanceInsight(context: MathContext): string {
    const recentGames = this.recentPerformance.slice(-5);
    
    if (recentGames.length < 2) {
      return "Let's see how you perform to personalize your experience!";
    }
    
    const avgAccuracy = recentGames.reduce((sum, g) => sum + g.accuracy, 0) / recentGames.length;
    const avgSpeed = recentGames.reduce((sum, g) => sum + g.avgSpeed, 0) / recentGames.length;
    
    if (avgAccuracy >= 0.9 && avgSpeed < 3) {
      return "🏆 Lightning-fast math genius! Your mental calculations are exceptional!";
    } else if (avgAccuracy >= 0.8 && avgSpeed < 5) {
      return "⭐ Excellent math skills! You're solving problems quickly and accurately!";
    } else if (avgAccuracy >= 0.7) {
      return "💪 Good progress! Focus on speed while maintaining accuracy.";
    } else if (avgAccuracy >= 0.5) {
      return "📐 Keep practicing! Take a moment to double-check your calculations.";
    } else {
      return "🎯 Let's slow down with simpler problems to build your math confidence.";
    }
  }

  getStats(): { epsilon: number; totalPulls: number; currentLevel: number } {
    return {
      epsilon: this.epsilon,
      totalPulls: this.totalPulls,
      currentLevel: this.currentLevel
    };
  }

  private saveState(): void {
    try {
      const state = {
        arms: Array.from(this.arms.entries()),
        epsilon: this.epsilon,
        totalPulls: this.totalPulls,
        currentLevel: this.currentLevel,
        recentPerformance: this.recentPerformance
      };
      localStorage.setItem('mathChallengeBandit', JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to save math challenge bandit state:', e);
    }
  }

  private loadState(): void {
    try {
      const saved = localStorage.getItem('mathChallengeBandit');
      if (saved) {
        const state = JSON.parse(saved);
        this.arms = new Map(state.arms);
        this.epsilon = state.epsilon || 0.3;
        this.totalPulls = state.totalPulls || 0;
        this.currentLevel = state.currentLevel || 1;
        this.recentPerformance = state.recentPerformance || [];
      }
    } catch (e) {
      console.warn('Failed to load math challenge bandit state:', e);
    }
  }

  reset(): void {
    this.arms.clear();
    this.epsilon = 0.3;
    this.totalPulls = 0;
    this.currentLevel = 1;
    this.recentPerformance = [];
    this.initializeArms();
    localStorage.removeItem('mathChallengeBandit');
  }
}

export const mathChallengeBandit = new MathChallengeBandit();
