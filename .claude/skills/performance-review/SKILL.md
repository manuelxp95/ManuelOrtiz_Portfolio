---
name: performance-review
description: Inspect a feature or diff for runtime/bundle/perceived-performance regressions — unnecessary client components, heavy or eager imports, dual-mounted renderers, Three.js/R3F bundle leakage, animation and preloading strategy. Use after implementing a feature and before calling it done, or when a change touches loading/rendering behavior.
---

# performance-review

Trigger: after implementing a feature, or when a change touches imports, rendering, animation, or
loading strategy.

Scope: inspection and concrete findings — do not edit files unless explicitly asked to.

## Checklist

- **Client components**: any `"use client"` that isn't strictly required? Any component that could
  be server-rendered but was made client for convenience?
- **Imports**: any heavy import (Motion, dnd-kit, Three/R3F, icon packs) pulled in statically where
  a dynamic import at the right tier would do?
- **Static vs dynamic**: does each import match its loading tier from `docs/architecture.md`
  (critical/preview/intent/interaction/expensive)?
- **Dual-mounted renderers**: are both Classic and Card Mode ever fully mounted and executing
  runtime behavior at once, rather than one active + a lightweight preview of the other?
- **Three/R3F leakage**: does anything outside `.../rogue/three/` import Three.js or
  `@react-three/fiber`, even transitively? Does the Card Mode root import it merely because a
  nested optional component might use it?
- **Animation strategy**: transform/opacity vs layout-triggering properties; any continuous
  idle-loop animation; timing roughly 150–300ms unless spring-justified; reduced-motion respected.
- **Image/media loading**: `next/image` or equivalent used appropriately; no unoptimized eager
  media loads.
- **Preloading decisions**: is preload intent-based (hover/focus/touchstart on the mode toggle) or
  indiscriminate (everything preloaded regardless of signal)?
- **Dead code**: any unused code shipped as part of this change?

## Output

Differentiate findings by load phase:
- **Initial load** — affects first paint/critical bundle.
- **Alternate-mode load** — affects switching to the non-active mode.
- **Intent preload** — affects hover/focus-triggered prefetch.
- **Interaction-triggered load** — affects expand/filter/media-open behavior.

For each finding: file/line, what's wrong, concrete fix. No generic performance advice without a
tied-to-code finding.
