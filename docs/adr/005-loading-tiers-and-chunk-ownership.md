# ADR-005 — Loading tiers and chunk ownership

- **Status:** Accepted — budgets locked in Roadmap P5 and enforced in CI by `scripts/check-budgets.mjs`
- **Date:** 2026-09-26
- **Source:** Roadmap §6.5 and §7, `docs/architecture.md` → Loading tiers

## Context

Classic is the critical, SEO-facing path. Card Mode, Motion, dnd-kit and any 3D must never grow the
critical bundle.

## Decision

- Tiers: **critical** (shell, Classic sections, toggle, store, hash sync) → **preview** (CSS
  skeleton board) → **intent** (rogue chunk: board + cards + dialog, preloaded on toggle
  hover/focus/touchstart) → **interaction** (drag sub-chunk, section panels, expanded-card media)
  → **expensive** (Three.js/R3F, user-triggered only).
- dnd-kit loads as a deferred sub-chunk; merge it into the rogue chunk if measurement shows the
  split is pure overhead.
- ESLint `no-restricted-imports` fences shell/Classic code from statically importing
  `src/features/rogue`; CI enforces byte budgets (Roadmap P5).

## Budgets (Roadmap §7 is the single source; CI: `npm run budgets`)

Critical route First Load JS ≤ P0 baseline + 20 kB gz · rogue chunk ≤ 80 kB gz · drag sub-chunk
≤ 15 kB gz · section panel ≤ 10 kB gz each · Three.js bytes in critical/rogue chunks = 0 (hard).

Since Roadmap P7 the check measures every chunk of a dynamic import's load group (Turbopack splits
the Card Mode load into board, dnd-kit and Motion chunks), not only the chunk holding the board.

## Implementation (Roadmap P5)

`src/features/rogue/preload.ts` is the only Card Mode module the shell may import (ESLint
`no-restricted-imports` fence; the same rule keeps `three`/`@react-three/*` behind
`src/features/rogue/three/`). The toggle warms the chunk on pointerenter/focus/touchstart unless
Save-Data or `prefers-reduced-data` is set. `ModeRoot` renders the loaded board directly
(`RogueBoardSlot`) instead of `next/dynamic`/Suspense, so a switch after the warm-up is instant; a
failed load falls back to Classic. Skeleton and board share a viewport-tall stage so the swap causes
no layout shift.

## Alternatives

- One rogue chunk containing everything.
- Eager preload of all app code.

## Consequences

Some dynamic-import ceremony in exchange for a guaranteed-pure critical path.
