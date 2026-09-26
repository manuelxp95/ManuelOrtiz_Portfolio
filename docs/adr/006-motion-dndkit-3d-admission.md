# ADR-006 — Motion vs dnd-kit responsibility; 3D admission criteria

- **Status:** Accepted — 3D admission numbers **provisional until the Roadmap P8 spike measures
  them**
- **Date:** 2026-09-26
- **Source:** Roadmap §6.6, CLAUDE.md rules 5–6

## Context

Card Mode uses both animation (Motion) and drag (dnd-kit). Without a clear owner for each concern
they fight over transforms. 3D is optional and expensive.

## Decision

- **dnd-kit** owns sensors, gesture recognition and drop semantics (over/accepted/cancelled).
- **Motion** owns every visual transform: lift, drop-zone highlight, snap-back spring, open
  transition.
- **The card state machine** (`card-machine.ts`) is the source of truth; dnd-kit events only
  dispatch machine transitions and components render from machine state.
- Drag is never the only way to open a card — click, keyboard and tap always work.
- 3D is admitted only if: user-triggered, model ≤ 500 kB transfer, no frame drops on mid-range
  mobile, render loop stops when unmounted/offscreen/hidden, zero bytes loaded before the trigger.

## Alternatives

- Motion-only hand-rolled drag — more code, worse accessibility and cancellation handling.
- Auto-loading 3D — breaks the budget.

## Consequences

Two animation-adjacent libraries coexist, kept apart by this ownership rule. The P8 spike records
its measurements here; failing the criteria is an acceptable, documented outcome.
