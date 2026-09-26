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

## Implementation (Roadmap P6)

dnd-kit (`@dnd-kit/core` 6.3) with a `MouseSensor` only (8px activation distance): touch keeps
tap-to-open and native scrolling. dnd-kit's own draggable ARIA attributes are not applied (they
would rename the card buttons); its live region announces drag progress. Events only dispatch
`card-machine.ts` transitions (`DRAG_START` / `DRAG_OVER` / `DROP` / `DRAG_CANCEL`); dnd-kit already
cancels on Escape, window resize and tab visibility change. Motion was **not** needed: the lift is
CSS and the snap-back is dnd-kit's built-in drop animation (disabled under reduced motion and on a
successful drop). dnd-kit ships inside the Card Mode chunk (+13.9 kB gz): a separate chunk would
have to wrap the already-mounted cards in its provider once loaded, remounting them and dropping
keyboard focus.

## Alternatives

- Motion-only hand-rolled drag — more code, worse accessibility and cancellation handling.
- Auto-loading 3D — breaks the budget.

## Consequences

Two animation-adjacent libraries coexist, kept apart by this ownership rule. The P8 spike records
its measurements here; failing the criteria is an acceptable, documented outcome.
