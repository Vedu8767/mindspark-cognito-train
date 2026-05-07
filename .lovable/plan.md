# Fix Assigned Training Play button & remove Cognitive Age card

## Problem 1 — "Return to Dashboard" 404 when launching assigned game

The patient app is a single-route SPA (`/` → `AppLayout`), and page navigation is internal state (`setCurrentPage`). `AssignedTraining.tsx` instead calls `navigate('/games')`, which doesn't exist as a route → React Router falls through to `NotFound.tsx`, whose CTA reads "Return to Dashboard".

**Fix in `src/components/Dashboard/AssignedTraining.tsx`:**
- Remove `useNavigate` usage.
- For the "Play now" button: just dispatch the existing `startGame` CustomEvent. `AppLayout` already listens globally and renders the matching game from `LAZY_GAMES` (game IDs from the doctor catalog match the LAZY_GAMES keys exactly).
- For the "Browse all games" empty-state button: dispatch a `navigate-page` CustomEvent (or reuse a window event) — simpler approach: just dispatch a custom `app-navigate` event with `'games'` and have `AppLayout` listen and call `setCurrentPage`. Add a small listener in `AppLayout` for `app-navigate` events.

## Problem 2 — Remove Cognitive Age section from patient dashboard

**Fix in `src/pages/Dashboard.tsx`:**
- Remove the `CognitiveAgeCard` import and its usage in the Overview tab.
- Collapse the surrounding 3-column grid so `CognitiveChart` spans full width (`lg:grid-cols-1` or just render `CognitiveChart` directly without the grid wrapper).

The `CognitiveAgeCard.tsx` file itself is left in place (still referenced by AI Insights / reports if applicable — will verify with rg before deleting). If unused elsewhere, leave it untouched to avoid breakage.

## Files changed
- `src/components/Dashboard/AssignedTraining.tsx` — drop `useNavigate`, fire `startGame` directly, fire `app-navigate` for browse button.
- `src/components/Layout/AppLayout.tsx` — add listener for `app-navigate` event → `setCurrentPage(detail)`.
- `src/pages/Dashboard.tsx` — remove `CognitiveAgeCard` import and Overview-tab usage; simplify grid layout.

## Verification
- Click "Play now" on an assigned game → game launches in-place (no 404).
- Empty-state "Browse all games" → switches to Games page in-app.
- Overview tab no longer shows Cognitive Age; `CognitiveChart` fills the row cleanly.
- Other tabs (Progress, Activity, Insights) unchanged.
