# Performance baseline

Reference numbers for the Roadmap §7 budgets ("≤ baseline + 20 kB gz" is measured against the
P0 scaffold below). Append new measurements as dated sections; never overwrite earlier ones.

## P0 — empty scaffold (2026-09-26)

Measured on `portfolio_v2` (parent commit `764dcc0`, scaffold uncommitted at measurement time),
local Windows build.

### Versions

| Tool | Version |
|---|---|
| Next.js | 16.3.6 (bundler: Turbopack, the `next build` default) |
| React / React DOM | 19.2.8 |
| TypeScript | 5.9.3 (`strict: true`) |
| Tailwind CSS | 4.3.3 (`@tailwindcss/postcss`) |
| ESLint | 9.39.5 (`eslint-config-next` 16.3.6) |
| Prettier | 3.9.9 |
| Node.js | 22.22.2 local; `engines.node` `>=20.9.0` (Next 16 requirement); `.nvmrc` `22` |
| npm | 10.8.3 |

Scaffolded with `create-next-app@latest --ts --tailwind --eslint --app --src-dir --use-npm`.
No framework version was downgraded.

### Route table (`next build`)

```
Route (app)
┌ ○ /
└ ○ /_not-found
○  (Static)  prerendered as static content
```

Next 16's route table no longer prints First Load JS, so it is computed from the assets referenced
by the prerendered `.next/server/app/index.html` (gzip level 9):

| Asset | Raw | Gzip |
|---|---|---|
| JS, modern browsers (5 chunks, excludes `noModule`) | 442.5 kB | **129.9 kB** |
| JS `noModule` polyfills (legacy browsers only) | 110.0 kB | 38.6 kB |
| CSS (Tailwind) | 7.4 kB | 2.2 kB |
| HTML `/` | 5.8 kB | — |

**Critical-route First Load JS baseline: 129.9 kB gz** (modern browsers). Roadmap §7 target for
P2+: ≤ 149.9 kB gz. Numbers get locked into CI in P5.

### Lighthouse

Lighthouse 13.5.0, headless Chrome, against the local production server (`next build` +
`next start`, commit `3e817f9`) — default mobile throttling and `--preset=desktop`. The Vercel
preview of `3e817f9` deployed successfully; re-run on the deployed URL when comparing against
later deploys, since local numbers exclude CDN/network effects.

| Run | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT | FCP |
|---|---|---|---|---|---|---|---|---|
| Mobile | 100 | 100 | 100 | 100 | 1.9 s | 0 | 20 ms | 0.8 s |
| Desktop | 100 | 100 | 100 | 100 | 0.5 s | 0 | 0 ms | 0.2 s |

## P2 — Classic mode (2026-09-26)

Full Classic page (7 sections, 11 projects, 34 images), local production build on top of
`eef8e7c`, same method as P0.

| Asset (`/`) | Gzip |
|---|---|
| JS, modern browsers (8 chunks) | **140.0 kB** (+10.1 kB vs P0; §7 target ≤ 149.9 kB) |
| CSS | 4.8 kB |
| HTML (all content server-rendered) | 21.9 kB |

No `"use client"` modules in `src/`. The JS growth is framework runtime pulled in by
`next/image` (its client chunk alone is 5.6 kB gz) plus small shared chunks; project gallery images
sit inside closed `<details>` and use native lazy loading.

| Lighthouse 13.5.0 | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT | FCP |
|---|---|---|---|---|---|---|---|---|
| Mobile | 98 | 100 | 100 | 100 | 2.4 s | 0 | 20 ms | 1.0 s |
| Desktop | 100 | 100 | 100 | 100 | 0.6 s | 0 | 0 ms | 0.2 s |

## P3 — Mode system (2026-09-26)

Local production build on top of `15b1554`.

| Asset (`/`) | Gzip |
|---|---|
| JS, modern browsers (8 chunks) | **142.9 kB** (+12.9 kB vs P0; §7 target ≤ 149.9 kB) |
| Card Mode placeholder chunk (not in initial load) | 1.0 kB |

The +2.9 kB over P2 is Zustand, `ModeRoot`, `ModeToggle`, `ClassicSync` and the pre-paint skeleton.
No chunk contains Three.js.

| Lighthouse 13.5.0 | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| Mobile (3 runs) | 97 | 100 | 100 | 100 | 2.6–2.7 s | 0 | 20–60 ms |
| Desktop | 100 | 100 | 100 | 100 | 0.6 s | 0 | 0 ms |

Mobile LCP now sits just above the §7 target (≤ 2.5 s; P2 measured 2.4 s in a single run). The LCP
element is text (the second About paragraph), with FCP at 0.9 s — see
`.context/notebooklm/70-known-issues.md`; investigate in Roadmap P5.

## P4 — Card Mode static experience (2026-09-26)

Local production build on top of `362f65a`.

| Asset | Gzip | Loaded |
|---|---|---|
| Critical JS (`/`, modern browsers) | **143.0 kB** (unchanged vs P3) | first load |
| Card Mode board chunk (board, cards, dialog, shared section bodies, content) | **12.0 kB** (§7 target ≤ 80 kB) | on switching to Card Mode |
| Card Mode CSS | 1.0 kB | with the board chunk |
| ASCII rotation per card (7 chunks) | 0.4–1.3 kB each | when that card opens |

No Motion dependency (every P4 transition is CSS); no Three.js in any chunk. Card faces use the
system monospace stack (0 font bytes).

| Lighthouse 13.5.0 (Classic first load) | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| Mobile | 97 | 100 | 100 | 100 | 2.6 s | 0 | 20 ms |
| Desktop | 100 | 100 | 100 | 100 | 0.6 s | 0 | 0 ms |

Verified in headless Chrome (production build): native modal dialog traps focus and makes the
page inert; Escape animates closing and returns focus to the card; reduced motion closes at once
and shows the ASCII rest frame; a deep link opens its card on load; no horizontal overflow at
390px; no console errors in light or dark schemes.

## P5 — Loading tiers and preload (2026-09-26)

Budgets are now enforced in CI after `next build` (`npm run budgets`, `scripts/check-budgets.mjs`):

| Check | Budget | Measured |
|---|---|---|
| Critical JS (`/`, modern browsers) | ≤ 149.9 kB (P0 + 20 kB) | **142.3 kB** (−0.7 kB vs P4: `next/dynamic` runtime removed) |
| Card Mode chunk | ≤ 80 kB | 11.9 kB, not in the initial load |
| All Card Mode chunks (board + 7 rotations) | ≤ 120 kB | 17.4 kB |
| Three.js bytes, any chunk | 0 | 0 |

Stress checks (headless Chrome, production build):
- Hovering the toggle downloads the Card Mode chunk; the following click shows the board in < 80 ms
  with no skeleton.
- Slow network (800 ms latency, 400 kbps), switch without prior intent: the skeleton shows, the
  board replaces it after ~1.1 s, the toggle stays operable, focus lands on the selected card, and
  **no layout shift** is recorded.
- 20 consecutive toggles: the chunk downloads once, both renderers are never mounted together, and
  `hashchange`/`popstate` listener counts stay constant.

### Mobile LCP investigation (known issue from P3)

Lighthouse's default simulated throttling (Lantern) reported 2.6–2.7 s, but the observed LCP equals
FCP (129 ms unthrottled): the LCP element is About text painted with the first paint. Lantern adds
the critical JS chunks to the LCP dependency graph because they start downloading before the
observed LCP. With applied throttling (`--throttling-method=devtools`, two runs): **FCP 1.7 s,
LCP 1.7 s, performance 99**. Switching Inter to `display: optional` did not change the simulated
number, so the font is not the cause. Re-check on the Vercel preview in P9.

## P6 — Drag enhancement (2026-09-26)

| Check | Budget | Measured |
|---|---|---|
| Critical JS (`/`) | ≤ 149.9 kB | 142.3 kB (unchanged) |
| Card Mode chunk (now includes `@dnd-kit/core`) | ≤ 80 kB | 25.8 kB (+13.9 kB; §7 drag target ≤ 15 kB) |
| All Card Mode chunks | ≤ 120 kB | 31.3 kB |

Drag matrix (headless Chrome, production build): drop on the play zone opens the card and pushes
its hash; release elsewhere returns it (focus stays on the card, no click fires); Escape and a
window resize mid-drag cancel; a 4px wobble still counts as a click; a touch swipe never starts a
drag and a tap opens the card; the live region announces each step; no console errors.

## P7 — Section panels and Motion (2026-09-27)

Local production build on top of `ed58cce`. `scripts/check-budgets.mjs` now sums every chunk of a
dynamic import's load group; the P5/P6 rows measured only the chunk holding the board.

| Check | Budget | Measured |
|---|---|---|
| Critical JS (`/`) | ≤ 149.9 kB | 141.9 kB (unchanged within noise) |
| Card Mode load: board + dnd-kit (20.4 kB), Motion (39.8 kB), shared content/`next/image` (7.2 kB) | ≤ 80 kB | **67.4 kB** |
| Projects / Experience / Contact panel chunk | ≤ 10 kB each | 1.1 / 1.0 / 0.8 kB |
| All Card Mode chunks | ≤ 120 kB | 75.7 kB |
| Three.js bytes, any chunk | 0 | 0 |

Motion (`motion` 13.4, `LazyMotion` + `domMax`) is the whole increase. Measured alternative:
`domAnimation` saves 4.3 kB but drops layout animations; kept `domMax`.

Verified in headless Chrome (production build): each panel loads when its card opens (deep link
and click); opening a relic spans it across the row while siblings slide (layout transforms
present mid-animation); a quest-path project link switches the dialog to Projects with that relic
open and focused; reduced motion renders entrances at full opacity with no layout transforms; no
horizontal overflow at 390px in the dark scheme; no console errors.

## P8 — ASCII relic inspector (2026-09-27)

Local production build on top of `ed58cce` plus the uncommitted P7 work.

| Check | Budget | Measured |
|---|---|---|
| Critical JS (`/`) | ≤ 149.9 kB | 141.9 kB (unchanged) |
| Card Mode load | ≤ 80 kB | 67.0 kB |
| Projects panel chunk (now with the "View relic in 3D" trigger) | ≤ 10 kB | 1.5 kB |
| Relic inspector chunk (runtime renderer), user-triggered | ≤ 5 kB | 2.0 kB |
| All Card Mode chunks | ≤ 120 kB | 77.8 kB |
| Three.js bytes, any chunk | 0 | 0 |

Renderer cost (Node, 44×18 frame): potato 2.7 ms. Headless Chrome, production build:
- The inspector chunk is not requested until "View relic in 3D" is pressed.
- 0 `requestAnimationFrame` calls in 2 s of idle after the intro coast and after interaction;
  0 under reduced motion.
- Drag (30 moves) plus 6 arrow-key turns, worst event duration: 24 ms at 1× CPU, 48 ms at 4×,
  88 ms at 6× (INP target ≤ 200 ms).
- 390px, dark scheme: art 213px wide, no horizontal overflow; no console errors.

## P9 — Hardening (2026-09-27)

Final numbers for the release candidate (details and walkthroughs: `docs/audit-checklist.md`).

| Check | Budget | Measured |
|---|---|---|
| Critical JS (`/`) | ≤ 149.9 kB | 141.9 kB |
| Card Mode load | ≤ 80 kB | 67.0 kB |
| Panels | ≤ 10 kB each | 1.5 / 1.0 / 0.8 kB |
| Relic inspector | ≤ 5 kB | 2.0 kB |
| All Card Mode chunks | ≤ 120 kB | 77.8 kB |
| Three.js bytes | 0 | 0 |

| Lighthouse 13 (Classic first load) | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| Vercel preview, mobile (2 runs) | 99 | 100 | 100 | 66 (preview `noindex`) | 2.1 s | 0 | 10–40 ms |
| Vercel preview, desktop | 100 | 100 | 100 | 66 (preview `noindex`) | 0.5 s | 0 | 0 ms |
| Local production, mobile | 97 | 100 | 100 | 100 | 2.5 s | 0 | 30 ms |

The CDN-served preview meets the §7 mobile LCP target (≤ 2.5 s) that local Lantern runs sat on;
see P5 for why local simulated LCP reads high.

## P9.1 — Battlefield and mobile fan (2026-09-27)

| Check | Budget | Measured |
|---|---|---|
| Critical JS (`/`) | ≤ 149.9 kB | 141.9 kB (unchanged) |
| Card Mode load | ≤ 80 kB | 69.4 kB (+2.4 kB: battlefield, effects, machine) |
| All Card Mode chunks | ≤ 120 kB | 80.1 kB |

Headless Chrome, production build, audit harness re-run (`docs/audit-checklist.md` flows): keyboard
play → effect → dialog → focus restore; touch tap lifts, second tap plays, horizontal swipe does
nothing, swipe up plays; mouse drag onto the bug plays; 20× toggle, idle (0 animation frames),
slow network and 16/16 deep links unchanged; no horizontal overflow at 390 px; no console errors.

## P9.2 — Duel and aiming arrow (2026-09-27)

| Check | Budget | Measured |
|---|---|---|
| Critical JS (`/`) | ≤ 149.9 kB | 141.9 kB (unchanged) |
| Card Mode load | ≤ 80 kB | 70.5 kB (+1.1 kB) |
| All Card Mode chunks | ≤ 120 kB | 81.2 kB |

Headless Chrome: dragging an attack aims at the bug (red arrow, bug framed), a skill at the hero
(teal); drops play and fly from the release point; a tap-lifted card on a 390 px screen shows its
arrow; no horizontal overflow; no console errors.

## P9.3 — Turn system (2026-09-27)

| Check | Budget | Measured |
|---|---|---|
| Critical JS (`/`) | ≤ 149.9 kB | 141.9 kB (unchanged) |
| Card Mode load | ≤ 80 kB | 71.9 kB (+1.4 kB) |

Headless Chrome, a full fight by clicks: Block absorbed 6 of the first attack, the charge raised
the intent to 16, Dodge avoided it, the heal was announced, the bug fell on turn 5 with "Play
again"; no console errors; no horizontal overflow at 390 px.

## P9.4 — Deck (2026-09-27)

| Check | Budget | Measured |
|---|---|---|
| Critical JS (`/`) | ≤ 149.9 kB | 141.9 kB (unchanged) |
| Card Mode load | ≤ 80 kB | 73.0 kB (+1.1 kB) |
| All Card Mode chunks | ≤ 120 kB | 83.7 kB |

Headless Chrome: opening hand of 5 section cards (deck 22); Projects drew 2 project cards (hand 6);
a project card opened `#project-psx-robbery` with its relic expanded and went back into the deck;
no console errors; no horizontal overflow at 390 px.

## P9.5 — Deck pile and draw animation (2026-09-27)

| Check | Budget | Measured |
|---|---|---|
| Critical JS (`/`) | ≤ 149.9 kB | 141.9 kB (unchanged) |
| Card Mode load | ≤ 80 kB | 75.0 kB (+2.0 kB: Motion WAAPI animate, pile, layout slots) |
| All Card Mode chunks | ≤ 120 kB | 85.7 kB |

Headless Chrome (1280 px and 390 px): the opening hand deals from the pile, a draw flies in after a
play and the hand re-spaces; afterwards every card is at opacity 1 with no leftover inline
transform; no console errors; no horizontal overflow.
