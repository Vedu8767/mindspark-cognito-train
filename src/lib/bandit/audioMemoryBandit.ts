// Audio Memory Epsilon-Greedy Contextual Bandit

export interface AudioContext {
  currentLevel: number;
  recentAccuracy: number;
  recentSpeed: number;
  sessionLength: number;
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  previousDifficulty: number;
  streakCount: number;
  userType: 'speed_focused' | 'accuracy_focused' | 'balanced';
  avgResponseTime: number;
  frustrationLevel: number;
  engagementLevel: number;
  preferredSequenceLength: number;
  successRate: number;
  auditoryMemoryStrength: number;
}

export interface AudioAction {
  sequenceLength: number;
  trialCount: number;
  toneCount: number;
  playbackSpeed: number;
  repeatAllowed: boolean;
  timeLimit: number;
  difficultyMultiplier: number;
  level: number;
}

interface AudioArmStatistics {
  actionKey: string;
  pulls: number;
  totalReward: number;
  averageReward: number;
  lastPulled: number;
  contextWeights: number[];
}

interface AudioUserProfile {
  preferredDifficulty: number;
  optimalSequenceLength: number;
  bestTimeOfDay: 'morning' | 'afternoon' | 'evening';
  learningRate: number;
  auditorySkill: number;
  skillLevel: number;
}

interface AudioPerformanceMetrics {
  completed: boolean;
  accuracy: number;
  timeEfficiency: number;
  correctTrials: number;
  totalTrials: number;
  avgResponseTime: number;
}

// Generate action space for Audio Memory (25 levels × 5 variations = 125 actions)
function generateAudioActionSpace(): AudioAction[] {
  const actions: AudioAction[] = [];
  
  for (let level = 1; level <= 25; level++) {
    const baseSequenceLength = Math.min(3 + Math.floor((level - 1) / 4), 12);
    const baseTrialCount = 4 + Math.floor(level / 3);
    const baseToneCount = Math.min(4 + Math.floor((level - 1) / 6), 8);
    const baseTimeLimit = 60 + level * 10;
    
    const variations = [
      { timeMod: 1.3, speedMod: 0.8, repeat: true, tones: 4 },
      { timeMod: 1.15, speedMod: 0.9, repeat: true, tones: baseToneCount },
      { timeMod: 1.0, speedMod: 1.0, repeat: false, tones: baseToneCount },
      { timeMod: 0.9, speedMod: 1.1, repeat: false, tones: baseToneCount },
      { timeMod: 0.8, speedMod: 1.2, repeat: false, tones: Math.min(baseToneCount + 1, 8) },
    ];
    
    variations.forEach((variation, idx) => {
      actions.push({
        sequenceLength: baseSequenceLength,
        trialCount: baseTrialCount,
        toneCount: variation.tones,
        playbackSpeed: variation.speedMod,
        repeatAllowed: variation.repeat,
        timeLimit: Math.floor(baseTimeLimit * variation.timeMod),
        difficultyMultiplier: 1 + (level - 1) * 0.08 + idx * 0.05,
        level
      });
    });
  }
  
  return actions;
}

function getAudioActionKey(action: AudioAction): string {
  return `audio_${action.sequenceLength}_${action.toneCount}_${action.playbackSpeed}_${action.level}`;
}

class AudioMemoryBandit {
  private arms: Map<string, AudioArmStatistics>;
  private actions: AudioAction[];
  private epsilon: number;
  private minEpsilon: number;
  private decayRate: number;
  private totalPulls: number;
  private userProfile: AudioUserProfile;
  private learningRate: number;
  private storageKey: string = 'audio_bandit_state';
  private recentRewards: number[] = [];

  constructor() {
    this.actions = generateAudioActionSpace();
    this.arms = new Map();
    this.epsilon = 0.3;
    this.minEpsilon = 0.05;
    this.decayRate = 0.995;
    this.totalPulls = 0;
    this.learningRate = 0.1;
    this.userProfile = {
      preferredDifficulty: 1.0,
      optimalSequenceLength: 4,
      bestTimeOfDay: 'afternoon',
      learningRate: 0.1,
      auditorySkill: 0.5,
      skillLevel: 1
    };
    this.initializeArms();
    this.loadState();
  }

  private initializeArms(): void {
    this.actions.forEach(action => {
      const key = getAudioActionKey(action);
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

  selectAction(context: AudioContext): AudioAction {
    const validActions = this.getActionsForLevel(context.currentLevel);
    
    if (Math.random() < this.epsilon) {
      const randomIndex = Math.floor(Math.random() * validActions.length);
      return validActions[randomIndex];
    }
    
    return this.selectBestAction(context, validActions);
  }

  private getActionsForLevel(level: number): AudioAction[] {
    return this.actions.filter(a => a.level === level);
  }

  private selectBestAction(context: AudioContext, actions: AudioAction[]): AudioAction {
    let bestAction = actions[0];
    let bestScore = -Infinity;
    
    actions.forEach(action => {
      const arm = this.arms.get(getAudioActionKey(action));
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

  private predictReward(context: AudioContext, action: AudioAction, arm: AudioArmStatistics): number {
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

  private getDefaultPrediction(context: AudioContext, action: AudioAction): number {
    let score = 0.5;
    
    const seqDiff = Math.abs(action.sequenceLength - context.preferredSequenceLength);
    score -= seqDiff * 0.04;
    
    if (context.recentAccuracy > 0.8 && action.difficultyMultiplier > 1.2) {
      score += 0.1;
    } else if (context.recentAccuracy < 0.5 && action.difficultyMultiplier < 1.0) {
      score += 0.1;
    }
    
    if (context.frustrationLevel > 0.7 && action.repeatAllowed) {
      score += 0.15;
    }
    
    if (context.auditoryMemoryStrength > 0.7 && !action.repeatAllowed) {
      score += 0.05;
    }
    
    return Math.max(0.1, Math.min(0.9, score));
  }

  private calculateUCBBonus(arm: AudioArmStatistics): number {
    if (arm.pulls === 0) return 1.0;
    return Math.sqrt(2 * Math.log(this.totalPulls + 1) / arm.pulls) * 0.2;
  }

  private extractContextFeatures(context: AudioContext): number[] {
    return [
      context.currentLevel / 25,
      context.recentAccuracy,
      context.recentSpeed,
      context.avgResponseTime / 5000,
      context.frustrationLevel,
      context.engagementLevel,
      context.streakCount / 10,
      context.auditoryMemoryStrength,
      context.timeOfDay === 'morning' ? 1 : 0,
      context.timeOfDay === 'afternoon' ? 1 : 0,
      context.userType === 'speed_focused' ? 1 : 0,
      context.userType === 'accuracy_focused' ? 1 : 0
    ];
  }

  updateModel(
    context: AudioContext,
    action: AudioAction,
    reward: number,
    metrics: AudioPerformanceMetrics
  ): void {
    const key = getAudioActionKey(action);
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

  private updateWeights(arm: AudioArmStatistics, context: AudioContext, reward: number): void {
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
    context: AudioContext,
    action: AudioAction,
    reward: number,
    metrics: AudioPerformanceMetrics
  ): void {
    const alpha = 0.2;
    
    if (reward > 0.7) {
      this.userProfile.preferredDifficulty = 
        this.userProfile.preferredDifficulty * (1 - alpha) + action.difficultyMultiplier * alpha;
      this.userProfile.optimalSequenceLength = 
        Math.round(this.userProfile.optimalSequenceLength * (1 - alpha) + action.sequenceLength * alpha);
    }
    
    if (metrics.accuracy > 0.85) {
      this.userProfile.auditorySkill = Math.min(1, this.userProfile.auditorySkill + 0.02);
    } else if (metrics.accuracy < 0.5) {
      this.userProfile.auditorySkill = Math.max(0, this.userProfile.auditorySkill - 0.01);
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

  calculateReward(metrics: AudioPerformanceMetrics): number {
    if (!metrics.completed) return 0.1;
    
    const completionReward = 0.25;
    const accuracyReward = metrics.accuracy * 0.4;
    const timeEfficiencyReward = metrics.timeEfficiency * 0.2;
    const responseSpeedReward = Math.max(0, 1 - metrics.avgResponseTime / 5000) * 0.15;
    
    return Math.min(1, completionReward + accuracyReward + timeEfficiencyReward + responseSpeedReward);
  }

  getOptimalLevel(context: AudioContext): number {
    const currentLevel = context.currentLevel;
    
    if (context.recentAccuracy >= 0.85 && context.recentSpeed >= 0.7) {
      return Math.min(25, currentLevel + 1);
    } else if (context.recentAccuracy < 0.5 || context.frustrationLevel > 0.8) {
      return Math.max(1, currentLevel - 1);
    }
    
    return currentLevel;
  }

  predictNextDifficulty(context: AudioContext): 'easier' | 'same' | 'harder' {
    const optimalLevel = this.getOptimalLevel(context);
    if (optimalLevel > context.currentLevel) return 'harder';
    if (optimalLevel < context.currentLevel) return 'easier';
    return 'same';
  }

  getPerformanceInsight(context: AudioContext): string {
    if (context.recentAccuracy >= 0.9 && context.auditoryMemoryStrength >= 0.8) {
      return "Exceptional auditory memory! Advancing to longer sequences.";
    } else if (context.recentAccuracy >= 0.7) {
      return "Great listening skills! Keep building your memory.";
    } else if (context.frustrationLevel > 0.6) {
      return "Take a breath - focus on the rhythm of tones.";
    } else if (context.auditoryMemoryStrength < 0.5) {
      return "Try visualizing the tones as colors.";
    }
    return "Practice makes perfect - keep training!";
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
      console.warn('Failed to save Audio bandit state:', e);
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
      console.warn('Failed to load Audio bandit state:', e);
    }
  }

  reset(): void {
    this.arms = new Map();
    this.epsilon = 0.3;
    this.totalPulls = 0;
    this.recentRewards = [];
    this.userProfile = {
      preferredDifficulty: 1.0,
      optimalSequenceLength: 4,
      bestTimeOfDay: 'afternoon',
      learningRate: 0.1,
      auditorySkill: 0.5,
      skillLevel: 1
    };
    this.initializeArms();
    localStorage.removeItem(this.storageKey);
  }
}

export const audioMemoryBandit = new AudioMemoryBandit();
