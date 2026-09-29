# Manuel Ortiz Portfolio — Technical Decisions

> Project-memory document. **Hand-maintained** — `generate-context.py` never overwrites this file.
> Append new decisions at the end; do not rewrite history.
> Authority order: Git working tree > CLAUDE.md > docs/ > this document.

Only record decisions actually supported by the repository, project documentation, or an explicit
statement from the project owner. Do not invent history. Where a decision is *inferred* from the
repository rather than stated, say so in its `Status` line. Formal ADRs belong in `docs/adr/`
(mirrored into `10-architecture.md`); this file is the running log.

Format for each entry:

```markdown
## Decision: <title>

Status: Accepted | Proposed | Superseded by <title> | Inferred from repository
Date: YYYY-MM-DD
Source: <where this is stated>
Context:
Decision:
Consequences:
```

---

## Decision: Fresh scaffold on `portfolio_v2`, legacy site frozen on `master`

Status: Accepted (stated by the project owner)
Date: 2026-08-11 (commit `d008e03`, "Create Roadmap.md")
Source: `docs/Roadmap.md` → Context → "User decisions already made (do not re-litigate)"
Context: The legacy site is Next 12 / Pages Router / JS / Chakra UI. `docs/architecture.md`
describes an incremental in-place migration.
Decision: Rebuild on branch `portfolio_v2`, replacing the root app. The old site stays deployable
from `master`. Old code is content/reference, not a structural constraint.
Consequences: Supersedes the "incremental, not a rewrite" migration note in
`docs/architecture.md`; Roadmap P1 must update that doc (see `70-known-issues.md`).

## Decision: Deploy to Vercel instead of GitHub Pages

Status: Accepted (stated by the project owner)
Date: 2026-08-11
Source: `docs/Roadmap.md` → Context → "User decisions already made"
Context: Legacy deploys were manual `gh-pages` pushes with a `homepage` field.
Decision: Deploy v2 to Vercel. No `basePath`; `next/image` optimization available; static
generation preferred, `output: 'export'` not required.
Consequences: URL migration (LinkedIn, CV links) is handled in Roadmap P10. `CLAUDE.md` still
describes the GitHub Pages deploy of the legacy site.

## Decision: Seven top-level sections; game-dev/backend become tags

Status: Accepted 2026-09-26 (owner delegated the call to the documentation audit: "lo más conveniente para el proyecto"); was Proposed
Date: 2026-08-11
Source: `docs/Roadmap.md` §2 "Section set decision"
Context: `docs/architecture.md`'s example `SectionId` includes `game-dev` and `backend`.
Decision: `about | skills | experience | projects | education | contact | cv`; game-dev and
backend are project/skill tags.
Consequences: `docs/architecture.md` updated in the 2026-09-26 audit.

## Decision: Roadmap ADRs 1–6 (one model two renderers, fresh scaffold + Vercel, mode persistence, hash-only URLs, loading tiers, Motion vs dnd-kit + 3D admission)

Status: Accepted as plan; ADR files scheduled for Roadmap P0 task 4 (none exist yet). ADR-5/6 numbers provisional until P5/P8 measurements
Date: 2026-08-11
Source: `docs/Roadmap.md` §6
Decision: See the roadmap text (mirrored in `20-roadmap.md`). When each ADR is written to
`docs/adr/NNN-title.md`, record it here as Accepted with its file path.

## Decision: NotebookLM project memory, same system as ResonateBlind

Status: Accepted (requested by the project owner)
Date: 2026-09-26
Source: owner request in a Claude Code session: reuse the NotebookLM context-memory system from
`ResonateBlind` for this repository, based on `docs/Roadmap.md` and `docs/architecture.md`.
Context: Long-running, multi-session migration (P0–P10) where rationale and history must
survive across Claude Code sessions.
Decision: Generated Markdown snapshot in `.context/notebooklm/`, synced incrementally by
`scripts/notebooklm/sync-context.py` (via the `nlm` CLI) to the notebook
`Manuel Ortiz Portfolio — Project Memory` (alias `portfolio`). Skills
`project-memory-status`, `project-memory-query`, `project-memory-sync`. Unlike ResonateBlind there
is no Unreal/Layer-B capture; every generated document is filesystem-derived.
Consequences: NotebookLM is the lowest authority (below the working tree, `CLAUDE.md` and
`docs/`). Run `/project-memory-sync` after meaningful architecture changes or phase completions.

## Decision: Documentation audit — one consistent story across CLAUDE.md, architecture.md, Roadmap.md

Status: Accepted (requested by the project owner)
Date: 2026-09-26
Source: owner request: audit the roadmap "según lo que sea más conveniente para el proyecto", so
the project starts with contradiction-free documentation.
Context: `docs/architecture.md` and `CLAUDE.md` predated the roadmap's decisions and disagreed
with it; the roadmap had internal inconsistencies and stale repo findings.
Decision: Roadmap decisions win where they were explicit; the docs were rewritten to match.
Resolved points:
- Migration: fresh scaffold on `portfolio_v2`, legacy frozen on `master` (architecture.md rewritten).
- Sections: 7 (`about|skills|experience|projects|education|contact|cv`); game-dev/backend are tags.
- Rendering: static generation on Vercel; `output: 'export'` not required.
- Renderers: exactly one mounted at a time; unmount inactive; never hidden+inert dual mounting
  (CLAUDE.md rule 4 tightened; roadmap P3 prompt fixed).
- Mode persistence: localStorage + blocking inline script setting `data-mode`; classic is the
  server-rendered default.
- Zustand scope: `mode` + `activeSection` only; card interaction state lives in `card-machine.ts`.
- Card states (canonical, architecture.md): idle → hovered/focused → selected → expanded →
  closing/restoring; grabbed/dragging → drop candidate as P6 enhancement. `card-interaction-review`
  skill aligned.
- Loading tiers named critical/preview/intent/interaction/expensive everywhere (roadmap P5 aligned).
- 3D seam path: `src/features/rogue/three/`.
- Tests: Vitest + RTL from P1; Playwright only if jsdom proves insufficient (CLAUDE.md updated).
- Budgets: roadmap §7 is the single source; P2/P4 now reference it.
- ADRs: written in P0 task 4.
- CV: `public/CV-ManuelOrtiz_2024.pdf` kept; the 2023 CV dropped unless the owner wants it.
- `docs/daily/` is a private, git-ignored prompt workspace — not project documentation.
Consequences: on any future conflict between these docs, fix the docs rather than choosing one
silently.

## Decision: Drop legacy assets outside the kept-asset list

Status: Accepted (stated by the project owner, 2026-09-26 session)
Date: 2026-09-26
Source: owner answer during Roadmap P0 planning
Context: `public/` held assets the Roadmap's P0 "Kept" list did not mention: `Totoro.glb`,
`_Totoro.glb` (legacy voxel header model), `bug.png`/`bug-dark.png` (navbar logo),
`images/posts/thumbnail.jpeg` (placeholder), `CV_ManuelOrtiz_2023.pdf`.
Decision: Remove all of them from `portfolio_v2`; they survive on `master` and are inventoried in
`docs/legacy-content/misc.md`.
Consequences: No 3D asset exists for Roadmap P8 (its default recommendation, skip unless a real
asset exists, stands). A logo/favicon must be designed later (P10).

## Decision: P0 scaffold toolchain specifics

Status: Accepted (implementation choice within Roadmap P0; recorded in `docs/perf-baseline.md`)
Date: 2026-09-26
Source: Roadmap P0 tasks 2–3
Context: `create-next-app@latest` produced Next 16.3.6 / React 19.2.8 / Tailwind 4 / ESLint 9
flat config / Turbopack build.
Decision:
- `typecheck` = `next typegen && tsc --noEmit` — Next 16 generates global types (`LayoutProps`)
  under `.next/types`, so a bare `tsc` fails on a clean clone.
- Prettier 3 with default options (no config file); the legacy `prettier.config.js` was broken
  (`module.export`) and never applied. `.prettierignore` excludes Markdown and generated/tooling
  dirs.
- `AGENTS.md` (Next's agent-rules block) is committed at the root. When it exists, `next dev`
  writes its block there instead of injecting it into the project `CLAUDE.md`.
- Geist fonts from the template removed; system font until the font choice in Roadmap P2.
- `engines.node >=20.9.0` (Next 16 requirement), `.nvmrc` = `22`.
Consequences: First Load JS baseline 129.9 kB gz (modern browsers) — the reference for §7 budgets.

## Decision: Owner's private profile summary is the source for professional facts

Status: Accepted (stated by the project owner, 2026-09-26)
Date: 2026-09-26
Source: owner instruction during Roadmap P1: use `perfil-global.md` (a private file outside the
repo), taking only what the portfolio needs.
Context: The legacy site's copy was outdated (2022–2024) and missing skills, recent roles and
education details.
Decision: `src/content/*` takes professional facts (headline, experience, education, skills,
proof points) from the owner's profile summary, which wins over legacy copy on conflicts. Only the
public, professional subset is used. Excluded on purpose: phone number, job-search strategy and
priority tiers, compensation, relocation and visa plans, and self-assessed gaps. Legacy prose is
kept verbatim only for game-project descriptions, pending the Roadmap P10 rewrite.
Consequences: Claim limits from that profile are binding on content: C++ is coursework only,
Unreal is training-level, generative-AI work is personal and unpublished (never "trained a LoRA"
or "fine-tuned"), no game-design credit on SOPA, and the ATP portal is described in prose only
(never linked, screenshotted or with internal data). Conflicts resolved in favor of the profile:
3DAR role (AR Developer, Lens Studio), Studio Bando dates (2023–2024), SOPA release (6 Oct 2025
on PC, Xbox, PlayStation, Switch), Discord dropped from contact.

## Decision: React Testing Library deferred to P2

Status: Accepted (stated by the project owner, 2026-09-26)
Date: 2026-09-26
Source: owner answer to the P1 plan
Context: The Roadmap put Vitest and RTL in P1, but P1 has no components to test.
Decision: P1 adds only Vitest 5 (node environment) for content validation; RTL + jsdom arrive in P2
with the first component tests. `@types/node` moved to `^22` to match the pinned Node 22 runtime
(Vitest 5's peer range excludes `^20`). `CLAUDE.md` and `docs/Roadmap.md` updated.
Consequences: No unused test dependencies in P1.

## Decision: Classic mode visual and content choices (Roadmap P2)

Status: Accepted (stated by the project owner, 2026-09-26)
Date: 2026-09-26
Source: owner answers during Roadmap P2
Context: P2 needed a visual direction, a font, and a CV answer while the only PDF (May 2024)
predates the current experience.
Decision:
- Neutral palette following `prefers-color-scheme`, single teal accent (tokens in
  `src/app/globals.css`, AA contrast in both schemes); Inter via `next/font` (self-hosted).
- CV section shows a summary and "PDF coming soon", no download, until the owner supplies a
  portfolio-specific CV (`src/content/cv.ts` → `cv = null`). The 2024 PDF stays in `public/` so old
  external links keep working, but the site no longer links it.
- itch.io links with `?secret=` tokens removed until the owner finds the public URLs; Godot added
  to skills.
- Implementation choices: `ModeToggle` is not stubbed in P2 (no dead UI) — it arrives with the mode
  system in P3; shared display labels (skill categories, project context, employment, contact
  kinds) live beside the content so Card Mode reuses them; project details and galleries use native
  `<details>` (no JS, crawlable); `next/image` uses `loading="eager"` + `fetchPriority="high"` for
  the portrait (Next 16 deprecated `priority`); CI in `.github/workflows/ci.yml`.
Consequences: Critical JS 140.0 kB gz (baseline + 10.1 kB), Lighthouse mobile 98/100/100/100.

## Decision: Mode system implementation details (Roadmap P3)

Status: Accepted (implementation within ADR-003 / ADR-004; verified in tests and headless Chrome)
Date: 2026-09-26
Source: Roadmap P3; Next 16 guide `node_modules/next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md`
Context: ADR-003 requires no-flash persisted mode and exactly one mounted renderer; ADR-004 the
hash/history policy.
Decision:
- `src/state/portfolio-store.ts` (Zustand): only `mode` + `activeSection`, initialized on the client
  from the same `localStorage` key as the inline `<head>` script and from `location.hash`.
  Renderers are gated behind `useHydrated()` (`useSyncExternalStore`) so the first client render
  matches the server's Classic HTML — no setState-in-effect, no hydration mismatch.
- Pre-paint: `<html suppressHydrationWarning>` + inline script sets `data-mode`; CSS hides Classic
  and reveals a server-rendered skeleton for a stored Card Mode preference. `ModeRoot` re-applies
  `data-mode` in a layout effect (Strict Mode remount in dev resets `<html>` attributes).
- Card Mode loads via `next/dynamic` (`ssr: false`) as its own chunk; `ModeRoot` renders either
  Classic `children` or the board, never both.
- Hash policy: anchor clicks → native `hashchange`; card selection → `pushState`; scroll-spy
  (`IntersectionObserver` in `ClassicSync`) → `replaceState`, suppressed until `scrollend` (1 s
  fallback) during anchor/programmatic scrolls. Spy band starts at 80px, just below the 72px anchor
  landing line (header + scroll-margin); an earlier 64px band rewrote `#projects` to `#experience`.
- Focus after a user mode switch: a one-shot flag (`consumePendingModeFocus`) lets the incoming
  renderer focus the active card, or scroll to and focus the active section heading (`tabIndex=-1`).
  Initial loads never move focus.
- Dev dependency `@testing-library/user-event` for keyboard tests.
Consequences: Critical JS 142.9 kB gz; board chunk 1.0 kB. Next 16's history patching keeps
pushState/back/forward same-document (verified in Chrome).

## Decision: Card Mode visual language — ASCII art (Roadmap P4)

Status: Accepted (stated by the project owner, 2026-09-26)
Date: 2026-09-26
Source: owner request (inspired by github.com/alecjacobson/ascii3d) and answers during P4
Context: The owner wanted an ASCII-art aesthetic; ascii3d is a C++ terminal ray tracer (libigl,
Eigen, Embree) that cannot run in a browser.
Decision:
- Level 1 (static): card faces are a fixed 24×16 character grid (`card-face.ts`) with box-drawing
  frames, drawn in the system monospace stack; selection switches to a double frame plus
  "> SELECTED" (shape + text, not only color). Classic keeps Inter.
- Level 2 (pre-rendered 3D): `src/features/rogue/ascii/renderer.ts` is a dependency-free SDF
  raymarcher (brightness → ` .:-=+*#%@`); `npm run ascii` (`scripts/ascii/generate.mts`) writes one
  static glyph and a 36-frame rotation per card as `*.generated.ts`; `npm run ascii:check` in CI and
  a Vitest test fail on stale output. Rotations load per card (interaction tier) and play one turn
  when a card opens — no idle loop; reduced motion shows the rest frame.
- Level 3 (live Three.js ASCII) rejected for P4; only reconsider inside the optional P8 spike.
- Expanded card = native modal `<dialog>` at every breakpoint; desktop (≥ lg) shows a fanned hand,
  smaller screens a tap-first grid.
Consequences: Board chunk 12.0 kB gz, rotations 0.4–1.3 kB each; nothing added to the critical load.

## Decision: Motion deferred; Card Mode P4 is CSS-only animation

Status: Accepted (implementation decision; CLAUDE.md "no dependency without justification",
"prefer CSS over JS")
Date: 2026-09-26
Source: Roadmap P4 planned to add `motion`
Context: P4's transitions — fan lift, dialog open/close, backdrop — are transform/opacity CSS; the
ASCII rotation is frame playback, not tweening.
Decision: Do not add `motion` in P4. Re-evaluate in P6, where drag snap-back springs may justify it
(ADR-006 responsibility split still applies if it lands).
Consequences: ~30–40 kB gz less in the Card Mode chunk.

## Decision: Card Mode interaction model (Roadmap P4)

Status: Accepted (implementation within docs/architecture.md → Card interaction states)
Date: 2026-09-26
Source: Roadmap P4; verified by Vitest (jsdom) and headless Chrome
Decision:
- `card-machine.ts`: idle → expanded → closing → idle (OPEN/CLOSE/CLOSED); reduced motion skips
  closing. hovered/focused are CSS pseudo-states; selected is derived from `activeSection`;
  "restoring" is focus returning to the card when the machine reaches idle.
- Opening a card selects its section (`pushState`). The open card follows `activeSection`, so
  back/forward and in-card links (e.g. `#project-sopa`, now parsed as the Projects section) switch
  the dialog. With no card open, hash changes only select.
- Entering Card Mode by the toggle focuses the selected card; loading the page with a section hash
  (deep link, reload) opens that card.
- The modal dialog makes the header inert, so switching mode requires closing the card first.
- Section bodies moved to `src/components/sections/*`; Classic wraps them in section landmarks and
  Card Mode renders the same components in the dialog (`GenericSectionPanel`) — one content path.

## Decision: Loading tiers enforced; Card Mode loader without Suspense (Roadmap P5)

Status: Accepted (implementation within ADR-005; verified in headless Chrome)
Date: 2026-09-26
Source: Roadmap P5; owner asked to proceed without further approvals
Decision:
- `src/features/rogue/preload.ts` is the single entry into Card Mode. The mode toggle warms it on
  pointerenter/focus/touchstart (skipped on Save-Data / `prefers-reduced-data`); `ModeRoot` renders
  the loaded module directly through `RogueBoardSlot`. `next/dynamic` was dropped: its
  React.lazy/Suspense path showed the skeleton even after the chunk had been preloaded (React 19
  Suspense reveal throttling), breaking "post-preload switch feels instant".
- A failed Card Mode chunk load falls back to Classic.
- ESLint `no-restricted-imports`: outside `src/features/rogue`, only `@/features/rogue/preload` may
  be imported; `three`/`@react-three/*` are banned everywhere except `src/features/rogue/three/`.
- `scripts/check-budgets.mjs` (`npm run budgets`, in CI after the build) enforces Roadmap §7:
  critical JS ≤ 149.9 kB gz, Card Mode chunk ≤ 80 kB, all Card Mode chunks ≤ 120 kB, zero Three.js.
- Skeleton and board share a viewport-tall `.rogue-stage`, removing a 0.104 layout shift measured
  when the board replaced the skeleton on a slow network.
- The P3 mobile-LCP known issue was a Lighthouse Lantern artifact (see perf-baseline P5).
Consequences: Critical JS 142.3 kB gz; Card Mode total 17.4 kB gz.

## Decision: Drag enhancement implementation (Roadmap P6)

Status: Accepted (implementation within ADR-006; owner asked to proceed without further approvals)
Date: 2026-09-26
Source: Roadmap P6; verified by Vitest and a headless-Chrome drag matrix
Decision:
- `@dnd-kit/core` 6.3 with `MouseSensor` only, activation distance 8px; touch keeps tap-to-open.
- Drop target: a play zone above the hand, shown only for `(hover: hover) and (pointer: fine)`,
  `aria-hidden` (dnd-kit's live region announces progress instead).
- `card-machine.ts` gains `dragging` (with `overZone` = drop candidate) and DRAG_START / DRAG_OVER /
  DROP / DRAG_CANCEL; dnd-kit handlers only dispatch these. A successful drop selects the section
  (`pushState`) and expands the card; anything else returns it to the hand with focus on it.
- dnd-kit's draggable ARIA attributes are not spread onto the card buttons (they would announce
  "draggable" instead of "button"); keyboard users keep Enter/Space.
- Motion still not added: lift is CSS, snap-back is dnd-kit's drop animation (off under reduced
  motion and on successful drops).
- dnd-kit is merged into the Card Mode chunk instead of a deferred sub-chunk: wrapping mounted
  cards in the provider after a lazy load would remount them and lose focus. Cost +13.9 kB gz.

## Decision: Section panels and Motion (Roadmap P7)

Status: Accepted (owner asked to continue with the next phase and install Motion)
Date: 2026-09-27
Source: Roadmap P7, ADR-006 (Implementation P7); verified by Vitest and headless Chrome
Context: P4 and P6 deferred `motion` (CSS and dnd-kit covered their needs). The owner asked for it
for better animations; P7's panels need exit-free reveals, staggered entrances and layout slides
that CSS cannot express cleanly.
Decision:
- `motion` 13.4 added, Card Mode only: `CardMotion` = `LazyMotion` (`domMax`, `strict`, `m.*`
  only) + `MotionConfig reducedMotion="user"`. Motion drives one-shot staggered entrances and
  `layout="position"` slides; hover lift, dialog open/close and play-zone highlight stay CSS.
  `useEntrance` renders entrances in place under reduced motion.
- Panels in `src/features/rogue/sections/`: Projects = relic collection (rarity from context,
  impact and `featured`, always written as text; one relic open at a time, spanning the row);
  Experience = semantic `<ol>` quest path (ongoing role open, nodes independent); Contact =
  merchant offers (real links, action-first names, CV offer when published). About/Skills/
  Education/CV keep `GenericSectionPanel`.
- Each panel is its own lazy chunk (`React.lazy` + `Suspense`, fallback = generic panel, a failed
  load also falls back to it), warmed on card hover/focus.
- Collapsed details stay in the DOM with `hidden`, keeping content parity and deferring images.
- `#project-<id>` opens and focuses that relic (quest-path links use it).
- `ProjectCard`'s blocks extracted to `components/sections/ProjectDetails.tsx` (second consumer);
  `experienceMeta`/`relatedProjects` exported from `ExperienceBody`.
- Budget script measures whole load groups plus a ≤ 10 kB check per panel.
Consequences: Card Mode load 67.4 kB gz (Motion 39.8 kB), panels ~1 kB each, total 75.7 kB;
critical JS unchanged (141.9 kB).

## Decision: ASCII pseudo-3D relic inspector instead of a Three.js spike (Roadmap P8)

Status: Accepted (project owner: keep the ASCII pseudo-3D line; chose "one project relic")
Date: 2026-09-27
Source: ADR-007; verified by Vitest and headless Chrome with CPU throttling
Context: P8's Three.js spike defaulted to skip (no model asset, ~150 kB gz). Card Mode already
renders 3D objects as ASCII with a build-time SDF raymarcher (0.8 kB gz minified).
Decision:
- No-go for Three.js/R3F; the fence and the zero-Three.js budget stay.
- SOPA's relic detail gets "View relic in 3D": a custom SDF potato turned by drag, arrow keys and
  labelled buttons (turn left/right, tilt up/down, reset), raymarched in the browser once per input.
  Flicks and a short intro coast decay to a stop; reduced motion removes both.
- `RELIC_MODELS` in `ascii/scenes.ts` maps project id → shape + text alternative.
- The inspector is a user-triggered chunk (`src/features/rogue/inspector/`), budget ≤ 5 kB gz,
  checked to be absent from the initial, Card Mode and panel loads.
- P7 remained uncommitted at the owner's choice while P8 was built on top.
Consequences: inspector 2.0 kB gz; worst event 88 ms at 6× CPU throttling; no idle frames.
`renderer.ts` now runs at runtime too, so new shapes need a cost check.

## Decision: P9 hardening outcomes

Status: Accepted (implementation within Roadmap P9 scope; fix-forward only)
Date: 2026-09-27
Source: `docs/audit-checklist.md`, `docs/perf-baseline.md` → P9
Decision:
- Classic suppresses the scroll-spy on a page load with a section hash until the anchor scroll
  settles (deep links to `#contact`/`#cv` used to end on `#education`).
- The About photo loads lazily: React preloads non-lazy SSR images, which a stored Card Mode never
  shows ("preloaded but not used" warning). It is not the LCP element.
- `<main>` is focusable (`tabIndex={-1}`) so the skip link moves focus.
- Scaffold `favicon.ico` replaced by `icon.svg` + `apple-icon.tsx` (OG colors, "MO" monogram).
- `"use client"` kept only on `ModeRoot`, `ModeToggle`, `ClassicSync` and the Card Mode entry
  `RogueBoard`.
- Accepted as is: Motion `domMax` includes ~3.6 kB of unused drag gesture code (no public
  layout-only bundle); images stay WebP (AVIF unnecessary for the budget); Vercel previews score
  SEO 66 because of their `noindex` header.
Consequences: all automated walkthroughs pass; NVDA and physical-phone passes remain manual. The
owner plans a corrections round after P9 for plan-vs-result discrepancies.

## Decision: Battlefield board and mobile fan (Roadmap P9.1, ADR-008)

Status: Accepted (project owner request after P9; rival = technical bug, effect then dialog, touch
= tap to lift / tap or swipe up to play — all chosen by the owner)
Date: 2026-09-27
Source: ADR-008; verified by Vitest (182 tests) and the headless-Chrome audit harness
Decision:
- Supersedes P4's "mobile: grid or snap list": the fanned hand is used at every width; the board is
  a viewport-tall game screen (header, battlefield, hand).
- Battlefield with "The Legacy Bug" (100 HP); per-card damage sums to 100 and per-card effects use
  tokens derived from the content (`src/features/rogue/battle.ts`).
- Card machine gains `inspecting` and `playing` (INSPECT / RELEASE / PLAY / EFFECT_DONE; DROP now
  plays); `boardReducer` tracks played cards and the last hit. `PlayZone` removed.
- Effect 0.9 s then dialog; skip by tap, Enter or Escape; reduced motion skips; hash/back opens
  skip the effect but count as played.
Consequences: Card Mode load 69.4 kB gz; content reached ~0.9 s later after a play unless skipped.

## Decision: Duel with card targets and aiming arrow (Roadmap P9.2, ADR-009)

Status: Accepted (project owner request, 2026-09-27)
Date: 2026-09-27
Source: ADR-009; Vitest (189 tests) and headless Chrome
Decision:
- Hero (owner, placeholder ASCII) left, bug right. `cardActions` gives each card a type and target:
  attacks Experience 40 / Projects 40 / CV 20 hit the bug; About, Skills (power) and Education,
  Contact (skill) grant hero statuses derived from the content.
- `TargetArrow` draws a curve from the dragged (or tap-lifted) card to its target; the target glows;
  release anywhere over the battlefield plays the card; drops fly on from the release point.
- The hero art is a placeholder until the owner supplies a model (`assets/models/`, `.obj`
  preferred; converted to ASCII at build time). Boss behaviour work deferred by the owner.
Consequences: Card Mode load 70.5 kB gz. Fixed duplicate bug art caused by sibling React keys.

## Decision: Turn system (Roadmap P9.3, ADR-010)

Status: Accepted (project owner request, 2026-09-27)
Date: 2026-09-27
Source: ADR-010; Vitest (193 tests) and a headless-Chrome full fight
Decision:
- 2 hero actions per turn (cards played from the hand); then the bug acts once the board is idle:
  cycle attack 8 → charge ×2 → attack (16 if charged) → heal 12, shown as its intent.
- Hero 50 HP, bug 100 HP. Statuses are mechanics: Str +2 per Skills play, Block +6 (Education),
  Dodge (About), heal 12 (Contact); attacks Experience 5×(4+Str), Projects 22+Str, CV 15+Str.
- Direct opens never touch the fight; playing during the bug's turn resolves it at once; win/loss
  shows "Play again"; content is never gated.
Consequences: Card Mode load 71.9 kB gz; replaying cards now counts (P9.1's "damage once" rule
superseded).

## Decision: Deck (Roadmap P9.4, ADR-011)

Status: Accepted (project owner request; owner chose skill cards per category, 5-card hand, project
cards that attack and open their project)
Date: 2026-09-27
Source: ADR-011; Vitest (205 tests) and headless Chrome
Decision:
- 27 cards (`cards.ts`): sections, one per project, one upgrade per skill category; `CardId`.
- Opening hand = 5 section cards; played cards go back into the deck at a random position; hand
  refills to 5 (max 7); seeded PRNG in the board state keeps the reducer pure.
- Projects/Skills draw 2 project/skill cards; project cards attack by rarity and open their relic;
  skill cards give Strength +2, +1 card this turn, or a Block shield by category.
- Sections not in hand stay reachable through the site header.
Consequences: Card Mode load 73.0 kB gz; component tests pin the deal (`src/test/card-deal.ts`).

## Decision: Deck pile and draw animation (Roadmap P9.5, ADR-011 implementation note)

Status: Accepted (project owner request, 2026-09-27)
Date: 2026-09-27
Source: ADR-011 (P9.5 section); Vitest and headless Chrome
Decision:
- Deck shown as a pile of card backs left of the hand with its count; header counter removed.
- Cards fly from the pile into their slot (opening deal staggered, draws after a play) via Motion
  `useAnimateMini` (WAAPI, transform/opacity); inline styles always cleared so cards never stay
  hidden; no WAAPI or reduced motion → placed directly.
- Hand slots are `m.li layout="position"`; the fan transform moved to an inner `.card-fan`.
Consequences: Card Mode load 75.0 kB gz (5 kB headroom left under the 80 kB budget).

## Decision: Borderless battlefield, hand overlaps the combatants (Roadmap P9.6)

Status: Accepted (project owner request, 2026-09-27)
Date: 2026-09-27
Source: commit 326bb3c; docs/architecture.md (Card Mode section); headless Chrome
Decision:
- The battlefield has no border and does not clip; the hand rises into it (`--hand-overlap`), so
  cards may cover the combatants' feet; combatants stand at the bottom of the field, hint/outcome
  under the turn bar, statuses and effect labels above the art.
- Drops use `pointerWithin` on a `.drop-zone` above the hand, so a card picked up from the hand is
  never already over the field; a glow plus the hint text replace the dashed drag border.

## Decision: Roguelike modifiers every two rounds (Roadmap P9.7, ADR-012)

Status: Accepted (project owner request, 2026-09-27)
Date: 2026-09-27
Source: ADR-012; Vitest and headless Chrome
Decision:
- Every 2 rounds (hero turn + bug turn) the fight pauses on a modal offer of 3 distinct random
  modifiers (seeded PRNG, rarity-weighted, maxed ones skipped); picks stack; Escape/Skip declines.
- Registry pattern in `modifiers.ts`: one data entry per modifier (text, rarity, maxStacks,
  per-stack `stats`, optional `onPick`, `badge`); the fight stores stack counts, `statsOf` derives
  `HeroStats`. New modifier = one entry; new effect kind = one `HeroStats` field + one engine line.
- 10 modifiers: damage ×0.5, heal 25%, +1 hit chance, crit chance, dodge chance, Block per turn,
  thorns, lifesteal, max HP, +1 action.
- While an offer is pending a card still opens its section but stays in the hand.
Consequences: Card Mode load 77.1 kB gz (2.9 kB headroom under the 80 kB budget).

## Decision: Floating modifier offer and golden cards (Roadmap P9.7 follow-up, ADR-012)

Status: Accepted (project owner request, 2026-09-27)
Date: 2026-09-27
Source: ADR-012 (follow-up section); Vitest and headless Chrome
Decision:
- Offer cards float at the top of the screen and rise one after another from below it
  (transform/opacity); still a native modal dialog with Skip/Escape; reduced motion shows them.
- New rare modifier Gold Standard: golden copies of 3 distinct random cards shuffled into the deck.
  Golden card = own id `gold:<card>`; same section; every effect number ×1.5 rounded up; gold face
  with "★ golden ×1.5" text. Registry gained a `goldenCards` field.
Consequences: Card Mode load 77.7 kB gz (2.3 kB headroom under the 80 kB budget).

## Decision: Boss from a 3D model rendered as ASCII at build time (Roadmap P9.8, ADR-013)

Status: Accepted (project owner request, 2026-09-27)
Date: 2026-09-27
Source: ADR-013; Vitest and headless Chrome
Decision:
- Boss model: skinned glTF in git-ignored `resources/boss_v1/` ("Boppin' Ariados" by zcythe,
  CC BY 4.0, with its own animation); never committed or shipped.
- `scripts/ascii/boss.mts` (`npm run ascii:boss`): parse glTF, sample the animation, CPU skinning,
  rasterize to 44×18 cells (3×3 subsamples), shade with the card renderer's `LIGHT`/`shadeChar`.
  Output committed: rest + defeated (legs up) frames, and a 16-frame loop in its own chunk. CI's
  `ascii:check` cannot cover it (no model in CI).
- Playback like the card objects: plays on events (fight opens, bug acts or is hit, hover), then
  rests; no idle loop; reduced motion = rest frame.
- CC BY credit shown in Card Mode. Owner flagged: the model depicts a third-party franchise
  character (Ariados, Pokémon); the license covers the modeller's work only.
Consequences: Card Mode load 78.7 kB gz (1.3 kB headroom); boss animation chunk 2.3 kB gz.

## Decision: Boss view and smoother loop (Roadmap P9.8 follow-up, ADR-013)

Status: Accepted (project owner review with reference screenshots, 2026-09-27)
Date: 2026-09-27
Source: ADR-013 (follow-up section); Vitest and headless Chrome
Decision:
- The model faces +z; the first render showed it from behind. New view yaw −2.2, pitch 0.55
  (three-quarter from above, head toward the hero), grid 48×20, 24 frames per loop.
- Events during a play extend it by whole loops instead of restarting; plays end on the rest frame;
  timing uses animation-frame timestamps only (a `performance.now()` deadline never ended in jsdom).
Consequences: Card Mode load 78.8 kB gz (1.2 kB headroom); boss animation chunk 3.4 kB gz.

## Decision: Boss seen from above, continuous loop (Roadmap P9.8 follow-up 2, ADR-013)

Status: Accepted (project owner request, 2026-09-27)
Date: 2026-09-27
Source: ADR-013 (follow-up 2); CLAUDE.md (accessibility & motion); Vitest and headless Chrome
Decision:
- Pitch sign fixed in `scripts/ascii/boss.mts`: positive pitch = seen from above (card convention).
- The boss animation loops continuously at 0.75× speed — an owner-approved exception to "no
  continuous idle animation loops", named in CLAUDE.md. `BossArt.tsx` re-renders only the boss
  text; paused with the tab hidden; never under reduced motion.
- Component tests rendering the board mock the boss frames to one still frame
  (`src/test/boss-frames.ts`): per-frame DOM mutations made Testing Library's async role queries
  time out in jsdom.
Consequences: Card Mode load 78.7 kB gz.

## Decision: Boss loop at 0.5× speed (Roadmap P9.8 follow-up 3, ADR-013)

Status: Accepted (project owner request, 2026-09-27)
Date: 2026-09-27
Source: ADR-013 (follow-up 3, current settings, "Updating the boss")
Decision:
- `BOSS_ANIMATION_SPEED = 0.5`: 56 ms per frame, 1.33 s loop (was 0.75×, 37 ms). Nothing else
  changes; bundle size unchanged.
- ADR-013 now lists the boss's current settings and the steps to update or replace the model.

## Decision: Hero from a 3D model; one registry for combatant models (Roadmap P9.9, ADR-014)

Status: Accepted (project owner request, 2026-09-27)
Date: 2026-09-27
Source: ADR-014; Vitest and headless Chrome
Decision:
- Hero model: `resources/base_mesh_chibi/` ("Base Mesh Chibi" by abhishekfarshwan, CC BY 4.0,
  Mixamo rig, 9.8 s IDLE), git-ignored.
- Boss-only settings became `ASCII_MODELS` (`boss`, `hero`) in `ascii/scenes.ts`; `boss.mts` became
  `scripts/ascii/models.mts` (`npm run ascii:models`, `--model=`); outputs
  `ascii/models/<id>.generated.ts` + `ascii/frames/<id>.generated.ts`; `ModelArt.tsx` replaces
  `BossArt.tsx`; `modelFrameLoaders`. Boss frames byte-identical.
- `bindShape` fixes exports whose meshes were bound in different spaces: the hero body mesh is
  scaled by a fitted 0.04 before skinning (node-matrix rebinding tore the mesh).
- Hero: 28×20, yaw 2.0, pitch 0.1 (three-quarter toward the bug, per the owner's references),
  64 frames at 1× (153 ms), defeated lying on its side; loops like the boss (CLAUDE.md exception
  now covers both combatants).
Consequences: Card Mode load 79.2 kB gz (0.8 kB headroom); hero loop chunk 4.5 kB gz.

## Decision: Depth-cued ASCII as the pseudo-3D standard (Roadmap P9.10, ADR-015)

Status: Accepted (project owner request, 2026-09-27)
Date: 2026-09-27
Source: ADR-015; CLAUDE.md (Styling); Vitest and headless Chrome
Decision:
- Technique: depth cueing (linear fog toward the background, quantized to 4 bands); characters
  carry light, color carries depth.
- Pattern: producer → `DepthArt` value (`chars` + parallel `depth` bands, `ascii/depth.ts`) →
  presenter `AsciiArt.tsx` (one stacked text layer per band) → CSS fog
  `color-mix(in oklab, currentColor 100/76/56/40 %, var(--bg))`, both themes.
- Stable depth ranges: SDF fixed −1.2 … 0.3; models over the whole animation; card frame/text flat.
- Applied to card glyphs, card rotations, relic inspector, combatants. CLAUDE.md requires it for new
  pseudo-3D elements.
- Combatants' rest/defeated frames moved into their lazy chunks to stay under the Card Mode budget.
Consequences: Card Mode load 79.0 kB gz; all Card Mode chunks 106.5 kB.

## Decision: Card Mode background music and beat bounce (Roadmap P9.11, ADR-016)

Status: Accepted (project owner request, 2026-09-28)
Date: 2026-09-28
Source: ADR-016; CLAUDE.md (Accessibility & motion); Vitest and headless Chrome
Decision:
- Native Web Audio, no library (Howler/Tone over budget and unneeded): `<audio loop>` → fade gain →
  duck gain → music bus (0.28) → speakers, in a lazy engine chunk with the beat map.
- Enter fades in 1.5 s; leave/mute/hidden tab fade out 0.8 s then pause in place (resume, not
  restart). Upgrade offer ducks to 40 %.
- Beat map at build time (`npm run audio:music`, ffmpeg). Revised 2026-09-29 (owner: bounce too
  sensitive at times, frozen at others): onset peak picking replaced by a beat tracker (log spectral
  flux → autocorrelation tempo → Ellis DP, tightness 100), each beat snapped to a kick within
  ±40 ms; strength 1 no kick / 2 kick / 3 hard kick; 396 beats, 388/392 within 50 ms of beat_this.
  The track's tempo rises ~127 → ~130 BPM, so a single-BPM grid is rejected; the tracked map is a
  drifting-tempo grid. beat_this/librosa were references only, not dependencies.
- Bounce: timer on `audio.currentTime` − output latency toggles `data-beat` a/b; CSS keyframes on
  `translate`/`scale`, shaped as a heartbeat (swell, slight contraction, rest; 300 ms; owner
  follow-up). Only while heard; off under reduced motion and with a section open. Second
  owner-approved exception to "no continuous idle animation loops".
- Speaker toggle: `aria-pressed` button, choice in localStorage; `muted`/`blocked` in
  `audio/music-settings.ts`, not Zustand. Autoplay held → first interaction starts it.
- SFX later: an effects bus beside the music bus under one master gain.
- Track is AI-generated from the owner's prompts: no author credit shown.
Consequences: Card Mode load 79.8 kB gz (0.2 kB headroom); track 2.8 MB, Card Mode only.

## Decision: Card Mode environment — parallax layers of depth-cued ASCII (Roadmap P9.12, ADR-017)

Status: Accepted (project owner request, 2026-09-29)
Date: 2026-09-29
Source: ADR-017; owner choices (server-room ruins, pointer + event parallax, quake demo); Vitest and
headless Chrome
Decision:
- Scalable registry `ENVIRONMENT_LAYERS` (farthest first: far, mid, near, ground, foreground) with
  depth, parallax, front/back, anchor (above/below the horizon, or the bottom) and size; a new layer
  = registry entry + scene + `npm run ascii:env` (checked in CI).
- Build-time SDF raymarching to `DepthArt` (fixed seed): oblique parallel camera for backgrounds,
  perspective for the floor; ADR-015 extended — a layer's color is fogged by its depth (55–91 %)
  on top of its own bands.
- `Environment.tsx` in its own chunk (3.0 kB gz), rendered back (before the combatants) and front
  (after them); DOM order stacks it under the hand and the played card, no new z-index.
- Combatants moved up: `--horizon` = hand overlap + clamp(2rem, 11dvh, 6.5rem) is the field's
  bottom padding and the layers' anchor.
- Camera in CSS: pointer (fine pointers, one style write per frame while moving) + aimed target;
  translate by −cam × parallax. No idle loop. Reduced motion pins every layer.
- Effects: `CardAction.environment` (`"quake"` on Résumé scroll and the experience combo) →
  `data-env-effect` + a/b key on the field → CSS `transform` shake scaled by parallax.
Consequences: Card Mode load 79.9 kB gz (0.1 kB headroom); all Card Mode chunks 110.3 kB of 120.
