---
name: card-interaction-review
description: Review Card Mode UX as a state machine (idle, hovered/focused, selected, expanded, closing/restoring, plus grabbed/dragging and drop candidate for the drag enhancement) across mouse, keyboard and touch, including interruption cases like mode switch mid-interaction, resize, Escape, reduced motion, and direct URL/hash activation. Use after implementing or changing any Card Mode card interaction.
---

# card-interaction-review

Trigger: after implementing or changing a Card Mode card's interaction behavior.

Scope: review only — do not edit files unless explicitly asked to.

## States to check

Canonical states are defined in `docs/architecture.md` → Card interaction states. For each
interactive card, confirm defined, correct behavior at:

- idle
- hovered / focused
- selected (the card matching `activeSection`)
- expanded
- closing / restoring
- grabbed / dragging — drag enhancement (Roadmap P6), desktop pointer only
- drop candidate — drag enhancement

Every non-drag state must be reachable by mouse, keyboard and touch; drag states must always have
a click/keyboard/tap equivalent.

## Input paths to check per state

- mouse (hover, click, drag)
- keyboard (focus, activate, Escape, arrow/tab navigation as applicable)
- touch (tap, swipe where used) — tap-first, not a shrunk desktop-drag interaction

## Interruption cases to check

- mode switched mid-interaction (card was mid-drag/expanded when the user switched to Classic)
- viewport resized while a card is selected/expanded
- Escape pressed while dragging or expanded
- `prefers-reduced-motion` active — does the state machine still work without relying on the
  motion that would normally communicate the transition?
- card activated directly via URL/hash on load (does it open in the correct state without
  requiring the preceding hover/drag steps?)

## Output

List UX/state inconsistencies found, each as: state or transition, what's wrong, which input path
is affected, concrete fix. Not a CSS review — focus on state correctness and reachability.
