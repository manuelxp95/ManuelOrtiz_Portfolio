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
