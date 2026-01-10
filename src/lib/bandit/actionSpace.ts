import { GameAction } from './types';

// Generate comprehensive action space for 25 levels
export function generateActionSpace(): GameAction[] {
  const actions: GameAction[] = [];
  
  for (let level = 1; level <= 25; level++) {
    // Base configurations per level
    const baseGridSize = Math.min(3 + Math.floor(level / 4), 8);
    const baseSymbolCount = Math.min(Math.floor((baseGridSize * baseGridSize) / 2), 12);
    const baseTimeLimit = Math.max(30, 180 - level * 5);
    
    // Difficulty variations for each level
    const variations = [
      { timeMod: 1.2, speedMod: 1.2, hint: true, adaptive: true },   // Easy
      { timeMod: 1.0, speedMod: 1.0, hint: true, adaptive: false },  // Normal with hints
      { timeMod: 1.0, speedMod: 1.0, hint: false, adaptive: true },  // Normal adaptive
      { timeMod: 0.9, speedMod: 0.8, hint: false, adaptive: false }, // Challenge
      { timeMod: 0.8, speedMod: 0.7, hint: false, adaptive: false }, // Hard
    ];
    
    variations.forEach((variation, idx) => {
      actions.push({
        gridSize: baseGridSize,
        timeLimit: Math.floor(baseTimeLimit * variation.timeMod),
        symbolCount: baseSymbolCount,
        flipDuration: Math.floor(1000 * variation.speedMod),
        previewTime: Math.max(500, 3000 - level * 80),
        difficultyMultiplier: 1 + (level - 1) * 0.08 + idx * 0.05,
        hintEnabled: variation.hint,
        adaptiveTimer: variation.adaptive
      });
    });
  }
  
  return actions;
}

// Create action key for indexing
export function getActionKey(action: GameAction): string {
  return `${action.gridSize}_${action.timeLimit}_${action.symbolCount}_${action.flipDuration}_${action.hintEnabled ? 1 : 0}`;
}

// Get actions filtered by level range
export function getActionsForLevel(actions: GameAction[], level: number): GameAction[] {
  const minDifficulty = 1 + (level - 1) * 0.08;
  const maxDifficulty = 1 + level * 0.15;
  
  return actions.filter(a => 
    a.difficultyMultiplier >= minDifficulty && 
    a.difficultyMultiplier <= maxDifficulty
  );
}

// Get most similar action to user preferences
export function findSimilarAction(
  actions: GameAction[], 
  preferredGridSize: number, 
  preferredTime: number
): GameAction {
  let bestMatch = actions[0];
  let minDistance = Infinity;
  
  actions.forEach(action => {
    const gridDist = Math.abs(action.gridSize - preferredGridSize);
    const timeDist = Math.abs(action.timeLimit - preferredTime) / 60;
    const distance = gridDist + timeDist;
    
    if (distance < minDistance) {
      minDistance = distance;
      bestMatch = action;
    }
  });
  
  return bestMatch;
}
