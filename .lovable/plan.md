# Fix two GUI glitches

## Problem 1 — Transparent dropdown in "Create Training Plan"

In the screenshot, the **Add Games** dropdown shows through the dialog: game names overlap "Plan Name", "Patient", etc.

**Root cause:** `src/index.css` defines `--popover` only inside the `.dark` block. In light mode (the active theme) the variable is undefined, so `bg-popover` on `SelectContent` resolves to a transparent background. The same applies to `--popover-foreground`, `--card`, `--card-foreground`, and the sidebar tokens — all are missing from `:root`.

**Fix:** Add the missing light-mode tokens to `:root` in `src/index.css`:

```
--popover: 0 0% 100%;
--popover-foreground: 215 25% 15%;
--card: 210 40% 98%;            (already-ish present, ensure declared)
--card-foreground: 215 30% 20%;
--sidebar-background / -foreground / -primary / -accent / -border / -ring
```

This restores an opaque white dropdown panel matching the rest of the light UI. No component changes needed — the existing `bg-popover` class will then render correctly across every Select / Popover / DropdownMenu in the app.

## Problem 2 — Cognitive Age domain bars look "overflowed"

The pink/purple segment past the blue fill in the Domain Ages section isn't an overflow bug — it's the unfilled track color. `Progress` uses `bg-secondary`, which is mapped to soft purple (`265 45% 70%`). At a glance it reads as "the bar exceeds 100%".

**Fix in `src/components/Dashboard/CognitiveAgeCard.tsx`:**
- Pass a neutral track class to the domain `Progress`: `className="h-1.5 bg-muted"` so the unfilled portion is light gray instead of purple.
- Clamp `d.score` to `0–100` defensively when passed to `Progress` (guards against any future >100 values).

No other behavior changes; layout, ages, and trend logic remain identical.

## Files touched
- `src/index.css` — add missing light-mode CSS variables
- `src/components/Dashboard/CognitiveAgeCard.tsx` — neutral track + clamp

## Out of scope
No database, RLS, or data-flow changes. Purely visual fixes.
