import { UserContext, GameAction } from './types';

// Convert context to numerical feature vector
export function extractContextFeatures(context: UserContext): number[] {
  return [
    // Level and difficulty features
    context.currentLevel / 25,
    context.previousDifficulty,
    
    // Performance features
    context.recentAccuracy,
    context.recentSpeed,
    context.successRate || 0.5,
    
    // Engagement features
    context.streakCount / 10,
    context.engagementLevel || 0.5,
    1 - (context.frustrationLevel || 0),
    
    // Session features
    Math.min(1, context.sessionLength / 3600),
    context.avgMoveTime ? Math.min(1, 2000 / context.avgMoveTime) : 0.5,
    
    // Time features (one-hot encoded)
    context.timeOfDay === 'morning' ? 1 : 0,
    context.timeOfDay === 'afternoon' ? 1 : 0,
    context.timeOfDay === 'evening' ? 1 : 0,
    
    // User type features (one-hot encoded)
    context.userType === 'speed_focused' ? 1 : 0,
    context.userType === 'accuracy_focused' ? 1 : 0,
    context.userType === 'balanced' ? 1 : 0,
    
    // Preference features
    (context.preferredGridSize || 4) / 8,
    (context.dayOfWeek || new Date().getDay()) / 7
  ];
}

// Extract action features for context-action interaction
export function extractActionFeatures(action: GameAction): number[] {
  return [
    action.gridSize / 8,
    action.timeLimit / 180,
    action.symbolCount / 12,
    action.flipDuration / 1500,
    action.previewTime / 3000,
    action.difficultyMultiplier / 3,
    action.hintEnabled ? 1 : 0,
    action.adaptiveTimer ? 1 : 0
  ];
}

// Combine context and action features for prediction
export function getContextActionFeatures(context: UserContext, action: GameAction): number[] {
  const contextFeatures = extractContextFeatures(context);
  const actionFeatures = extractActionFeatures(action);
  
  // Include interaction terms
  const interactions: number[] = [];
  
  // Key interactions
  interactions.push(context.recentAccuracy * (action.gridSize / 8)); // Accuracy vs complexity
  interactions.push(context.recentSpeed * (action.flipDuration / 1500)); // Speed vs flip time
  interactions.push((context.frustrationLevel || 0) * action.difficultyMultiplier); // Frustration vs difficulty
  interactions.push(context.streakCount / 10 * (1 - action.difficultyMultiplier / 3)); // Streak vs challenge
  
  return [...contextFeatures, ...actionFeatures, ...interactions];
}

// Calculate feature dimension
export function getFeatureDimension(): number {
  return 18 + 8 + 4; // context + action + interactions = 30
}
