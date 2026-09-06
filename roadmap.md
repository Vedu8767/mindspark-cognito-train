# Roadmap — RL / Contextual-Bandit Repair (code-repair turn only)

Scope guard: NO new games, no baseline assessment, no caregiver mode, no Patient Guide redesign. Do not reset learned state.

## Findings confirmed from source (ready to act on)
- `epsilonGreedy.ts` + 11 sibling bandits share one skeleton: 125 arms (25 lvl x 5 var), eps 0.3 -> 0.05 (x0.995/pull), linear ctx weights + avgReward blend, UCB tie-break.
- `getOptimalLevel` / `predictNextLevelDifficulty` = threshold heuristics on last-5 rewards; never rank arms. Attention/Spatial/Processing "stay" branch is dead (always +1).
- Arm keys drop action fields (attention, reaction, spatial, processing, pattern, executive) -> distinct variants collide.
- Reward scales: [-100,100] (memory/attention/reaction/spatial/processing), [0,1] (pattern/audio/hanoi/math/word), unclamped (executive/visual). Executive/Visual `updateModel(ctx, action, metrics)` compute reward internally (signature mismatch).
- Math/Word bandits track private `currentLevel` only set inside `updateModel`; `setLevel()` not wired from games.
- `storage.ts bindBanditsToUser`: sync reset + reload, then async backend fetch -> race; a game finishing in the window can upsert empty state over persisted state. Constructor `loadState()` runs at import time with `currentUserId=null`.
- `addGameHistory -> recordGameSession` drops accuracy/reactionTime/moves/metadata (schema already has `accuracy real, reaction_time real, moves int, metadata jsonb`).
- Audit: `user_bandit_states` has mixed `bandit_name` values (class-style vs storage-key), only 8 distinct names for 12 bandits.

## Tasks (in execution order)

### A. Shared infrastructure (do first; everything else depends on it)
- [ ] `src/lib/bandit/reward.ts` (new): documented per-game reward fns, all bounded 0..1, built from accuracy / completion / efficiency / speed as available per game. Single source used both by `updateModel` and stored in session metadata.
- [ ] `src/lib/bandit/policy.ts` (new): shared `MIN_OBS_FOR_EXPLOIT` (e.g. 3 pulls per arm / 10 total), `POLICY_VERSION`, helper to rank candidate arms by learned mean (+ UCB) with explicit `mode: 'cold-start' | 'explore' | 'exploit'` returned alongside the action. Bandits return `{ action, mode }` so UI never labels heuristic output as learned.
- [ ] `storage.ts`: canonical 12 keys (`memory-matching`, `attention-focus`, ... same as LAZY_GAMES ids) + `LEGACY_KEY_ALIASES` map (e.g. `epsilonGreedyBandit`, `attentionBandit`, class names) for backward-compatible reads. Migration on bind: read all rows, coalesce legacy -> canonical (prefer row with most `totalPulls`), upsert canonical, keep legacy rows (do not delete).
- [ ] `storage.ts`: make binding deterministic — `bindBanditsToUser` returns a Promise; expose `banditsReady(userId)`; `saveBanditState` refuses to write while `hydrating` is true or when incoming state has `totalPulls` < persisted `totalPulls` for that key (no empty-over-learned). Use a bind sequence number to drop stale async responses.
- [ ] `AuthContext.tsx`: await/track bind promise; games gate `selectAction` on `banditsReady` (via `useGameProgress.loaded` extension or new `useBanditReady`).
- [ ] Migration (minimal): new table `bandit_decisions` (user_id, game_id, bandit_key, action jsonb, context jsonb, reward real, mode text, policy_version text, session_id uuid null, created_at) with GRANTs + RLS (own rows; doctors read via `is_assigned_patient_user`). Do NOT alter `user_bandit_states` rows destructively.
- [ ] `gameSessionService.ts` / `achievements.ts addGameHistory`: forward accuracy, reactionTime, moves, metadata (selected action, reward, mode, policy_version). Keep localStorage fallback.
- [ ] `AppLayout.handleGameComplete`: pass full payload through; remove numeric-only fallback once all games send objects (keep a typed guard, no `any`).

### B. Bandit classes (apply to all 12)
- [ ] Arm keys include every action dimension (or use a stable variation index `${level}_${variantIdx}`), keep old key compat by re-keying loaded arms on `loadState`.
- [ ] `selectAction` -> `{action, mode}`; exploit ranks learned arms once `MIN_OBS` met; explicit cold-start heuristic named `coldStartPrediction`.
- [ ] `getOptimalLevel`/`predictNextLevelDifficulty`: ±1 strictly; derive from learned arm means of adjacent levels when observations exist, heuristic fallback labelled as such; fix dead "stay" branches (attention/spatial/processing).
- [ ] Unify `updateModel(context, action, reward, metrics)` signature (Executive, Visual).
- [ ] Math/Word: sync `setLevel()` from `useGameProgress` in the game component.
- [ ] `getStats()` exposes `observations`, `mode`, `isWellTrained = totalPulls >= threshold` for AI Lab honesty.

### C. Game components
- [ ] ProcessingSpeed, PatternRecognition, MathChallenge, TowerOfHanoi: send full `GameCompletionPayload` (level, total session duration, difficulty label, accuracy/moves/reactionTime).
- [ ] VisualProcessing, ExecutiveFunction, ReactionSpeed, WordMemory: remove `onComplete: number` + object casts / `any`.
- [ ] AttentionFocus replay: full reset (gameConfig, hits, misses, combo, score, targets). Audit every game's Replay path for equivalent partial resets.
- [ ] PatternRecognition: no speculative level mutation in `handleLevelComplete`; fix accuracy denominator.
- [ ] MemoryMatching: selected `gridSize` must drive rendered grid.
- [ ] ProcessingSpeed `recentSpeed` semantics; MathChallenge uses persisted level.
- [ ] Duration = total session seconds (track `sessionStartRef` across levels), everywhere.
- [ ] AudioMemory: guard sequence playback with mounted ref; ReactionSpeed: clear timeout on unmount.
- [ ] Every game passes the exact selected action object to `updateModel` and logs a decision row.

### D. UI (minimal)
- [ ] `AIInsightsDashboard.tsx`: show "Learning (n observations)" vs "Trained" based on threshold; show real selected difficulty label.
- [ ] `LevelCompleteScreen`: display real selected action summary if not already.

### E. Validation
- [ ] `tsgo --noEmit`, `vite build`.
- [ ] Playwright: play 1 level in 2–3 representative games, confirm `game_sessions` rows have non-null telemetry and `user_bandit_states` uses canonical keys; check `bandit_decisions` rows.
- [ ] Confirm Patient Guide page/route untouched.
