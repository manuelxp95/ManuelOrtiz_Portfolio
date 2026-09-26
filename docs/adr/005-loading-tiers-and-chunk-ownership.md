# ADR-005 — Loading tiers and chunk ownership

- **Status:** Accepted — budget numbers **provisional until measured in Roadmap P5**
- **Date:** 2026-09-26
- **Source:** Roadmap §6.5 and §7, `docs/architecture.md` → Loading tiers

## Context

Classic is the critical, SEO-facing path. Card Mode, Motion, dnd-kit and any 3D must never grow the
critical bundle.

## Decision

- Tiers: **critical** (shell, Classic sections, toggle, store, hash sync) → **preview** (CSS
  skeleton board) → **intent** (rogue chunk: board + cards + Motion, preloaded on toggle
  hover/focus/touchstart) → **interaction** (drag sub-chunk, section panels, expanded-card media)
  → **expensive** (Three.js/R3F, user-triggered only).
- dnd-kit loads as a deferred sub-chunk; merge it into the rogue chunk if measurement shows the
  split is pure overhead.
- ESLint `no-restricted-imports` fences shell/Classic code from statically importing
  `src/features/rogue`; CI enforces byte budgets (Roadmap P5).

## Provisional budgets (Roadmap §7 is the single source)

Critical route First Load JS ≤ P0 baseline + 20 kB gz · rogue chunk ≤ 80 kB gz · drag sub-chunk
≤ 15 kB gz · Three.js bytes in critical/rogue chunks = 0 (hard).

## Alternatives

- One rogue chunk containing everything.
- Eager preload of all app code.

## Consequences

Some dynamic-import ceremony in exchange for a guaranteed-pure critical path.
