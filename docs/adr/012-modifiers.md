# ADR-012 — Roguelike modifiers every two rounds (Roadmap P9.7)

- **Status:** Accepted — requested by the project owner (2026-09-27)
- **Date:** 2026-09-27
- **Source:** Owner direction: "every two cycles (player's play → boss's play) three cards come
  up that pause the combat and add a feature; random and cumulative. Proposed: ×0.5 permanent
  damage increase, heal 25% of max HP, +0.1 chance of one more attack, +0.1 critical chance — there
  should be more. Apply a pattern that makes adding modifiers easy." Extends ADR-010 and ADR-011.

## Decision

- **Rhythm:** a round is the hero's turn plus the bug's. When the bug's turn ends on an even round
  (`REWARD_EVERY = 2`), the next turn starts paused on an offer of 3 distinct modifiers, drawn with
  the board's seeded PRNG (the reducer stays pure), weighted by rarity (common 3 : rare 1) and
  skipping modifiers already held `maxStacks` times.
- **Registry pattern** (`src/features/rogue/modifiers.ts`): each modifier is one data entry in
  `modifiers` — name, card text, rarity, optional `maxStacks`, `stats` it adds **per stack** to
  the hero's `HeroStats`, an optional one-off `onPick` (e.g. a heal), and a `badge` for the hero's
  status chips. `ModifierId` is derived from the registry's keys. The fight holds only stack
  counts (`combat.modifiers`); `statsOf(combat)` derives the stats. Adding a modifier over existing
  stats is one entry; a new kind of effect adds one `HeroStats` field and the line of `battle.ts`
  that reads it.
- **Ten modifiers:** Refactor (rare, +0.5× damage), Coffee Break (heal 25% of max HP),
  Multithreading (+10% chance an attack strikes once more, max 5), Edge Case (+10% critical chance,
  criticals ×2, max 5), Rubber Duck (+10% dodge chance, max 5), Unit Tests (+3 Block each turn),
  Linter (thorns 3 when the bug attacks), Garbage Collector (heal 15% of card damage, max 3),
  Scalability (+10 max HP and heal 10), Pair Programming (rare, +1 action per turn, max 1).
- **Rolls:** extra hit, critical and dodge roll the seeded PRNG only when their chance is above 0,
  so a fight without modifiers plays exactly as before. The last hit records `crit`, `extraHit`,
  `healed` and `thorns` for the popups and the live region. Thorns that finish the bug win.
- **The pause never traps:** the offer is a native modal `<dialog>` (focus on the first offer,
  every offer a button, Escape or "Skip" declines). It waits for the board to be idle, never over
  an open card; while it is pending, a played card still opens its section but stays in the hand
  and does nothing to the fight. Focus returns to the hand afterwards.

## Alternatives

- Modifiers as classes or per-modifier hooks into the reducer — more code per modifier and harder
  to test than additive stat data.
- Storing derived stats in the state — stacks are the single source; stats are recomputed.
- Offers without "Skip" — a portfolio must never force a choice to keep browsing.

## Consequences

Card Mode load 77.1 kB gz (+2.1 kB), 2.9 kB under the 80 kB budget. Unit tests cover the offer
rhythm, pick/skip, stacking and each modifier's effect; a component test covers the dialog.
