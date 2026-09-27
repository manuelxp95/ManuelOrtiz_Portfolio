# ADR-007 — ASCII pseudo-3D instead of a Three.js spike (Roadmap P8)

- **Status:** Accepted — decided by the project owner (2026-09-27)
- **Date:** 2026-09-27
- **Source:** Roadmap P8, ADR-006 (3D admission criteria), owner direction to keep the ASCII
  pseudo-3D line

## Context

Roadmap P8 planned an optional go/no-go spike: one small Three.js/React Three Fiber scene on a
game-dev project card, user-triggered, admitted only under ADR-006's criteria. Its default
recommendation was to skip unless a model asset existed; none does (the legacy `.glb` files were
dropped in P0). Card Mode already draws 3D objects as ASCII: a dependency-free SDF raymarcher
renders glyphs and one-turn rotations at build time.

## Decision

- **No-go for Three.js/R3F.** No model asset, ~150 kB gz of JS for one flourish. The ESLint
  fence and the zero-Three.js budget stay in place.
- **Go for ASCII pseudo-3D:** SOPA's relic detail offers "View relic in 3D", an inspector that
  turns a custom SDF model (a potato — the game's stolen treasure) by drag, arrow keys and turn
  buttons. The same raymarcher (`src/features/rogue/ascii/renderer.ts`) now also runs in the
  browser, one frame per input (pointer moves coalesced to one per animation frame).
- Models are registered per project in `RELIC_MODELS` (`ascii/scenes.ts`) with a text
  alternative; adding one is data plus, if needed, a new SDF shape.
- The inspector (`src/features/rogue/inspector/`) is a user-triggered chunk: zero bytes before
  the button is pressed, enforced by `npm run budgets` (≤ 5 kB gz).
- ADR-006's admission criteria, applied to this renderer: user-triggered only; no model transfer
  (the model is code); no frame work while idle — a released flick and the intro coast decay to a
  stop; reduced motion drops both coasts; interaction stays within the INP target under CPU
  throttling.

## Measurements (production build, headless Chrome)

Inspector chunk 2.0 kB gz, not requested before the trigger. Renderer 2.7 ms per 44×18 frame in
Node. Worst event duration while dragging and turning: 24 ms at 1× CPU, 48 ms at 4×, 88 ms at 6×
(INP target ≤ 200 ms). Zero `requestAnimationFrame` calls over 2 s of idle after interaction, and
none under reduced motion.

## Alternatives

- Three.js/R3F spike per the original P8 — no asset, large bundle, the criteria risk.
- Pre-rendered yaw × pitch frame grid — no runtime CPU, but ~10–15 kB gz per model and stepped
  rotation.
- Skip P8 entirely — the roadmap's default; the owner preferred continuing the ASCII line.

## Consequences

`renderer.ts` is no longer build-time only, so its per-frame cost now matters. New shapes must be
benchmarked before registration. `src/features/rogue/three/` stays reserved but empty.
