// Word Memory Game Epsilon-Greedy Contextual Bandit
// Adapts word count, study time, recall time, and word complexity based on user performance

export interface WordMemoryContext {
  currentLevel: number;
  recentAccuracy: number;
  avgRecallTime: number;
  orderBonusRate: number;
  gamesPlayed: number;
  sessionDuration: number;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  userType: 'quick' | 'methodical' | 'balanced';
  memoryStrength: number;
}

export interface WordMemoryAction {
  level: number;
  wordCount: number;
  studyTime: number;
  recallTime: number;
  wordComplexity: 'simple' | 'medium' | 'complex' | 'advanced';
  showHints: boolean;
}

interface ArmStatistics {
  pulls: number;
  totalReward: number;
  avgReward: number;
  lastReward: number;
  weights: number[];
}

// Generate 25 levels with 5 variations each = 125 unique configurations
const generateActionSpace = (): WordMemoryAction[] => {
  const actions: WordMemoryAction[] = [];
  
  for (let level = 1; level <= 25; level++) {
    const baseWordCount = Math.min(3 + Math.floor(level / 2), 15);
    const baseStudyTime = Math.max(5, 15 - Math.floor(level / 5));
    const baseRecallTime = Math.max(15, 45 - level);
    
    const complexities: Array<'simple' | 'medium' | 'complex' | 'advanced'> = 
      level <= 6 ? ['simple', 'simple', 'medium', 'medium', 'simple'] :
      level <= 12 ? ['simple', 'medium', 'medium', 'complex', 'medium'] :
      level <= 18 ? ['medium', 'medium', 'complex', 'complex', 'advanced'] :
      ['medium', 'complex', 'complex', 'advanced', 'advanced'];
    
    // 5 variations per level
    for (let v = 0; v < 5; v++) {
      actions.push({
        level,
        wordCount: baseWordCount + (v % 3) - 1,
        studyTime: baseStudyTime + (v % 2) * 2,
        recallTime: baseRecallTime + (v % 3) * 5,
        wordComplexity: complexities[v],
        showHints: level <= 3 && v >= 3
      });
    }
  }
  
  return actions;
};

export class WordMemoryBandit {
  private actions: WordMemoryAction[];
  private arms: Map<string, ArmStatistics>;
  private epsilon: number;
  private minEpsilon: number;
  private decayRate: number;
  private learningRate: number;
  private totalPulls: number;
  private currentLevel: number;
  private recentPerformance: Array<{ accuracy: number; orderBonus: number; recallSpeed: number }>;

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
          weights: new Array(10).fill(0).map(() => Math.random() * 0.1)
        });
      }
    }
  }

  private getActionKey(action: WordMemoryAction): string {
    return `wm_l${action.level}_w${action.wordCount}_s${action.studyTime}_r${action.recallTime}_c${action.wordComplexity}`;
  }

  selectAction(context: WordMemoryContext): WordMemoryAction {
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

  private selectBestAction(context: WordMemoryContext, actions: WordMemoryAction[]): WordMemoryAction {
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

  private predictReward(context: WordMemoryContext, action: WordMemoryAction, arm: ArmStatistics): number {
    const features = this.extractFeatures(context, action);
    let prediction = arm.avgReward;
    
    for (let i = 0; i < Math.min(features.length, arm.weights.length); i++) {
      prediction += arm.weights[i] * features[i];
    }
    
    return Math.max(0, Math.min(1, prediction));
  }

  private extractFeatures(context: WordMemoryContext, action: WordMemoryAction): number[] {
    const complexityMap = { 'simple': 0.25, 'medium': 0.5, 'complex': 0.75, 'advanced': 1 };
    
    return [
      context.recentAccuracy,
      context.orderBonusRate,
      context.memoryStrength,
      action.wordCount / 15,
      action.studyTime / 20,
      action.recallTime / 60,
      complexityMap[action.wordComplexity],
      context.gamesPlayed / 100,
      context.timeOfDay === 'morning' ? 1 : context.timeOfDay === 'afternoon' ? 0.8 : 0.6,
      action.level / 25
    ];
  }

  private calculateUCBBonus(arm: ArmStatistics): number {
    if (arm.pulls === 0) return 1;
    return Math.sqrt(2 * Math.log(this.totalPulls + 1) / arm.pulls) * 0.2;
  }

  getOptimalLevel(context: WordMemoryContext): number {
    const recentGames = this.recentPerformance.slice(-5);
    
    if (recentGames.length < 2) {
      return Math.max(1, Math.min(this.currentLevel, 25));
    }
    
    const avgAccuracy = recentGames.reduce((sum, g) => sum + g.accuracy, 0) / recentGames.length;
    const avgOrderBonus = recentGames.reduce((sum, g) => sum + g.orderBonus, 0) / recentGames.length;
    
    let targetLevel = this.currentLevel;
    
    // Only move +1 or -1 level at a time
    if (avgAccuracy >= 0.85 && avgOrderBonus >= 0.5) {
      targetLevel = this.currentLevel + 1;
    } else if (avgAccuracy < 0.5 || (avgAccuracy < 0.6 && avgOrderBonus < 0.2)) {
      targetLevel = this.currentLevel - 1;
    }
    
    return Math.max(1, Math.min(targetLevel, 25));
  }

  updateModel(
    context: WordMemoryContext,
    action: WordMemoryAction,
    reward: number,
    metrics: { accuracy: number; orderBonus: number; recallSpeed: number }
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
    orderBonus: number; 
    recallSpeed: number;
    completion: boolean;
    timeRemaining: number;
  }): number {
    const accuracyReward = metrics.accuracy * 0.4;
    const orderReward = metrics.orderBonus * 0.2;
    const speedReward = Math.min(1, metrics.recallSpeed) * 0.15;
    const completionReward = metrics.completion ? 0.15 : 0;
    const timeReward = (metrics.timeRemaining / 60) * 0.1;
    
    return accuracyReward + orderReward + speedReward + completionReward + timeReward;
  }

  predictNextLevelDifficulty(context: WordMemoryContext): 'easier' | 'same' | 'harder' {
    const recentGames = this.recentPerformance.slice(-5);
    
    if (recentGames.length < 2) return 'same';
    
    const avgAccuracy = recentGames.reduce((sum, g) => sum + g.accuracy, 0) / recentGames.length;
    const avgOrderBonus = recentGames.reduce((sum, g) => sum + g.orderBonus, 0) / recentGames.length;
    
    if (avgAccuracy >= 0.85 && avgOrderBonus >= 0.5) {
      return 'harder';
    } else if (avgAccuracy < 0.5 || (avgAccuracy < 0.6 && avgOrderBonus < 0.2)) {
      return 'easier';
    }
    
    return 'same';
  }

  getPerformanceInsight(context: WordMemoryContext): string {
    const recentGames = this.recentPerformance.slice(-5);
    
    if (recentGames.length < 2) {
      return "Let's see how you perform to personalize your experience!";
    }
    
    const avgAccuracy = recentGames.reduce((sum, g) => sum + g.accuracy, 0) / recentGames.length;
    const avgOrderBonus = recentGames.reduce((sum, g) => sum + g.orderBonus, 0) / recentGames.length;
    
    if (avgAccuracy >= 0.9 && avgOrderBonus >= 0.7) {
      return "🏆 Outstanding memory! You're recalling words in perfect order. Ready for a bigger challenge!";
    } else if (avgAccuracy >= 0.8) {
      return "⭐ Excellent recall! Your memory is sharp. Let's test it with more words!";
    } else if (avgAccuracy >= 0.65) {
      return "💪 Good progress! Focus on the order of words for bonus points.";
    } else if (avgAccuracy >= 0.5) {
      return "📚 Keep practicing! Try creating mental associations between words.";
    } else {
      return "🎯 Let's slow down and focus on fewer words to build your memory strength.";
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
      localStorage.setItem('wordMemoryBandit', JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to save word memory bandit state:', e);
    }
  }

  private loadState(): void {
    try {
      const saved = localStorage.getItem('wordMemoryBandit');
      if (saved) {
        const state = JSON.parse(saved);
        this.arms = new Map(state.arms);
        this.epsilon = state.epsilon || 0.3;
        this.totalPulls = state.totalPulls || 0;
        this.currentLevel = state.currentLevel || 1;
        this.recentPerformance = state.recentPerformance || [];
      }
    } catch (e) {
      console.warn('Failed to load word memory bandit state:', e);
    }
  }

  reset(): void {
    this.arms.clear();
    this.epsilon = 0.3;
    this.totalPulls = 0;
    this.currentLevel = 1;
    this.recentPerformance = [];
    this.initializeArms();
    localStorage.removeItem('wordMemoryBandit');
  }
}

export const wordMemoryBandit = new WordMemoryBandit();
