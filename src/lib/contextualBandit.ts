export interface Context {
  currentLevel: number;
  recentAccuracy: number;
  recentSpeed: number;
  sessionLength: number;
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  previousDifficulty: number;
  streakCount: number;
  userType: 'speed_focused' | 'accuracy_focused' | 'balanced';
}

export interface GameConfig {
  gridSize: number;
  timeLimit: number;
  symbolCount: number;
  flipDuration: number;
  previewTime: number;
  difficultyMultiplier: number;
}

export interface ActionReward {
  action: GameConfig;
  reward: number;
  context: Context;
  timestamp: number;
}

export class ContextualBandit {
  private actions: GameConfig[] = [];
  private history: ActionReward[] = [];
  private epsilon = 0.1; // Exploration rate
  private learningRate = 0.1;
  private weights: Map<string, number[]> = new Map();

  constructor() {
    this.initializeActions();
    this.loadHistory();
  }

  private initializeActions() {
    // Generate different game configurations for 20+ levels
    for (let level = 1; level <= 25; level++) {
      const baseGridSize = Math.min(4 + Math.floor((level - 1) / 3), 8);
      const timeVariations = [0.8, 1.0, 1.2];
      const speedVariations = [0.8, 1.0, 1.2];

      timeVariations.forEach((timeMod) => {
        speedVariations.forEach((speedMod) => {
          this.actions.push({
            gridSize: baseGridSize,
            timeLimit: Math.floor((60 + level * 10) * timeMod),
            symbolCount: Math.min(Math.floor((baseGridSize * baseGridSize) / 2), 12),
            flipDuration: Math.floor(1000 * speedMod),
            previewTime: Math.max(1000, 3000 - level * 50),
            difficultyMultiplier: 1 + (level - 1) * 0.1
          });
        });
      });
    }
  }

  private contextToFeatures(context: Context): number[] {
    return [
      context.currentLevel / 25,
      context.recentAccuracy,
      context.recentSpeed,
      context.sessionLength / 3600, // Normalize to hours
      context.timeOfDay === 'morning' ? 1 : 0,
      context.timeOfDay === 'afternoon' ? 1 : 0,
      context.timeOfDay === 'evening' ? 1 : 0,
      context.previousDifficulty,
      context.streakCount / 10,
      context.userType === 'speed_focused' ? 1 : 0,
      context.userType === 'accuracy_focused' ? 1 : 0,
      context.userType === 'balanced' ? 1 : 0
    ];
  }

  private getActionKey(action: GameConfig): string {
    return `${action.gridSize}_${action.timeLimit}_${action.symbolCount}_${action.flipDuration}`;
  }

  private predict(context: Context, action: GameConfig): number {
    const key = this.getActionKey(action);
    const weights = this.weights.get(key) || new Array(12).fill(0);
    const features = this.contextToFeatures(context);
    
    return features.reduce((sum, feature, i) => sum + feature * weights[i], 0);
  }

  selectAction(context: Context): GameConfig {
    // Epsilon-greedy exploration
    if (Math.random() < this.epsilon) {
      return this.actions[Math.floor(Math.random() * this.actions.length)];
    }

    // Select best action based on predicted reward
    let bestAction = this.actions[0];
    let bestScore = this.predict(context, bestAction);

    for (const action of this.actions) {
      const score = this.predict(context, action);
      if (score > bestScore) {
        bestScore = score;
        bestAction = action;
      }
    }

    return bestAction;
  }

  updateModel(context: Context, action: GameConfig, reward: number) {
    const key = this.getActionKey(action);
    const weights = this.weights.get(key) || new Array(12).fill(0);
    const features = this.contextToFeatures(context);
    const prediction = this.predict(context, action);
    const error = reward - prediction;

    // Update weights using gradient descent
    for (let i = 0; i < weights.length; i++) {
      weights[i] += this.learningRate * error * features[i];
    }

    this.weights.set(key, weights);
    
    // Store in history
    this.history.push({
      action,
      reward,
      context,
      timestamp: Date.now()
    });

    this.saveHistory();
    
    // Decay epsilon over time
    this.epsilon = Math.max(0.01, this.epsilon * 0.995);
  }

  private calculateReward(performance: {
    completed: boolean;
    accuracy: number;
    timeEfficiency: number;
    engagement: number;
    frustration: number;
  }): number {
    const { completed, accuracy, timeEfficiency, engagement, frustration } = performance;
    
    let reward = 0;
    
    if (completed) reward += 50;
    reward += accuracy * 30;
    reward += timeEfficiency * 20;
    reward += engagement * 15;
    reward -= frustration * 25;
    
    return Math.max(-100, Math.min(100, reward));
  }

  analyzePlaystyle(recentGames: any[]): Context['userType'] {
    if (recentGames.length < 3) return 'balanced';
    
    const avgAccuracy = recentGames.reduce((sum, g) => sum + g.accuracy, 0) / recentGames.length;
    const avgSpeed = recentGames.reduce((sum, g) => sum + g.speed, 0) / recentGames.length;
    
    if (avgSpeed > 0.8 && avgAccuracy < 0.7) return 'speed_focused';
    if (avgAccuracy > 0.8 && avgSpeed < 0.7) return 'accuracy_focused';
    return 'balanced';
  }

  private saveHistory() {
    const recentHistory = this.history.slice(-100); // Keep last 100 games
    localStorage.setItem('memoryGameBanditHistory', JSON.stringify({
      history: recentHistory,
      weights: Array.from(this.weights.entries()),
      epsilon: this.epsilon
    }));
  }

  private loadHistory() {
    try {
      const stored = localStorage.getItem('memoryGameBanditHistory');
      if (stored) {
        const data = JSON.parse(stored);
        this.history = data.history || [];
        this.weights = new Map(data.weights || []);
        this.epsilon = data.epsilon || 0.1;
      }
    } catch (error) {
      console.warn('Failed to load bandit history:', error);
    }
  }

  getOptimalLevel(context: Context): number {
    const recentPerformance = this.history
      .slice(-5)
      .map(h => h.reward)
      .reduce((avg, r, i, arr) => avg + r / arr.length, 0);

    if (recentPerformance > 60) {
      return Math.min(context.currentLevel + 1, 25);
    } else if (recentPerformance < 20) {
      return Math.max(context.currentLevel - 1, 1);
    }
    
    return context.currentLevel;
  }
}

export const memoryGameBandit = new ContextualBandit();