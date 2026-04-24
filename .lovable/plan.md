## Plan

### 1. Repair the backend progress path first
Create a database migration to remove the row-level security recursion that is breaking `game_progress` reads/writes.

- Add security-definer helper functions for doctor access checks instead of joining `profiles` inside policies.
- Rewrite the doctor-view policies on:
  - `profiles`
  - `game_progress`
  - `game_sessions`
- Keep patient self-access policies unchanged.

Result: `useGameProgress()` will load the correct saved level for the logged-in user instead of silently falling back to level 1.

### 2. Standardize level completion flow in the remaining broken games
Refactor the affected games so they all use the same progression contract:

- Finish level -> show `LevelCompleteScreen`
- Buttons:
  - Next Level
  - Replay
  - Save & Exit
- No auto-advance
- No hidden fallback “complete” screen that bypasses the level-complete UI
- Next/Replay must fully reinitialize that level’s state

Affected games:
- Reaction Speed
- Visual Processing
- Executive Function
- Word Memory
- Math Challenge
- Spatial Navigation
- Processing Speed
- Audio Memory
- Tower of Hanoi

### 3. Fix each reported gameplay bug

#### Reaction Speed
- Remove the separate `gameState === 'complete'` end screen that currently overrides `LevelCompleteScreen`.
- Keep the game on the level-complete screen until the user chooses what to do.
- Ensure Next Level reinitializes trials and does not get stuck.

#### Visual Processing
- Refactor level initialization so Start Level 1 does not immediately fall into completion.
- Reset `currentTrial`, `timeLeft`, `showTarget`, `responseTimes`, and action state on Next/Replay.
- Ensure Next Level starts a fresh round instead of staying on a dead state.

#### Executive Function
- End the level immediately when the last task is answered.
- Remove the requirement to wait for the timer after tasks are done.
- Fix Save & Exit to use the shared completion flow.

#### Word Memory
- Replace the old custom results screen with `LevelCompleteScreen`.
- End immediately once the recall phase is finished instead of forcing the user to sit through leftover timer time.
- Add Save & Exit and Replay support.
- Guard Enter submission so it only submits valid input and doesn’t create accidental transitions.

#### Math Challenge
- Replace the old custom level-end UI with `LevelCompleteScreen`.
- Add Save & Exit and Replay support.
- Keep the input/answer guards so double-submits cannot skip levels.

#### Spatial Navigation
- Add keyboard arrow-key movement in addition to the on-screen buttons.
- Make sure movement only works during the navigation phase.
- Keep level completion tied to actual target reach, not timer expiration alone.

#### Processing Speed
- Fix Save & Exit to persist level and then return cleanly.
- Ensure Next/Replay reset inputs, current trial, and timer correctly.

#### Audio Memory
- Make the cues easier to understand by showing visible labels/colors for each tone during playback and repeat.
- Keep replay available when the current difficulty allows it.
- Fix Save & Exit and Next Level resets so sequence/game phase do not get stuck.

#### Tower of Hanoi
- Fix Next Level and Save & Exit so they both persist progress and fully rebuild the towers for the next round.
- Keep `LevelCompleteScreen` as the only post-level UI.

### 4. Remove fake stats and mixed user data
Replace the remaining hardcoded/shared data sources that still make the app look fake or cross-user.

- `AppLayout.tsx`
  - Stop recording every finished game as `level: 1`, `duration: 60`, `difficulty: 'Adaptive'`.
  - Pass real session payload from each game: score, level, duration, difficulty, completion state, optional metrics.
- `Games.tsx`
  - Replace hardcoded `lastScore`, `improvement`, and difficulty labels with per-user data from the backend.
  - Show each signed-in user only their own latest session/progress.
- Local fallback keys
  - Namespace fallback/local storage by user id where fallback is still needed so one user never sees another user’s progress on the same device.

### 5. Make progression and score reporting consistent
Unify what each game reports when a level ends.

Each game should produce real values for:
- current level
- completed status
- duration
- score
- difficulty/config used
- optional accuracy / moves / reaction time

This will keep the dashboard, history, achievements, and doctor-facing data correct per user.

## Technical details

### Files to update
- `supabase/migrations/...sql`
- `src/lib/gameProgressService.ts`
- `src/components/Layout/AppLayout.tsx`
- `src/pages/Games.tsx`
- `src/lib/achievements.ts` (or shared history/persistence helpers)
- `src/components/Games/ReactionSpeedGame.tsx`
- `src/components/Games/VisualProcessingGame.tsx`
- `src/components/Games/ExecutiveFunctionGame.tsx`
- `src/components/Games/WordMemoryGame.tsx`
- `src/components/Games/MathChallengeGame.tsx`
- `src/components/Games/SpatialNavigationGame.tsx`
- `src/components/Games/ProcessingSpeedGame.tsx`
- `src/components/Games/AudioMemoryGame.tsx`
- `src/components/Games/TowerOfHanoiGame.tsx`

### Acceptance criteria
- Progress loads from the backend without recursion errors.
- Re-entering a game resumes that user’s saved level.
- One user never sees another user’s scores/history/progress.
- Reaction Speed and Visual Processing no longer end immediately on start.
- Executive Function and Word Memory end as soon as tasks are actually finished.
- Math, Word, Processing, Audio, and Tower all support working Next / Replay / Save & Exit.
- Spatial keyboard arrows work.
- Game cards and session history show real per-user values instead of hardcoded placeholders.