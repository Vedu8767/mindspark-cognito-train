// Static catalog of all 12 games offered by the platform.
// Used by the doctor's training-prescription builder.

export interface GameCatalogEntry {
  id: string;
  name: string;
  domain: 'memory' | 'attention' | 'executive' | 'processing';
}

export const AVAILABLE_GAMES: GameCatalogEntry[] = [
  { id: 'memory-matching', name: 'Memory Matching', domain: 'memory' },
  { id: 'word-memory', name: 'Word Memory', domain: 'memory' },
  { id: 'audio-memory', name: 'Audio Memory', domain: 'memory' },
  { id: 'spatial-navigation', name: 'Spatial Navigation', domain: 'memory' },
  { id: 'attention-focus', name: 'Attention Focus', domain: 'attention' },
  { id: 'reaction-speed', name: 'Reaction Speed', domain: 'processing' },
  { id: 'processing-speed', name: 'Processing Speed', domain: 'processing' },
  { id: 'visual-processing', name: 'Visual Processing', domain: 'processing' },
  { id: 'pattern-recognition', name: 'Pattern Recognition', domain: 'executive' },
  { id: 'math-challenge', name: 'Math Challenge', domain: 'executive' },
  { id: 'executive-function', name: 'Executive Function', domain: 'executive' },
  { id: 'tower-of-hanoi', name: 'Tower of Hanoi', domain: 'executive' },
];