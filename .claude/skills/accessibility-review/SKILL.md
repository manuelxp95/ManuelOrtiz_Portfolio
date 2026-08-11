---
name: accessibility-review
description: Review interactive portfolio features (both Classic and Card Mode) for keyboard operation, focus management, semantic HTML, drag alternatives, reduced motion, touch behavior, labels, and dialog/modal semantics. Use after implementing any interactive UI, especially Card Mode components. Findings tied to actual components, not generic WCAG citations.
---

# accessibility-review

Trigger: after implementing interactive UI, especially anything in Card Mode (draggable cards,
expand/collapse, custom controls).

Scope: inspection and concrete findings — do not edit files unless explicitly asked to.

## Checklist

- **Keyboard operation**: can every interactive element (card, toggle, drag target) be reached and
  activated with keyboard alone? Is Tab order sensible?
- **Focus**: is focus visible at every step? Does focus move sensibly on card expand/close, mode
  switch, and section navigation? Is focus trapped appropriately in any modal/expanded-card view
  and restored on close?
- **Semantic elements**: are interactive cards real `button`/`link` elements (or have equivalent
  ARIA role + keyboard handling), not bare `div`s with `onClick`?
- **Drag alternatives**: does every draggable interaction have a working click and keyboard
  equivalent, per the non-negotiable rule in `CLAUDE.md`?
- **Reduced motion**: does `prefers-reduced-motion` produce a functionally complete experience, not
  just a less animated one?
- **Touch behavior**: is mobile tap-first, with explicit affordances (not a shrunk desktop-drag
  interaction)?
- **Labels**: do icon-only or card-visual controls have accessible names?
- **Contrast**: does the implementation (not just the design intent) risk contrast issues — e.g.
  themed glow/overlay reducing text contrast below usable levels?
- **Modal/dialog semantics**: does an expanded card or overlay use correct dialog role, focus trap,
  and Escape-to-close?

## Output

For each finding: component/file, what's broken, who it affects (keyboard user / screen reader
user / low-vision user / motor-impaired user / reduced-motion user), and a concrete fix. Skip
WCAG success-criterion numbers unless they clarify the fix.
