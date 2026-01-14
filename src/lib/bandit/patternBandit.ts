// Pattern Recognition Game - Epsilon-Greedy Contextual Bandit

import { UserContext, GameAction, ArmStatistics, PerformanceMetrics, UserProfile } from './types';

// Pattern-specific context
export interface PatternContext extends UserContext {
  avgPatternTime: number;
  patternTypePreference: 'number' | 'shape' | 'letter' | 'mixed';
  sequenceRecognitionSpeed: number;
}

// Pattern-specific action
export interface PatternAction extends GameAction {
  patternCount: number;
  sequenceLength: number;
  patternTypes: string[];
  optionCount: number;
}

// Generate action space for 25 levels
function generatePatternActionSpace(): PatternAction[] {
  const actions: PatternAction[] = [];
  
  for (let level = 1; level <= 25; level++) {
    const basePatterns = Math.min(5 + Math.floor(level / 3), 15);
    const baseSequenceLength = Math.min(3 + Math.floor(level / 5), 8);
    const baseTimeLimit = Math.max(30, 90 - level * 2);
    
    // Determine pattern types based on level
    const getPatternTypes = (level: number): string[] => {
      if (level <= 5) return ['number'];
      if (level <= 10) return ['number', 'shape'];
      if (level <= 15) return ['number', 'shape', 'letter'];
      return ['number', 'shape', 'letter']; // Mixed patterns
    };
    
    const variations = [
      { timeMod: 1.3, patternMod: 0.8, seqMod: 0.9, options: 3 },   // Easy
      { timeMod: 1.1, patternMod: 0.9, seqMod: 1.0, options: 4 },   // Normal-Easy
      { timeMod: 1.0, patternMod: 1.0, seqMod: 1.0, options: 4 },   // Normal
      { timeMod: 0.9, patternMod: 1.1, seqMod: 1.1, options: 5 },   // Challenge
      { timeMod: 0.8, patternMod: 1.2, seqMod: 1.2, options: 6 },   // Hard
    ];
    
    variations.forEach((variation, idx) => {
      actions.push({
        gridSize: level,
        timeLimit: Math.floor(baseTimeLimit * variation.timeMod),
        symbolCount: basePatterns,
        flipDuration: 1500,
        previewTime: 2000,
        difficultyMultiplier: 1 + (level - 1) * 0.08 + idx * 0.05,
        hintEnabled: idx < 2,
        adaptiveTimer: idx < 3,
        patternCount: Math.floor(basePatterns * variation.patternMod),
        sequenceLength: Math.floor(baseSequenceLength * variation.seqMod),
        patternTypes: getPatternTypes(level),
        optionCount: variation.options
      });
    });
  }
  
  return actions;
}

function getPatternActionKey(action: PatternAction): string {
  return `pattern_${action.gridSize}_${action.patternCount}_${action.sequenceLength}_${action.timeLimit}`;
}

class PatternRecognitionBandit {
  private arms: Map<string, ArmStatistics>;
  private actions: PatternAction[];
  private epsilon: number;
  private totalPulls: number;
  private learningRate: number;
  private userProfile: UserProfile;
  private currentLevel: number;
  private readonly storageKey = 'pattern_bandit_state';

  constructor() {
    this.actions = generatePatternActionSpace();
    this.arms = new Map();
    this.epsilon = 0.3;
    this.totalPulls = 0;
    this.learningRate = 0.1;
    this.currentLevel = 1;
    this.userProfile = {
      preferredDifficulty: 1.0,
      optimalGridSize: 4,
      bestTimeOfDay: 'morning',
      learningRate: 0.1,
      adaptationSpeed: 'medium',
      skillLevel: 1
    };
    this.initializeArms();
    this.loadState();
  }

  private initializeArms(): void {
    this.actions.forEach(action => {
      const key = getPatternActionKey(action);
      if (!this.arms.has(key)) {
        this.arms.set(key, {
          actionKey: key,
          pulls: 0,
          totalReward: 0,
          averageReward: 0.5,
          lastPulled: 0,
          contextWeights: new Array(20).fill(0).map(() => Math.random() * 0.1),
          ucbScore: 1.0
        });
      }
    });
  }

  selectAction(context: PatternContext): PatternAction {
    const levelActions = this.getActionsForCurrentLevel();
    
    if (Math.random() < this.epsilon) {
      // Exploration
      const randomIndex = Math.floor(Math.random() * levelActions.length);
      return levelActions[randomIndex];
    }
    
    // Exploitation
    return this.selectBestAction(context, levelActions);
  }

  private getActionsForCurrentLevel(): PatternAction[] {
    const actionsPerLevel = 5;
    const startIdx = (this.currentLevel - 1) * actionsPerLevel;
    const endIdx = startIdx + actionsPerLevel;
    return this.actions.slice(startIdx, Math.min(endIdx, this.actions.length));
  }

  private selectBestAction(context: PatternContext, actions: PatternAction[]): PatternAction {
    let bestAction = actions[0];
    let bestScore = -Infinity;
    
    actions.forEach(action => {
      const key = getPatternActionKey(action);
      const arm = this.arms.get(key);
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

  private predictReward(context: PatternContext, action: PatternAction, arm?: ArmStatistics): number {
    if (!arm || arm.pulls === 0) {
      return this.getDefaultPrediction(context, action);
    }
    
    const features = this.extractFeatures(context, action);
    let prediction = arm.averageReward;
    
    features.forEach((feature, idx) => {
      if (idx < arm.contextWeights.length) {
        prediction += feature * arm.contextWeights[idx];
      }
    });
    
    return Math.max(0, Math.min(1, prediction));
  }

  private getDefaultPrediction(context: PatternContext, action: PatternAction): number {
    let score = 0.5;
    
    // Prefer longer sequences for high-skill users
    const sequenceFit = 1 - Math.abs(action.sequenceLength - (3 + context.currentLevel * 0.3)) / 5;
    score += sequenceFit * 0.2;
    
    // Pattern count preference
    const patternFit = 1 - Math.abs(action.patternCount - (5 + context.currentLevel * 0.5)) / 10;
    score += patternFit * 0.15;
    
    // Time preference based on accuracy
    if (context.recentAccuracy > 0.8) {
      score += action.timeLimit < 60 ? 0.1 : -0.05;
    }
    
    return Math.max(0, Math.min(1, score));
  }

  private calculateUCBBonus(arm?: ArmStatistics): number {
    if (!arm || arm.pulls === 0) return 1.0;
    return Math.sqrt(2 * Math.log(this.totalPulls + 1) / arm.pulls);
  }

  private extractFeatures(context: PatternContext, action: PatternAction): number[] {
    return [
      context.currentLevel / 25,
      context.recentAccuracy,
      context.recentSpeed,
      context.engagementLevel,
      context.frustrationLevel,
      context.avgPatternTime / 10,
      context.sequenceRecognitionSpeed,
      action.patternCount / 15,
      action.sequenceLength / 8,
      action.timeLimit / 90,
      action.difficultyMultiplier / 3,
      action.optionCount / 6,
      context.streakCount / 10,
      context.sessionLength / 60,
      context.userType === 'accuracy_focused' ? 1 : 0,
      context.userType === 'speed_focused' ? 1 : 0,
      context.patternTypePreference === 'number' ? 1 : 0,
      context.patternTypePreference === 'shape' ? 1 : 0,
      context.patternTypePreference === 'letter' ? 1 : 0,
      this.userProfile.skillLevel / 25
    ];
  }

  updateModel(
    context: PatternContext,
    action: PatternAction,
    reward: number,
    metrics: PerformanceMetrics
  ): void {
    const key = getPatternActionKey(action);
    const arm = this.arms.get(key);
    
    if (arm) {
      arm.pulls++;
      arm.totalReward += reward;
      arm.averageReward = arm.totalReward / arm.pulls;
      arm.lastPulled = Date.now();
      
      this.updateWeights(arm, context, action, reward);
    }
    
    this.totalPulls++;
    this.updateUserProfile(context, action, reward, metrics);
    
    // Decay epsilon
    this.epsilon = Math.max(0.05, this.epsilon * 0.995);
    
    this.saveState();
  }

  private updateWeights(
    arm: ArmStatistics,
    context: PatternContext,
    action: PatternAction,
    reward: number
  ): void {
    const features = this.extractFeatures(context, action);
    const prediction = this.predictReward(context, action, arm);
    const error = reward - prediction;
    
    features.forEach((feature, idx) => {
      if (idx < arm.contextWeights.length) {
        arm.contextWeights[idx] += this.learningRate * error * feature;
        arm.contextWeights[idx] = Math.max(-1, Math.min(1, arm.contextWeights[idx]));
      }
    });
  }

  private updateUserProfile(
    context: PatternContext,
    action: PatternAction,
    reward: number,
    metrics: PerformanceMetrics
  ): void {
    const alpha = 0.1;
    
    if (reward > 0.7) {
      this.userProfile.skillLevel = Math.min(25, this.userProfile.skillLevel + 0.1);
      this.userProfile.preferredDifficulty = 
        (1 - alpha) * this.userProfile.preferredDifficulty + alpha * action.difficultyMultiplier;
    } else if (reward < 0.4) {
      this.userProfile.skillLevel = Math.max(1, this.userProfile.skillLevel - 0.05);
    }
    
    // Adaptation speed
    if (metrics.accuracy > 0.9) {
      this.userProfile.adaptationSpeed = 'fast';
    } else if (metrics.accuracy < 0.5) {
      this.userProfile.adaptationSpeed = 'slow';
    }
  }

  calculateReward(metrics: PerformanceMetrics): number {
    const accuracyWeight = 0.4;
    const speedWeight = 0.25;
    const engagementWeight = 0.2;
    const completionWeight = 0.15;
    
    const accuracyReward = metrics.accuracy;
    const speedReward = Math.max(0, 1 - metrics.avgReactionTime / 10000);
    const engagementReward = metrics.engagement;
    const completionReward = metrics.completed ? 1 : 0.3;
    const frustrationPenalty = metrics.frustration * 0.2;
    
    const reward = 
      accuracyWeight * accuracyReward +
      speedWeight * speedReward +
      engagementWeight * engagementReward +
      completionWeight * completionReward -
      frustrationPenalty;
    
    return Math.max(0, Math.min(1, reward));
  }

  // Strict level progression - only +1 or -1
  getOptimalLevel(context: PatternContext): number {
    const accuracy = context.recentAccuracy;
    const speed = context.recentSpeed;
    const performanceScore = accuracy * 0.6 + speed * 0.4;
    
    let nextLevel = this.currentLevel;
    
    if (performanceScore > 0.75 && accuracy > 0.8) {
      // Good performance - go up 1 level only
      nextLevel = this.currentLevel + 1;
    } else if (performanceScore < 0.4 || accuracy < 0.5) {
      // Poor performance - go down 1 level only
      nextLevel = this.currentLevel - 1;
    }
    // Otherwise stay at current level
    
    return Math.max(1, Math.min(25, nextLevel));
  }

  // Predict next level difficulty
  predictNextLevelDifficulty(metrics: PerformanceMetrics): 'easier' | 'same' | 'harder' {
    const performanceScore = metrics.accuracy * 0.6 + metrics.timeEfficiency * 0.4;
    
    if (performanceScore > 0.75 && metrics.accuracy > 0.8) {
      return 'harder';
    } else if (performanceScore < 0.4 || metrics.accuracy < 0.5) {
      return 'easier';
    }
    return 'same';
  }

  // Get performance insight message
  getPerformanceInsight(metrics: PerformanceMetrics): string {
    const accuracy = metrics.accuracy;
    const speed = metrics.timeEfficiency;
    
    if (accuracy > 0.9 && speed > 0.8) {
      return "🌟 Outstanding! You're mastering patterns with incredible speed!";
    } else if (accuracy > 0.8) {
      return "🎯 Great accuracy! Your pattern recognition is sharp.";
    } else if (speed > 0.8 && accuracy > 0.6) {
      return "⚡ Fast responses! Focus on accuracy for better results.";
    } else if (accuracy > 0.6) {
      return "👍 Good progress! Take your time to analyze sequences.";
    } else if (accuracy < 0.5) {
      return "💪 Keep practicing! Look for repeating elements in patterns.";
    }
    return "📊 Analyzing your pattern recognition style...";
  }

  setLevel(level: number): void {
    this.currentLevel = Math.max(1, Math.min(25, level));
    this.saveState();
  }

  getLevel(): number {
    return this.currentLevel;
  }

  getStats() {
    return {
      epsilon: this.epsilon,
      totalPulls: this.totalPulls,
      skillLevel: this.userProfile.skillLevel,
      userProfile: this.userProfile,
      currentLevel: this.currentLevel
    };
  }

  private saveState(): void {
    const state = {
      arms: Array.from(this.arms.entries()),
      epsilon: this.epsilon,
      totalPulls: this.totalPulls,
      userProfile: this.userProfile,
      currentLevel: this.currentLevel
    };
    localStorage.setItem(this.storageKey, JSON.stringify(state));
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
        this.currentLevel = state.currentLevel || 1;
      }
    } catch (e) {
      console.warn('Failed to load pattern bandit state:', e);
    }
  }

  reset(): void {
    localStorage.removeItem(this.storageKey);
    this.arms.clear();
    this.epsilon = 0.3;
    this.totalPulls = 0;
    this.currentLevel = 1;
    this.userProfile = {
      preferredDifficulty: 1.0,
      optimalGridSize: 4,
      bestTimeOfDay: 'morning',
      learningRate: 0.1,
      adaptationSpeed: 'medium',
      skillLevel: 1
    };
    this.initializeArms();
  }
}

export const patternRecognitionBandit = new PatternRecognitionBandit();
