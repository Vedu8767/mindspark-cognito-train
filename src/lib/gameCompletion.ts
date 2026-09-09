/**
 * Shared completion contract for all 12 games.
 *
 * Every game reports the *actual* selected level/action it played, the total
 * session duration (summed across levels, not just the last one) and whatever
 * telemetry it genuinely measured. Missing metrics are omitted rather than faked.
 */
export interface GameCompletionPayload {
  /** Raw in-game score (kept for display/history; NOT used for reward). */
  score: number;
  /** The level the bandit actually selected and the game actually applied. */
  level: number;
  /** Total seconds played across the whole session. */
  duration: number;
  completed: boolean;
  /** Human-readable label of the applied action/difficulty. */
  difficulty?: string;
  /** 0..1 share of correct responses. */
  accuracy?: number;
  /** Average reaction time in milliseconds. */
  reactionTime?: number;
  /** Total moves/actions taken, where the game tracks them. */
  moves?: number;
  /** Optional extra bounded telemetry for the reward function. */
  timeEfficiency?: number;
  moveEfficiency?: number;
  consistency?: number;
}

export interface GameComponentProps {
  onComplete: (payload: GameCompletionPayload) => void;
  onExit: () => void;
}
