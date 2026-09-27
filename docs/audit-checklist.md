# Audit checklist (Roadmap P9)

Performance and accessibility hardening of the release candidate. Re-run before a release; record
results as a dated section. Automated runs use headless Chrome over CDP against `next build` +
`next start` and the Vercel preview. Manual items are marked **manual**.

## 2026-09-27 — `13b8e4e` + P9 fixes

Preview: `manuel-ortiz-portfolio-pjhc-9ir4c4gb3-manuelxp95s-projects.vercel.app` (commit `13b8e4e`).

### Bundle analysis (`npx next experimental-analyze --output`)

| Load | Chunk contents (analyzer, compressed) | Verdict |
|---|---|---|
| Initial | react-dom client 61.7 kB, Next router/runtime ~62 kB, `next/image` + toggle, store, hash sync ~11 kB, Turbopack runtime 4.8 kB | Framework + shell only |
| Initial, legacy browsers only | `polyfill-nomodule` 38.5 kB | `noModule`, not loaded by modern browsers |
| Card Mode | board, cards, dialog, generic panels + dnd-kit 12.1 kB (23.3 kB); Motion `domMax` (56.8 kB raw analyzer / 39.8 kB gz); shared content (8.3 kB) | Expected; see Motion note |
| Panels | Projects 1.7, Experience 0.9, Contact 0.7 kB | Expected |
| User-triggered | Relic inspector + renderer 2.0 kB | Expected |
| Per-card rotations | 0.7–1.2 kB each | Expected |

Accidental inclusions: none fixable. Motion's `domMax` carries its drag gesture code
(`VisualElementDragControls`, `PanSession`, ~3.6 kB) that the app never uses (dnd-kit owns drag);
Motion exports no layout-only feature bundle and its `exports` map blocks deep imports.

### Lighthouse 13 (Classic first load)

| Target | Performance | Accessibility | Best practices | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| Preview, mobile (2 runs) | 99 | 100 | 100 | 66* | 2.1 s | 0 | 10–40 ms |
| Preview, desktop | 100 | 100 | 100 | 66* | 0.5 s | 0 | 0 ms |
| Local production, mobile | 97 | 100 | 100 | 100 | 2.5 s | 0 | 30 ms |

\* Vercel preview deployments send `x-robots-tag: noindex`; the only failing audit is
`is-crawlable`. Production deployments do not send it (local SEO: 100).

### Keyboard

- [x] Classic tab order: skip link → name → 7 section links → Card Mode toggle → content.
- [x] Skip link moves focus to `<main>` (fixed in P9: `tabIndex={-1}`).
- [x] Every focused element shows a focus ring.
- [x] Toggle by Enter: Card Mode mounts alone, focus on the selected card, section kept.
- [x] Hand: 7 cards in registry order; Enter opens; focus starts on Close; Tab never reaches page
  content behind the modal; Escape closes and returns focus to the card.
- [x] Relic opens with Enter; inspector turns with arrow keys.
- [x] Toggle back: Classic mounts alone, section kept (`#projects`).

### Screen reader

- [x] Accessibility tree: 0 unnamed buttons/links in Classic and in an open card; dialog labelled
  by its title.
- [ ] **manual** NVDA smoke test on Classic and an expanded card (not automatable here).

### Reduced motion

- [x] Cards dealt in place (opacity 1 at once); dialog closes without an animation state; quest
  nodes visible at once; `scroll-behavior: auto`; Classic deep link lands at the section.
- [x] Relic inspector: no intro or flick coast (0 animation frames).

### Touch (390 px, coarse pointer, touch events)

- [x] Play zone hidden; a swipe over a card never starts a drag or opens it.
- [x] Tap opens a card, tap opens a relic, tap opens the 3D view.
- [x] Dragging the relic model turns it without scrolling the dialog.
- [ ] **manual** Pass on a physical phone.

### Stress

- [x] 20 rapid mode toggles: both renderers never mounted together; window listeners identical
  before/after; heap 15.5 → 15.8 MB after GC.
- [x] Idle 10 s: Classic 0 animation frames, Card Mode 0, open card 0 once its one-shot ASCII turn
  has finished.
- [x] Slow network (400 ms, 400 kbps, 4× CPU, cache off): Classic content visible 1.1 s, FCP 1.5 s;
  mode switch shows the skeleton, board after 2.0 s, toggle stays operable.
- [x] Deep links, all 7 sections + `#project-sopa`, in both modes (16/16).
- [x] Deep link keeps its section through the load scroll (fixed in P9, see below).
- [x] No console errors or warnings in any run (fixed in P9, see below).

### Assets

- [x] Images served as WebP by `next/image`; largest optimized variant 64 kB at 1920 w (budget
  ≤ 150 kB). AVIF not enabled: not needed for the budget, slower to encode.
- [x] Inter via `next/font`, latin subset, `display: swap`.
- [x] Favicon set: the scaffold's default `favicon.ico` replaced by `icon.svg` + `apple-icon`
  (monogram in the OG image colors).

### Dependencies and client boundaries

- [x] Every declared dependency is used (`@testing-library/dom` is React Testing Library's peer,
  `jsdom` the test environment).
- [x] `npm ls` lists 6 extraneous wasm packages (`@emnapi/*`, `@img/sharp-wasm32`, …) left in
  `node_modules` by npm; they are not in `package.json` or the lockfile and never ship.
- [x] `"use client"`: 4 modules — `ModeRoot`, `ModeToggle`, `ClassicSync` (shell) and `RogueBoard`
  (Card Mode entry). Redundant directives on `CardDialog` and `AsciiAnimation` removed.

### Fixed in P9

- Classic deep link to a short last section (`#contact`, `#cv`) ended on `#education`: the
  browser's load-time anchor scroll was read as user scrolling. `ClassicSync` now suppresses the
  scroll-spy until that scroll settles (regression test `ClassicSync.test.tsx`).
- Card Mode logged "preloaded but not used" for the About photo: React preloads non-lazy SSR
  images and a stored Card Mode hides Classic. The photo (not the LCP element) is lazy now.
- Skip link left focus on `<body>`; `<main>` is focusable now.
- Scaffold favicon replaced; redundant `"use client"` removed.

### Open (for the corrections round)

- Deep-link loads smooth-scroll from the top (~1 s) because `html { scroll-behavior: smooth }`
  also applies to the initial anchor scroll.
- `preloadSectionPanel` does not honour Save-Data / `prefers-reduced-data` (panels are ~1 kB).
- Manual NVDA and physical-phone passes.

## 2026-09-27 — P9.1 re-run (battlefield, mobile fan)

- [x] Keyboard: Enter plays (effect, then dialog), focus on Close, Escape returns focus without
  scrolling the page; Left/Right move along the hand.
- [x] Touch: first tap lifts the card, second tap plays; horizontal swipe does nothing; swipe up
  plays; relic and 3D inspector unchanged.
- [x] Mouse drag onto the battlefield: drop candidate shown, card plays, dialog opens.
- [x] Reduced motion: no flight or effect; dialog at once; HP still updates.
- [x] Accessibility tree: 0 unnamed controls; live region states each hit and the defeat.
- [x] Stress, idle, slow network, deep links: as in the P9 run.
