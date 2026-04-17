

## Problem Analysis

After reviewing the codebase, three concrete issues are causing the broken game experience:

### 1. "Hit Enter ends Level 1 immediately"
Several games (Math Challenge, Word Memory, etc.) have an answer-input field with an Enter-to-submit handler. When the user presses Enter on an empty/zero input, it counts as a wrong answer, the timer or problem index advances, and the level instantly ends because `levelComplete` triggers from a side-effect (e.g. `currentProblem >= problemCount` or `timeLeft === 0` after a stale state). The MemoryMatching `useEffect` on `matches === symbolCount` also fires once on the first match if `symbolCount` was set to `1` for low levels.

### 2. "Game auto-jumps to next level — user has no choice"
In `MemoryMatchingGame.endGame()` (lines 204-216) and most other games, completing a level **automatically** does `setCurrentLevel(currentLevel + 1)` AND **also** calls `onComplete(score)` after a 1-second timeout, which in `AppLayout.handleGameComplete` exits the entire game and returns to the games grid. So the user never gets to choose "Save & Exit", "Replay", or "Next Level".

### 3. "RL says 'next will be harder' randomly"
Two root causes:
- The bandit predictions (`predictNextLevelDifficulty`) ARE based on `metrics.accuracy`, `timeEfficiency`, and history average reward — but the **`PerformanceMetrics` passed in is computed from a single just-finished session** that often has incomplete data (e.g. `timeEfficiency = timeLeft / 120` even if the time limit was 60s, `accuracy = 0` when no moves were recorded).
- The displayed prediction text in some games (e.g. ReactionSpeedGame) uses a default `'harder'` state that never gets updated after the first session because the `nextLevelPrediction` state is set BEFORE the bandit update runs.
- Bandit state is stored in a single global `localStorage` key (`epsilonGreedyBandit`) shared across ALL users on the same device.

### 4. "Resume from where left off" doesn't work
Level state is stored only in browser `localStorage` (e.g. `memoryGameLevel`) and only for MemoryMatching. Other games reset to level 1 every time. Nothing is per-user or persisted in the database.

---

## Proposed Solution

### A. Add a `game_progress` table (per user, per game)
```text
game_progress
├── user_id (FK auth.users)
├── game_id (text)
├── current_level (int, default 1)
├── highest_level (int, default 1)
├── total_sessions (int)
├── last_played_at (timestamptz)
└── UNIQUE(user_id, game_id) + RLS (own + assigned doctors)
```
Replaces all `localStorage.getItem('xxxGameLevel')` with `getProgress(userId, gameId)` / `saveProgress(...)`. New users start at level 1; returning users resume exactly where they left off.

### B. Fix the auto-progression — give the user the choice
In every game's "Level Complete" screen, replace the auto-`onComplete` call (the `setTimeout(() => onComplete(score), 1000)`) with a manual choice screen showing **three buttons**:
1. **Continue to Next Level →** (advances `current_level`, restarts game on new level)
2. **Replay This Level** (re-initializes same level)
3. **Save & Exit** (saves progress to DB, then calls `onComplete` to return to game grid)

The user must click a button — no auto-exit, no auto-advance.

### C. Fix the "hit Enter ends level" bug
For text-input games (MathChallenge, WordMemory, etc.):
- Block submit when input is empty/whitespace
- Block submit while `levelComplete` or `gameComplete` is true
- Add an `isProcessing` ref to debounce double-submits
- Wrap inputs in a `<form onSubmit>` with `e.preventDefault()` so Enter doesn't trigger anything else

For MemoryMatching: ensure `symbolCount >= 2` in the action space, and gate the match-complete `useEffect` on `gameStarted === true`.

### D. Make the RL prediction actually reflect performance
- Compute `PerformanceMetrics` AFTER the session is fully finalized (move the bandit update into a `useEffect` keyed on `gameComplete` so all state is settled).
- Set `nextLevelPrediction` from the bandit's `predictNextLevelDifficulty(metrics)` **after** `updateBandit` runs, and only show it on the level-complete screen — never as a default/random initial value.
- Display a short "why" string from the bandit (e.g. "Accuracy 92% with 30s left → next level will be harder") so the user sees it's data-driven.
- Namespace the bandit `localStorage` key by `user_id` so different users don't share state on the same device.

### E. Apply consistently across all 12 games
The same end-game flow + Enter-key fix + per-user progress table will be wired into each game component via a small shared helper (`useGameProgress(gameId)` hook + a reusable `<LevelCompleteScreen>` component) so the fix is uniform and not copy-pasted.

---

## Files to Change

**New**
- `supabase/migrations/<timestamp>_game_progress.sql` — table + RLS
- `src/lib/gameProgressService.ts` — `getProgress`, `saveProgress`, `incrementLevel`
- `src/hooks/useGameProgress.ts` — React hook for the above
- `src/components/Games/LevelCompleteScreen.tsx` — shared 3-button screen with bandit insight

**Modified (12 game files + bandit)**
- All 12 `src/components/Games/*Game.tsx` — replace auto-progress with `<LevelCompleteScreen>`, fix Enter-key/double-submit guards, use `useGameProgress` instead of localStorage
- `src/lib/bandit/epsilonGreedy.ts` and the 11 sibling bandits — namespace storage key by `user_id`, expose `predictNextLevelDifficulty` based on real last-session metrics
- `src/components/Layout/AppLayout.tsx` — `handleGameComplete` no longer fires on level end, only on explicit "Save & Exit"

---

## What the user will experience after the fix

1. Press Enter on an empty math input → nothing happens (no accidental level-end).
2. Finish a level → see a screen with **Next Level / Replay / Save & Exit** + an AI insight like "92% accuracy, fast solves → next level will be harder".
3. Click **Save & Exit** → leaves to games grid, progress saved.
4. Re-enter the same game tomorrow → resumes at the saved level (per-user, from DB).
5. The "harder/easier/same" prediction always reflects YOUR last-session metrics, never a random default.

