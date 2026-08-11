# Manuel Ortiz Portfolio v2 — Phased Implementation Plan

## Context

The repo currently holds a legacy Next 12 / Pages Router / JS / Chakra UI portfolio (React 17, framer-motion v5, `three` as an unused-in-practice dependency, historically deployed to GitHub Pages via `gh-pages`). The goal is a new portfolio with two synchronized presentation modes — **Classic** (professional, SEO-first) and **Card Mode** (`rogue` internally; roguelike card interaction, original design) — over **one** typed content model. This plan defines the phases another Claude Code session executes incrementally. It does not implement anything.

**User decisions already made (do not re-litigate):**
- **Fresh scaffold** on branch `portfolio_v2`, replacing the root app. Old site remains deployable from `master`. Old code is content/reference, not a structural constraint.
- **Deploy to Vercel** (not GitHub Pages). No `basePath`, `next/image` optimization available, static generation preferred but `output: 'export'` not required. URL migration (LinkedIn, CV links) handled in Phase 10.

---

## 1. Repository findings

- **Stack (current):** Next `^12.3.1`, React 17, Chakra UI v1, framer-motion v5, `three` `^0.135` (listed but no 3D usage found in pages), `express` (unused for a static site), `gh-pages`, `@vercel/analytics`. ESLint 7 + `eslint-config-next` 12, Prettier 2.
- **No TypeScript** (`tsconfig.json` absent), **no Tailwind**, **no tests** (`npm test` exits 1), **no lockfile at repo root**, **no `.github/` workflows** (deploys were manual `gh-pages`).
- **Structure:** `pages/` (index, works, shots, posts, 404, `works/*.js` — 9 project detail pages), `components/` (layouts, section, grid-item, bio, logo, theme toggle…), `lib/theme.js` (Chakra theme), `public/images/works/*` + `public/manuel.jpeg`.
- **Harvestable content:** intro/bio copy and timeline (1995 Corrientes; 2022 3dar; 2023 Studio Soup; 2024 StudioBando intern), contact links (LinkedIn `manuel-enrique-ortiz`, GitHub `manuelxp95`, Discord invite, `ortizmanuel@pm.me`), 9 projects with titles/blurbs/images (Sopa, Revolución Tecnobotánica, Path Between Dimensions, Bolas Locas, Clicker Test, Meteoritos, Frusting Path, Road to Carpincho, Saltarina), per-project detail pages with more copy, all `public/images/works/*` assets. CV file location must be verified in Phase 0 (commits mention "update cv").
- **Git:** branch `portfolio_v2` (clean), `master` is default; branches `cv_implement` exist. `homepage` points at GitHub Pages (now obsolete per Vercel decision).
- **Docs/skills:** `docs/architecture.md` (domain model, loading tiers, state boundaries, card state machine, 3D isolation) exists and is current-thinking; `.claude/skills/` has `architecture-review`, `performance-review`, `accessibility-review`, `feature-plan`, `verify-feature`, `card-interaction-review` — use them at the checkpoints named per phase.
- **Environment risk:** repo lives under **OneDrive** on Windows. `node_modules` under OneDrive causes slow installs/dev and sync churn. Phase 0 must exclude `node_modules`/`.next` from OneDrive sync (or relocate the repo).

## 2. Architectural assumptions

- Next.js current stable via `create-next-app@latest` (exact version recorded at scaffold time, not assumed) + matching React, App Router, TypeScript `strict`, Tailwind CSS v4, Motion (`motion` package, successor of framer-motion), dnd-kit (Phase 6 only), Zustand (mode + active section only), npm as package manager (no reason for another). Node runtime pinned to what the scaffolded Next version supports.
- Bundle analysis uses the tooling appropriate to the bundler the production build actually uses: for Next 16+ with default Turbopack, the built-in Turbopack analyzer; never switch the production build to Webpack merely to run `@next/bundle-analyzer`.
- **Chunk warm ≠ component mounted.** Only one complete presentation renderer is ever mounted for the interactive session. Switching away unmounts the inactive renderer entirely; only domain/navigation state (mode, activeSection) survives; the already-loaded JS chunk stays cached naturally by the runtime, so remounting is cheap.
- Mode is `'classic' | 'rogue'` internally; UI copy "Classic" / "Card Mode". Mode is UI state; active section is domain state; they are independent.
- Section identity: stable `SectionId` union; deep links via `#hash`, no mode-specific routes, mode not encoded in URL.
- Classic content is server-rendered HTML always present for crawlers; Card Mode is a client-side renderer consuming the same serializable domain data passed down from Server Components. Server Components never read the Zustand store.
- **Section set decision (deviation from `docs/architecture.md`):** the doc's example `SectionId` includes `"game-dev"` and `"backend"`. Recommend **7 sections** — `about | skills | experience | projects | education | contact | cv` — and model game-dev/backend as project/skill **tags**, not top-level sections. Fewer cards, clearer navigation, no duplicate project groupings. Phase 1 updates `docs/architecture.md` accordingly.
- 3D: not in MVP. Extension point = the lazy-import seam at `src/features/rogue/three/` that nothing imports until Phase 8. No Three.js/R3F dependency is installed before Phase 8.
- Testing: **Vitest + React Testing Library** (domain, store, hash/mode sync, keyboard flows in jsdom). Playwright deferred — added in Phase 9 only if jsdom proves insufficient for sync/hydration cases.

## 3. Proposed phase overview

Structure follows the requested phases with two adjustments, explained inline:

| Phase | Name | Increment shipped |
|---|---|---|
| P0 | Baseline: fresh scaffold + Vercel | Empty-but-deployed v2 shell, CI green, perf baseline measured |
| P1 | Domain & content model | Typed content, validated, consumed by a throwaway debug page |
| P2 | Shell + Classic Mode | Credible professional portfolio live (usable release on its own) |
| P3 | Mode system & synchronization | Toggle + placeholder Card Mode, section preserved across modes |
| P4 | Card Mode static experience | Full Card Mode via click/keyboard/tap |
| P5 | Lazy loading & preload strategy | Measured bundle boundaries, intent preload |
| P6 | Drag/drop enhancement | Desktop drag over already-working Card Mode |
| P7 | Section-specific interactions (scoped) | 2–3 differentiated sections, rest stays generic |
| P8 | Optional 3D spike | Go/no-go evidence; ships only if it earns it |
| P9 | Performance/a11y hardening | Audited release candidate |
| P10 | Content polish & release | v2 replaces old site; URL migration done |

**Structural changes vs the brief:** (a) Phase 7 is explicitly **scoped down** — differentiate the 2–3 sections with best value/cost (Projects, Experience, Contact), keep the generic expanded card for the rest; full differentiation is post-MVP. Reason: Phase 7 is the highest scope-explosion risk in the plan. (b) Phase 5's *measurement* starts in Phase 4 (bundle check in CI from the moment the Card chunk exists) so Phase 5 is enforcement/tuning, not discovery. No other reordering: the requested order is already correct (mode architecture before visuals, loading boundaries before drag).

---

## 4. Detailed phases

### PHASE 0 — Repository and baseline

**Objective.** A fresh Next scaffold on `portfolio_v2`, deployed to Vercel, with typecheck/lint/build green and a measured performance baseline.

**Why now.** Everything else needs a known-good toolchain and a deploy target. The fresh-scaffold decision makes this cheap; no in-place migration gymnastics.

**Files/modules affected.**
- Removed from `portfolio_v2` (survive on `master`): `pages/`, `components/`, `lib/`, `next.config.js`, `prettier.config.js`, `.eslintrc.json`, old `package.json` deps.
- Kept: `public/images/**`, `public/manuel.jpeg`, `docs/`, `CLAUDE.md`, `.claude/`, `README.md`, CV asset if found.
- New (proposed): `package.json` (fresh), `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `postcss.config.mjs`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `.gitignore` (ensure `.next/`, `node_modules/`), optionally `.nvmrc`.

**Implementation tasks.**
1. Verify/copy harvestable assets and copy old page text into `docs/legacy-content/` (plain markdown dump of index/works/detail-page copy) so old code can be deleted without losing content. Locate the CV file.
2. Remove legacy app files on `portfolio_v2`; scaffold with **`create-next-app@latest`** (TS strict, Tailwind, ESLint, `src/` dir, App Router, npm). Commit lockfile. Immediately after scaffolding: **record the exact Next.js and React versions** in `docs/perf-baseline.md`, **pin the Node runtime** supported by that Next.js version (`engines` + `.nvmrc`), and **do not downgrade** to any predefined framework version unless a concrete compatibility issue forces it (document the issue if so).
3. Configure Prettier (keep, v3) and scripts: `dev`, `build`, `lint`, `typecheck` (`tsc --noEmit`), `test` (placeholder until Phase 1 adds Vitest).
4. Exclude `node_modules`/`.next` from OneDrive sync or document repo relocation; verify `npm run dev` and `npm run build` are acceptably fast.
5. Connect Vercel: project targeting `portfolio_v2` branch as preview (production promotion happens in Phase 10). Remove `homepage`/`gh-pages`/`express`/`@vercel/analytics` remnants (fresh package.json makes this automatic).
6. Measure baseline: `next build` route table (First Load JS), Lighthouse on the deployed empty shell. Record numbers in `docs/perf-baseline.md`.

**Architectural decisions.** npm vs pnpm (recommend npm); Tailwind v4 CSS-first config; Node version pin; keep old site untouched on `master`.

**Dependencies.** User decisions (done: fresh scaffold, Vercel). Vercel account access (user may need to run `vercel login`/link — flag if interactive).

**Risks.** OneDrive slowing installs/builds (mitigate step 4); accidental loss of legacy copy (mitigate step 1: harvest before delete — deletion is also recoverable from `master`); Vercel linking requiring interactive auth.

**Performance budget/concerns.** Baseline scaffold First Load JS is the reference number (measured, not assumed — recorded with the exact Next/React versions). Anything later is judged against it.

**Accessibility requirements.** `lang` attribute, viewport meta, sensible default focus styles not removed by reset.

**Tests/checks.** `npm run build`, `npm run typecheck`, `npm run lint` all pass; deployed preview URL loads; baseline recorded.

**Acceptance criteria.** Dev server runs; production build passes; typecheck/lint pass; zero legacy dependencies in `package.json`; Vercel preview deploy live; `docs/perf-baseline.md` exists with route-table + Lighthouse numbers.

**Non-goals.** No domain model, no content, no UI beyond the scaffold page, no analytics, no production promotion.

**Suggested Claude task prompts.**
- "Harvest all professional copy, project data, image references and CV location from the legacy pages into docs/legacy-content/*.md. Read-only against app code; create only docs files."
- "On portfolio_v2, remove the legacy Next 12 app files and scaffold with create-next-app@latest (TypeScript strict, Tailwind, ESLint, src/ dir, App Router, npm) at the repo root; record exact Next/React versions, pin the supported Node runtime, add scripts dev/build/lint/typecheck. Keep public assets, docs/, CLAUDE.md, .claude/. Do not downgrade framework versions unless a compatibility issue forces it."
- "Set up the Vercel project for this repo (preview deploys from portfolio_v2) and record the build route table and Lighthouse results for the empty scaffold in docs/perf-baseline.md."

---

### PHASE 1 — Domain and content model

**Objective.** One typed source of truth for all portfolio content, consumable from Server Components, with validation tests.

**Why now.** Both renderers depend on it; building Classic first against ad-hoc props would recreate the legacy problem this project exists to fix.

**Files/modules affected (all new, proposed).**
- `src/domain/types.ts` — `SectionId`, `PortfolioMode`, `Profile`, `Skill`, `Experience`, `Project`, `Education`, `ContactLink`, `CvMeta`, `SectionMeta`.
- `src/domain/sections.ts` — ordered section registry: `{ id, classicLabel, cardLabel, cardVariant }`.
- `src/content/profile.ts`, `skills.ts`, `experience.ts`, `projects.ts`, `education.ts`, `contact.ts`, `cv.ts`, `index.ts` (aggregate export).
- `src/domain/__tests__/content.test.ts` — validation.
- Tooling: `vitest.config.ts`, Vitest + RTL devDependencies.
- Updated: `docs/architecture.md` (7-section decision, migration section refreshed).

**Implementation tasks.**
1. Define `SectionId` = the 7 ids and `SectionMeta` with presentation metadata fields (`classicLabel`, `cardLabel`, `cardVariant`, `icon` as string identifier — no JSX in content).
2. Define domain types. `Project` carries: `id`, `name`, `summary`, `description`, `role`, `responsibilities`, `stack`, `links` (repo/play/store), `media` (image paths + alt), `tags` (includes `game-dev`/`backend`-style domain tags), optional `impact`. Optional `rarity`/`cardVariant` as presentation metadata on the entry.
3. Populate content files from `docs/legacy-content/` (plain TypeScript — no JSON/MDX; content is small, typed TS is the simplest maintainable option and needs no loader).
4. Add Vitest; write validation tests: unique ids, every section in registry, every project image path exists in `public/`, links are absolute URLs, required fields non-empty.
5. Update `docs/architecture.md`: section set, fresh-scaffold reality, Vercel.
6. Temporary route `src/app/debug/content/page.tsx` (Server Component dumping content) to prove server-side consumption — deleted in Phase 2.

**Architectural decisions.** TS-only content (vs MDX — revisit only if long-form case studies appear in Phase 10); tags vs extra sections (tags — recommended above); alt-text stored alongside each media entry.

**Dependencies.** P0; `docs/legacy-content/`; Vitest/RTL (new devDeps — justified: only test runner, nothing exotic).

**Risks.** Over-modeling (fields nothing renders — keep to what Classic will actually show, extend later); legacy copy quality is poor ("A game plataformer like Mario") — model now, rewrite copy in Phase 10, don't block on prose.

**Performance budget/concerns.** None at runtime (content is build-time data). Keep content importable per-section so future code-splitting isn't fighting one giant object.

**Accessibility requirements.** Every media entry has required `alt`; link labels are human-readable (no bare URLs as the only label).

**Tests/checks.** Vitest validation suite passes; `typecheck` passes; debug page renders all sections server-side.

**Acceptance criteria.** No renderer-specific copy duplication possible (single export surface); stable ids defined and tested; content renders without any client state; tests green.

**Non-goals.** No real UI components, no store, no mode types beyond the type alias, no design tokens.

**Suggested Claude task prompts.**
- "Implement src/domain/types.ts and src/domain/sections.ts per the plan (7 SectionIds, presentation metadata as plain data). No UI components."
- "Populate src/content/* from docs/legacy-content, typed against the domain model. Keep legacy prose as-is; do not rewrite copy."
- "Add Vitest and write content validation tests: unique ids, section registry completeness, media paths exist, links absolute, required fields non-empty."
- "Update docs/architecture.md to reflect the executed decisions: 7 sections with tags, fresh scaffold, Vercel deployment."

---

### PHASE 2 — Portfolio shell and Classic Mode

**Objective.** A complete, credible, deployable Classic portfolio: all 7 sections, semantic HTML, SEO metadata, responsive, keyboard-clean.

**Why now.** Classic is the professional baseline and the SEO/recruiter deliverable; it must not depend on any Card Mode machinery. It also exercises the content model for real, flushing out P1 modeling mistakes early.

**Files/modules affected (new, proposed).**
- `src/app/layout.tsx` (fonts, metadata, skip-link), `src/app/page.tsx` (single page composing sections — Server Component).
- `src/components/shell/PortfolioShell.tsx` (server), `Header.tsx`, `SectionNav.tsx` (anchor links), `ModeToggle.tsx` (client island — visual shell only this phase, disabled or hidden until P3).
- `src/components/classic/ClassicSections.tsx` + per-section: `AboutSection.tsx`, `SkillsSection.tsx`, `ExperienceSection.tsx`, `ProjectsSection.tsx`, `ProjectCard.tsx` (classic list item), `EducationSection.tsx`, `ContactSection.tsx`, `CvSection.tsx` — all Server Components.
- `src/app/globals.css` — design tokens as CSS variables (spacing, radii, surfaces, text, timing) shared later by Card Mode.
- `src/app/robots.ts`, `src/app/sitemap.ts`, `src/app/not-found.tsx`, `src/app/opengraph-image` (or static OG asset).

**Implementation tasks.**
1. Root layout: metadata API (title template, description, OG/Twitter), font via `next/font`, skip-to-content link.
2. Shell: header with name + section nav (real `<a href="#projects">` anchors), footer. Single-page composition with `<section id={sectionId}>` per section, `scroll-margin-top` for the sticky header.
3. Implement the 7 classic sections from content. Projects: grid of `ProjectCard` linking to per-project detail — decide inline expandable `<details>`-style vs dedicated content on the same page; recommend all-in-page (single page, no subroutes) with concise per-project blocks.
4. Images via `next/image` (Vercel optimization available); explicit width/height to avoid CLS.
5. 404 page; robots/sitemap; verify heading hierarchy (one `h1`, `h2` per section).
6. Add `npm run test` + typecheck + lint + build to a GitHub Actions CI workflow (`.github/workflows/ci.yml`) — cheap now, guards every later phase.

**Architectural decisions.** Single page vs project subroutes (recommend single page + hash; per-project pages only if Phase 10 case studies demand them); sticky vs static header; dark mode (recommend: honor `prefers-color-scheme` via CSS tokens, no toggle — a mode toggle already exists in the UI, two toggles is noise; revisit in P10 if desired).

**Dependencies.** P1 content. Font choice (pick a system-adjacent variable font via `next/font`; no external font service).

**Risks.** Chakra-era visual habits creeping in as custom CSS bloat; over-designing Classic (it must be clean, not spectacular — Card Mode is the spectacle).

**Performance budget/concerns.** First Load JS ≤ baseline + ~15 kB gz (fonts/CSS excluded). No client components except `ModeToggle`. Images lazy by default except the profile/LCP image (`priority`).

**Accessibility requirements.** Skip link; landmark elements (`header`/`main`/`nav`/`footer`); visible focus on all interactive elements; anchor nav operable by keyboard; contrast ≥ WCAG AA; alt text rendered from content model.

**Tests/checks.** RTL smoke: page renders every section with its `id`; nav links point at existing ids. Manual: keyboard tab-through, mobile viewport check, Lighthouse (target ≥ 95 perf / 100 a11y / 100 SEO on the preview deploy).

**Acceptance criteria.** Direct `#section` navigation works; keyboard-only traversal works; mobile layout works; all essential professional info visible without JS (verify with JS disabled); production build passes; CI green; Lighthouse recorded in `docs/perf-baseline.md`.

**Non-goals.** No mode switching behavior, no Card Mode code, no Zustand, no Motion animations beyond CSS transitions, no analytics.

**Suggested Claude task prompts.**
- "Implement the root layout, metadata, shell (header, anchor section nav, footer) and empty section scaffolding per the plan. Server Components only; ModeToggle as a disabled client-island placeholder."
- "Implement the About, Skills, Experience, Education, Contact and CV classic sections from src/content. Semantic HTML, tokens from globals.css."
- "Implement the Projects classic section: responsive grid from content, next/image with dimensions, links from the content model."
- "Add robots.ts, sitemap.ts, not-found page and OG metadata; verify heading hierarchy and skip link."
- "Add a GitHub Actions CI workflow running typecheck, lint, test and build."

---

### PHASE 3 — Mode system and synchronization

**Objective.** Working dual-mode architecture: hydration-safe persisted mode, active-section state synced with the URL hash, mode switch preserving section — proven against a cheap Card Mode placeholder.

**Why now.** This is the riskiest *architectural* part (hydration, persistence, URL sync). Doing it against a placeholder isolates those risks from visual complexity; Phase 4 then builds visuals on solid ground.

**Files/modules affected (new, proposed).**
- `src/state/portfolio-store.ts` — Zustand: `{ mode, activeSection, setMode, setActiveSection }`.
- `src/state/use-hash-sync.ts` — hash ↔ activeSection two-way sync (hashchange listener + `history.replaceState` on section change; `pushState` only for explicit nav clicks so back/forward stays sane).
- `src/components/shell/ModeToggle.tsx` — enabled; accessible switch semantics.
- `src/components/shell/ModeRoot.tsx` (client) — decides which renderer is visible; Classic children stay server-rendered and are passed through as `children`; rogue renderer dynamically imported.
- `src/app/layout.tsx` — inline no-flash script: read `localStorage.mode` before paint, set `data-mode` on `<html>`.
- `src/features/rogue/RoguePlaceholder.tsx` (client, dynamically imported) — minimal board listing sections as plain cards; enough to test sync, deliberately unstyled-ish.

**Implementation tasks.**
1. Store + types (`PortfolioMode` already in domain types). Persist mode to `localStorage` on change.
2. No-flash strategy: inline script sets `data-mode` pre-paint; `ModeRoot` initializes store from `document.documentElement.dataset.mode` on mount. Classic HTML is the server-rendered default (crawlers and first-time visitors always get it — no stored preference). When mode is `rogue`, `ModeRoot` **unmounts the classic subtree** and mounts the rogue renderer; switching back unmounts rogue and remounts classic. Only one complete renderer is mounted at any time; only store state (mode, activeSection) survives the switch; each renderer's JS chunk stays naturally cached so remounting is cheap. Verify no hydration warnings (renderer swap happens post-hydration; for stored-rogue users a CSS `data-mode` rule hides classic pre-paint and a lightweight static placeholder covers the rogue chunk load).
3. Hash sync hook: on load, `location.hash` → `activeSection` (validated against `SectionId`); on section change via UI, update hash; on hashchange (back/forward), update store. Classic "active section" additionally driven by scroll via `IntersectionObserver` (observe section elements, update store + `replaceState`).
4. Mode switch preserving section: switching to rogue opens the board with `activeSection`'s card highlighted/selected; switching to classic scrolls to `#activeSection`.
5. Explicit test cases (automate in Vitest/RTL where jsdom allows; manual checklist otherwise): (a) Classic Projects → Card → Projects selected; (b) Card Skills → Classic → `#skills` visible; (c) direct load `#projects` in either mode; (d) stored rogue preference + `#contact` deep link, no flash; (e) toggle fully keyboard-operable.
6. Run `architecture-review` skill on the result before closing the phase.

**Architectural decisions.** localStorage + inline script vs cookie/SSR (recommend inline script: keeps pages fully static, no per-request rendering); renderer switching = unmount inactive, remount on return (chunk warm ≠ component mounted — SEO is served by the default server-rendered classic HTML, not by keeping classic mounted for rogue users); hash writing policy (`replaceState` for scroll-driven changes, `pushState` for click nav).

**Dependencies.** P2 shell; Zustand (new dep — justified: mode/section shared across header toggle, classic scroll spy, rogue board).

**Risks.** Hydration mismatch from reading storage during render (mitigate: read only in effects/inline script, never in render); scroll-spy fighting hash navigation (suppress observer updates during programmatic scroll); back/forward behavior surprising (keep history entries only for explicit nav).

**Performance budget/concerns.** Zustand ~1 kB. Placeholder rogue chunk must already be a **separate dynamic chunk** — the boundary created here is the one Phase 5 enforces. Inline script < 1 kB, blocking by design but trivial.

**Accessibility requirements.** Toggle: real `<button>` with `aria-pressed` (or radio group), visible focus, operable via keyboard/touch/click; mode switch moves focus sensibly (to the active section/card container); no keyboard trap in either mode.

**Tests/checks.** Unit: hash↔store sync logic, SectionId validation of arbitrary hashes, store transitions. RTL: toggle keyboard operation, section preservation across mode switch. Manual: the 5 scenario cases on the Vercel preview, hydration-warning check in console.

**Acceptance criteria.** All 5 scenarios pass; no hydration warnings; no duplicated navigation state (one store, hash derived); minimal/no visible flash with stored preference; toggle accessible; rogue placeholder is a lazy chunk (verify in build output).

**Non-goals.** No drag, no card visuals/animations, no Motion, no dnd-kit, no preloading tuning (P5).

**Suggested Claude task prompts.**
- "Implement the Zustand portfolio store (mode, activeSection) and the hash-sync hook with the history policy from the plan. Include Vitest tests. No UI."
- "Implement the no-flash inline mode script and ModeRoot client boundary: classic stays server-rendered children, rogue placeholder dynamically imported, hidden+inert switching."
- "Enable ModeToggle with accessible switch semantics and intent-free mode switching that preserves activeSection both directions."
- "Add scroll-spy via IntersectionObserver for classic mode, suppressing updates during programmatic scrolls, and wire the 5 synchronization scenarios as tests/manual checklist."

---

### PHASE 4 — Card Mode static experience

**Objective.** A fully usable, original-looking Card Mode via click, keyboard and tap: board, hand/deck of section cards, expanded card views rendering the same content as Classic.

**Why now.** Mode plumbing (P3) is stable, so this phase is purely presentational + interaction-state work. Doing it before drag (P6) keeps accessibility primary and drag an enhancement.

**Files/modules affected (new, proposed).**
- `src/features/rogue/RogueBoard.tsx` (replaces placeholder), `CardHand.tsx`, `SectionCard.tsx`, `ExpandedCard.tsx` (dialog semantics), `card-machine.ts` (state machine), `rogue-tokens.css` (rarity/glow/elevation/card dims as CSS vars layered on global tokens).
- `src/features/rogue/sections/` — thin adapters rendering domain content inside the expanded card (initially one generic `GenericSectionPanel.tsx` for all 7 — differentiation is P7).
- Motion (`motion` package) enters here for card transitions.

**Implementation tasks.**
1. Define the card state machine as data (`idle → focused/hovered → selected → expanded → closing`; `dragging`/`dropCandidate` reserved for P6). Interruptions handled: Escape, mode switch mid-state (reset to idle, preserve activeSection), hash-driven direct expansion, viewport resize, reduced motion.
2. Board layout: responsive hand/fan of 7 section cards (desktop: arc/hand; mobile: grid or horizontal snap list — tap-first, no fan-hover dependence). `cardLabel`/`cardVariant` from section registry.
3. `SectionCard`: real `<button>`, focus-visible styling, hover/focus lift via transform/opacity only.
4. `ExpandedCard`: modal-pattern dialog (`role="dialog"`, focus trap, Escape close, focus restore to originating card) or inline expansion — recommend dialog on mobile, inline board takeover on desktop, same component semantics.
5. Sync: expanding a card sets `activeSection` (hash updates); direct `#hash` load in rogue mode opens that card expanded (case from P3 keeps passing).
6. Reduced motion: `prefers-reduced-motion` swaps transitions for instant/fade — full functionality preserved; build this into the motion helpers now, not per-component later.
7. Visual system: original tokens (rarity tiers as border/glow treatments, original iconography via icon identifiers) — no Slay the Spire asset/UI copying.
8. Run `card-interaction-review` and `accessibility-review` skills before closing.

**Architectural decisions.** Dialog vs inline expansion per breakpoint; card layout (arc vs grid) per breakpoint; rarity mapping (what rarity means for sections/projects — presentation metadata from P1); Motion usage boundaries (transform/opacity, 150–300 ms, no idle loops).

**Dependencies.** P3; Motion (new dep — justified: spring/exit animations and layout transitions beyond comfortable CSS); design tokens from P2.

**Risks.** Scope creep on visual polish (timebox: system first, beauty iterates); expanded-card content diverging from Classic (guard: both render the same content exports — no copy in components); mobile fan layouts that need hover (banned by design).

**Performance budget/concerns.** Rogue chunk (board + Motion + tokens) target ≤ ~60 kB gz at this stage; no layout-thrashing animations (transform/opacity only); no continuous animation loops; images inside expanded cards lazy-loaded. Add a bundle-size check note to CI output (formal budget enforcement in P5).

**Accessibility requirements.** Every card reachable/activatable by keyboard (Tab/Enter/Space) and tap; roving tabindex or natural tab order across the hand (with arrow-key navigation optional); dialog semantics correct; focus restoration on close; reduced-motion complete; state never conveyed by color alone (rarity has shape/border cues too).

**Tests/checks.** Unit: card state machine transitions incl. interruptions. RTL: keyboard open/close/focus-restore, hash-driven expansion. Manual on preview: touch behavior, reduced-motion (OS setting), 320 px viewport.

**Acceptance criteria.** Every card fully operable without drag or pointer; content identical to Classic (same source); P3 sync scenarios still green; mobile coherent; reduced motion functionally complete; no console errors; visual system original.

**Non-goals.** No dnd-kit/drag, no section-specific mechanics (P7), no 3D, no preload tuning (P5).

**Suggested Claude task prompts.**
- "Implement card-machine.ts as a typed state machine with Vitest tests covering all transitions and interruption cases. No components."
- "Implement RogueBoard, CardHand and SectionCard replacing the placeholder: responsive hand (desktop) / tap-first grid (mobile), keyboard and tap activation, tokens in rogue-tokens.css."
- "Implement ExpandedCard with dialog semantics, focus management, Escape/close/restore, and the GenericSectionPanel rendering each section's content from src/content."
- "Wire card expansion to activeSection/hash both directions and add reduced-motion handling to the shared motion helpers. Re-run the P3 scenario tests."

---

### PHASE 5 — Lazy loading and mode preload strategy

**Objective.** Documented, implemented and **measured** bundle boundaries: classic-first critical load, rogue as an intent-preloaded chunk, graceful behavior when preload hasn't finished.

**Why now.** Before drag (P6) adds dnd-kit weight, boundaries must exist so new libraries land in the right chunk by default rather than being untangled later.

**Files/modules affected.**
- `src/components/shell/ModeRoot.tsx`, `ModeToggle.tsx` (preload triggers), new `src/features/rogue/preload.ts` (single `import()` entry the toggle can warm), `next.config.ts` (bundle analyzer in CI), `docs/architecture.md` (tier table updated to reality), `.github/workflows/ci.yml` (size check).

**Implementation tasks.**
1. Define and document the tier map: **Critical** = shell, classic sections, toggle, store, hash sync. **Mode chunk** = RogueBoard/CardHand/SectionCard/ExpandedCard + Motion (stays out of critical since only rogue imports it). **Intent preload** = the rogue chunk, triggered on toggle `pointerenter`/`focus`/`touchstart` (once). **Interaction load** = heavier expanded-card media, P7 section modules. **Expensive/absent** = Three.js/R3F (nothing imports it).
2. Implement `preload.ts` warm-up; guard against duplicate loads; no preload on `(prefers-reduced-data)`/`saveData` connections.
3. Loading state: toggle click before preload completes shows a static skeleton board (CSS only, real card-shaped placeholders, no layout shift) until the chunk resolves; instant swap after.
4. Verify Motion is not in the critical chunk using the bundler-appropriate analysis: `next build` route table plus, for Next 16+ default Turbopack, the built-in Turbopack analyzer — do **not** switch the production build to Webpack just to run `@next/bundle-analyzer`. Confirm classic page JS unchanged from P2 (± few kB for preload wiring).
5. Exercise the stress cases: slow 3G throttle switch-before-preload; toggle repeatedly (no duplicate mounts, listeners cleaned up); return to classic (rogue **unmounts**; its chunk stays cached by the runtime, so re-switching remounts near-instantly with no re-download — verify in the network tab).
6. Record measurements in `docs/perf-baseline.md`; run `performance-review` skill.

**Architectural decisions.** Switch-back policy is fixed: **unmount the inactive renderer, preserve only domain/navigation state, rely on natural chunk caching for cheap remount** (chunk warm ≠ component mounted); preload trigger set; whether dnd-kit (P6) joins the rogue chunk or a deeper interaction chunk (provisional: separate `import()` preloaded on board pointer-enter — see P6; revisit with measurements).

**Dependencies.** P4; bundle-analysis tooling matching the production bundler (Turbopack built-in analyzer for Next 16+; `@next/bundle-analyzer` only if the build actually uses Webpack).

**Risks.** Accidental static import from shell → rogue collapsing chunks (guard: ESLint `no-restricted-imports` rule from shell/classic paths into `src/features/rogue`); skeleton flash-of-loading feeling worse than a spinner (tune with real throttling).

**Performance budget/concerns.** This phase *sets* the enforced budget: critical route JS ≤ baseline + 20 kB gz; rogue chunk ≤ 80 kB gz (incl. Motion); zero Three.js bytes anywhere. CI fails on breach.

**Accessibility requirements.** Loading skeleton announced politely (`aria-busy` on the board region); toggle stays operable during load; focus not lost when the real board replaces the skeleton.

**Tests/checks.** Build-output assertions in CI (chunk sizes, no `three` in any chunk); manual throttled-network runs; repeated-toggle memory/listeners check via DevTools.

**Acceptance criteria.** Both renderers never simultaneously *active*; intent preload works (network tab shows chunk on hover/focus); initial page contains no rogue/Motion/3D code; post-preload switch feels instant; pre-preload switch shows stable skeleton, no layout shift; measurements recorded.

**Non-goals.** No dnd-kit yet, no 3D, no image/font optimization passes (P9).

**Suggested Claude task prompts.**
- "Implement intent-based preload of the rogue chunk from ModeToggle (pointerenter/focus/touchstart, once, honoring saveData) plus the CSS skeleton loading state."
- "Set up bundle analysis matching the production bundler (Turbopack analyzer for Next 16+) and a CI check enforcing: critical route JS budget, rogue chunk budget, zero three.js. Record current numbers in docs/perf-baseline.md."
- "Add an ESLint no-restricted-imports rule preventing shell/classic modules from statically importing src/features/rogue."
- "Implement the switch-back policy: unmount the inactive renderer, preserve only store state, rely on chunk caching for remount; verify repeated toggling leaks no listeners and re-downloads nothing."

---

### PHASE 6 — Card drag/drop interaction

**Objective.** Desktop drag-a-card-to-the-center-to-open as a progressive enhancement over the fully working click/keyboard/tap Card Mode.

**Why now.** Everything it enhances exists and is measured; dnd-kit lands in a pre-planned chunk; regressions are detectable against P4/P5 acceptance baselines.

**Files/modules affected.**
- `src/features/rogue/drag/` (new): `DragProvider.tsx`, `DraggableCard.tsx`, `DropZone.tsx`, `use-drag-machine.ts` (extends `card-machine.ts` states `dragging`, `dropCandidate`); `SectionCard.tsx` and `RogueBoard.tsx` gain drag wiring; `preload.ts` gains the drag chunk hook.

**Implementation tasks.**
1. Add dnd-kit (`@dnd-kit/core`; only add `@dnd-kit/sortable` etc. if actually needed — probably not for open-card semantics). Loading chain: **Card Mode loaded → pointer enters the card board → preload the dnd-kit chunk → by first `pointerdown`, drag is immediately available.** If a pointerdown races an unfinished preload, the interaction falls back to plain click — never a dead press.
2. Responsibility split (enforce in review): **dnd-kit** owns gesture recognition, sensors, semantic drop state (over/accepted/cancelled). **Motion** owns visual presentation: lift transform, drop-zone highlight animation, snap-back spring, open transition. **State machine** owns truth: dnd-kit events dispatch machine transitions; components render from machine state. No transform math duplicated across libraries.
3. Behaviors: activation constraint (small distance threshold so click still works); central drop zone opens the card (same code path as click-open); invalid drop → animated snap-back to hand; Escape cancels drag; drag overlay for the lifted card if hand layout makes in-place transform awkward.
4. Interruption handling: viewport resize mid-drag (cancel + restore), mode switch mid-drag (cancel, reset machine, preserve activeSection), pointer cancellation (browser-initiated), focus restoration after cancelled drag.
5. Keyboard: dnd-kit's keyboard sensor optional; the click/Enter path from P4 remains the primary keyboard interaction — do not force keyboard users through drag semantics.
6. Mobile: drag not wired for touch (tap-first stands); ensure touch sensors don't hijack scroll.
7. Re-run `card-interaction-review` + P3/P4 test suites.

**Architectural decisions.** Activation distance threshold; overlay vs in-place transform; whether drag chunk merges into rogue chunk if measurement says the split isn't worth it (~10 kB for @dnd-kit/core — merging is acceptable; decide from P5 CI numbers).

**Dependencies.** P4 (machine, cards), P5 (chunk plan); `@dnd-kit/core` (new dep — justified: semantic, accessible drag primitives; hand-rolled pointer drag with correct cancellation/sensors is more code and more bugs).

**Risks.** Drag threshold breaking plain clicks (test both); Motion layout animations fighting dnd-kit transforms (keep transform owners disjoint per split above); scroll-jank on touch if sensors misconfigured.

**Performance budget/concerns.** Drag adds ≤ ~15 kB gz to rogue-side chunks (CI enforced); dragging animates transform only; no re-render storms (machine state granular, cards memoized).

**Accessibility requirements.** All P4 keyboard/tap paths untouched and still primary; drag state announced (`aria-grabbed` era patterns are deprecated — use live region announcements dnd-kit provides); Escape cancels; focus restored after cancel/drop.

**Tests/checks.** Machine unit tests for new states + interruptions; RTL for click-still-works with drag wired; manual desktop drag matrix (drop, invalid drop, Escape, resize mid-drag, mode-switch mid-drag); touch scroll check on real device.

**Acceptance criteria.** Everything works with drag never used; keyboard flow unchanged; no layout jank while dragging; activeSection never corrupted by any interrupted interaction; mode switch mid-drag resets cleanly; mobile unchanged; bundle budgets hold.

**Non-goals.** No sortable/reorderable hands, no drag on mobile, no multi-card interactions, no section-specific drop targets (P7 may add).

**Suggested Claude task prompts.**
- "Extend card-machine.ts with dragging/dropCandidate states and interruption transitions (resize, mode switch, pointer cancel, Escape). Tests first."
- "Implement DragProvider/DraggableCard/DropZone with @dnd-kit/core per the responsibility split in the plan; dnd-kit events only dispatch machine transitions."
- "Wire the drag chunk preload on board pointer-enter so drag is ready by first pointerdown, with click fallback if the preload hasn't finished; verify chunk placement against the P5 CI budgets."
- "Run the drag interruption matrix and fix regressions: click-through, Escape, resize mid-drag, mode switch mid-drag, touch scroll."

---

### PHASE 7 — Section-specific interactions (scoped)

**Objective.** Distinct identities for the highest-value sections — recommended scope: **Projects (Relic Collection)**, **Experience (Quest Map)**, **Contact (Merchant-style direct actions)** — while About/Skills/Education/CV keep the polished generic panel.

**Why now.** Generic Card Mode is complete; differentiation is now additive content presentation, not architecture. Scoping to 3 sections caps the plan's biggest scope-explosion risk (structural change vs the brief, declared in §3).

**Files/modules affected.**
- `src/features/rogue/sections/ProjectsPanel.tsx` (project sub-cards grid with per-project expand), `ExperiencePanel.tsx` (vertical node path — CSS, not canvas), `ContactPanel.tsx` (direct action buttons: mail, LinkedIn, GitHub, CV download). Each a lazy `import()` loaded when its card expands (interaction tier). `GenericSectionPanel.tsx` remains for the rest.

**Implementation tasks.**
1. Projects: relic-grid of project cards (rarity from tags/impact), tap/click/Enter expands per-project detail in place; media lazy.
2. Experience: chronological node path (semantic `<ol>`, styled as quest nodes); each node expandable; reduced motion = no path-draw animation, everything visible.
3. Contact: real actions (`mailto:`, external links, CV file) styled as merchant offers — every action a real `<a>`/`<button>` with clear labels; theme never obscures what the action does.
4. Per-panel evaluation gate (professional clarity / cost / bundle / a11y / mobile) recorded as a short note in the PR description; drop any concept failing clarity.
5. Run `accessibility-review` on the three panels.

**Architectural decisions.** Which 3 sections (recommended above — Projects is the recruiter-critical one, Experience benefits most from spatial metaphor, Contact is cheap and high-delight); whether project sub-cards reuse `SectionCard` primitives (they should — extract shared card primitives only when the second consumer exists, i.e. now).

**Dependencies.** P4 (panels slot into ExpandedCard), P5 (interaction-tier loading), P6 optional (panels must not require drag).

**Risks.** Theme obscuring information (gate 4); per-panel bundle creep (each panel ≤ ~10 kB gz, CI-watched); Experience visualization turning into an art project (CSS-only constraint).

**Performance budget/concerns.** Panels are interaction-tier chunks; expanding a card on slow network shows the generic panel skeleton; total rogue-side JS stays ≤ 120 kB gz across all chunks.

**Accessibility requirements.** Sub-cards keyboard-operable like section cards; node path is a semantic list; contact actions have accessible names describing the real action ("Email Manuel", not "Trade").

**Tests/checks.** RTL per panel (content present, keyboard expand); sync regression suite; manual mobile pass per panel.

**Acceptance criteria.** Three sections visibly distinct; all information findable within one interaction from the expanded card; nothing requires drag; remaining sections still coherent on the generic panel; budgets hold.

**Non-goals.** No differentiation for About/Skills/Education/CV (post-MVP backlog); no minigames; no 3D.

**Suggested Claude task prompts.**
- "Implement ProjectsPanel (relic grid with expandable project detail) as an interaction-tier lazy chunk reusing card primitives. Keyboard-first."
- "Implement ExperiencePanel as a semantic CSS-only quest path over the experience content, reduced-motion complete."
- "Implement ContactPanel with real mailto/link/CV actions styled as merchant offers; accessible names state the real action."

---

### PHASE 8 — Optional 3D experiment (explicitly optional)

**Objective.** Evidence-based go/no-go on one small 3D flourish (a single game-dev project card with a lightweight R3F scene), behind the reserved seam, removable without trace.

**Why now (if at all).** Only after budgets and UX goals are demonstrably met (P5/P7 CI green, Lighthouse ≥ targets). Otherwise skip directly to P9 — **default recommendation: skip unless a compelling model/scene asset already exists**, since the portfolio's game-dev credibility is carried by the projects themselves.

**Files/modules affected.** `src/features/rogue/three/` (new, isolated): spike component + loader; imported *only* by one project detail panel via user-triggered `import()` (explicit "view 3D" affordance, never automatic).

**Implementation tasks.**
1. Spike on a branch: R3F + three, one compressed model (≤ 500 kB target, draco/meshopt), Suspense fallback, render loop stops on unmount/offscreen/hidden tab, `prefers-reduced-motion` = static poster image, mobile = poster by default.
2. Measure: added JS (three+R3F ~150 kB gz — this is why it's user-triggered), model transfer, interaction FPS, idle CPU/GPU, mobile thermals.
3. Go/no-go against admission criteria (ADR-6). No-go → delete branch, record decision.

**Architectural decisions.** Admission criteria numbers (ADR-6); poster-first vs auto-load on desktop (poster-first).

**Dependencies.** P7 (a project panel to host it); `three` + `@react-three/fiber` (only installed on the spike branch); a real model asset (blocker if none exists — do not build placeholder 3D for its own sake).

**Risks.** Sunk-cost shipping of a spike that fails criteria (mitigate: criteria written *before* the spike); chunk leakage into rogue chunk (ESLint import rule extended to `three`).

**Performance budget/concerns.** Zero bytes in critical and rogue chunks (CI already enforces); 3D chunk + model loaded only on explicit user action; render loop provably stops (DevTools performance recording attached to the PR).

**Accessibility requirements.** 3D is decorative-plus: all information available without it; poster fallback has alt; no motion without consent on reduced-motion.

**Tests/checks.** CI byte checks; manual FPS/CPU measurements recorded in the ADR.

**Acceptance criteria.** Either: shipped meeting all admission criteria, or: not shipped and ADR-6 records the measured reasons. Both outcomes are success.

**Non-goals.** No 3D navigation, no 3D board, no WebGL-gated content.

**Suggested Claude task prompts.**
- "On a spike branch, implement the isolated R3F scene for one project card per the plan (user-triggered load, poster fallback, loop stops offscreen). Record all measurements in the PR."
- "Evaluate the spike against ADR-6 admission criteria and either integrate behind the explicit affordance or close the branch documenting the numbers."

---

### PHASE 9 — Performance / accessibility hardening

**Objective.** Final audit sweep on an already-healthy app: verify, tighten, and fix leaks — not re-architect.

**Why now.** All features exist; audits now cover the true final shape.

**Files/modules affected.** Small targeted fixes anywhere; `docs/perf-baseline.md` final numbers.

**Implementation tasks.**
1. Bundle analysis pass (analyzer report reviewed chunk by chunk; kill accidental inclusions).
2. Lighthouse + Web Vitals on the preview: LCP/CLS/INP mobile and desktop.
3. Audits: full keyboard walkthrough both modes; reduced-motion walkthrough both modes; touch device pass; screen-reader smoke (NVDA) on classic + expanded cards.
4. Asset pass: image sizes/formats (AVIF/WebP via next/image), font subsetting/`display: swap`, favicon set.
5. Stress: 20× rapid mode toggling (memory/listeners), long-session idle CPU (no loops running), slow-3G first load and mode switch, direct deep links to every section in both modes.
6. Dependency prune (`npm ls` review, remove anything unused) and client-boundary review (`"use client"` count justified).
7. Run `performance-review` + `verify-feature` skills.

**Architectural decisions.** None expected — findings that require architecture changes are flagged as failures of earlier phases and triaged explicitly, not silently absorbed.

**Dependencies.** P2–P7 complete (P8 optional outcome included if shipped).

**Risks.** Audit findings ballooning into feature work (timebox; fix-forward only).

**Performance budget/concerns.** Final enforcement of §7 budgets; Lighthouse mobile ≥ 95 perf, 100 a11y, 100 SEO on classic-first load.

**Accessibility requirements.** This phase *is* the a11y audit; exit requires the keyboard/reduced-motion/touch/SR passes documented.

**Tests/checks.** All CI suites green; audit checklist committed to `docs/`.

**Acceptance criteria.** Budgets met and CI-enforced; zero console errors; all audit walkthroughs pass; deep links verified across modes and devices.

**Non-goals.** No new features, no visual redesign, no analytics.

**Suggested Claude task prompts.**
- "Run the bundle analyzer and produce a chunk-by-chunk report with fixes for any unintended inclusions. Apply the fixes."
- "Execute the stress checklist (rapid toggling, long-session idle CPU, slow-3G, deep links) and fix every leak or jank found, documenting results in docs/."
- "Do the keyboard + reduced-motion + touch + NVDA walkthroughs in both modes and fix findings. Commit the audit checklist."

---

### PHASE 10 — Content / case study polish and release

**Objective.** Professional release: rewritten content, correct metadata, production cutover on Vercel.

**Why now.** Copy rewriting is independent of engineering phases and highest-leverage last, when the presentation it lands in is final.

**Files/modules affected.** `src/content/*` (copy rewrite), `public/` (media refresh, CV), metadata in `layout.tsx`, `docs/legacy-content/` (retire), README.

**Implementation tasks.**
1. Rewrite all professional copy: positioning statement (junior game developer → current accurate level), per-project problem/role/responsibilities/stack/impact with concrete facts (the current "Asteroids but NO!"-style blurbs are replaced); English proofread.
2. Curate projects: feature the strong ones (Sopa, RTB, PBD), consider demoting learning exercises (Clicker Test, Meteoritos, Saltarina) to a compact "smaller works" group in content — content-level decision, no code change needed.
3. Media: fresh screenshots where old ones are stale, OG/social card image, favicon set, CV PDF current and linked.
4. Metadata: titles/descriptions per deployment domain, structured data (Person JSON-LD) if cheap.
5. Decide legacy `shots`/`posts` content fate (recommend: drop unless the user wants them; they're not part of the 7-section model).
6. Vercel production cutover: promote `portfolio_v2` → production domain; decide custom domain vs `*.vercel.app`; update LinkedIn/GitHub profile/CV links from the old GitHub Pages URL; keep old GitHub Pages up briefly or replace with a redirect page from `master`.
7. Analytics: only if user wants it — Vercel Analytics is the zero-config option; default is none.
8. Final `verify-feature` + release.

**Architectural decisions.** Custom domain; old-URL redirect strategy; analytics yes/no (user call).

**Dependencies.** P9; user input on copy facts (roles, dates, impact) and domain choice — the one phase genuinely blocked on the user.

**Risks.** Copy quality bottleneck (draft with Claude, user reviews); dead old URLs in the wild (mitigate with redirect page on GitHub Pages).

**Performance budget/concerns.** New media respects image budgets; JSON-LD is bytes, fine.

**Accessibility requirements.** New media has alt text; rewritten copy keeps link purposes clear.

**Tests/checks.** Content validation suite still green (it guards the rewrite); link checker over all external links; social-card preview check.

**Acceptance criteria.** Production live on Vercel; old links redirected or updated; content professional and accurate; all CI green; release tagged.

**Non-goals.** No new features; no blog; no CMS.

**Suggested Claude task prompts.**
- "Draft rewritten content for src/content/projects.ts following the problem/role/responsibilities/stack/impact structure, flagging every fact that needs user confirmation."
- "Implement final metadata: per-page titles/descriptions, OG image, favicon set, Person JSON-LD."
- "Prepare the release: Vercel production promotion checklist, GitHub Pages redirect page for master, and the list of external profiles needing the new URL."

---

## 5. Cross-phase dependency map

```
P0 (baseline)
 ↓
P1 (domain/content)
 ↓
P2 (classic) ──────────────┐
 ↓                         │ (deployable milestone #1)
P3 (mode system)           │
 ↓                         │
P4 (card static) ──────────┤ (deployable milestone #2)
 ↓                         │
P5 (lazy/preload)          │
 ↓            ↘            │
P6 (drag)      P7 (section panels)   ← P6 and P7 are parallelizable after P5
      ↘        ↙
       P8 (3D spike, optional; needs P7's project panel)
        ↓
P9 (hardening; needs P6+P7, P8 outcome)
 ↓
P10 (content + release)
```

P6 and P7 are independent of each other (drag never gates panels). P8 is skippable — P9 does not depend on its shipping, only on its decision being recorded.

## 6. Proposed ADRs

Lightweight ADRs in `docs/adr/NNN-title.md`.

1. **One domain model, two renderers.** Decision: single typed TS content layer; renderers are pure consumers. Alternatives: per-mode content files; CMS. Tradeoff: presentation metadata lives beside domain data (accepted coupling) vs guaranteed non-divergence of professional copy.
2. **Fresh scaffold + Vercel (supersedes architecture.md migration note & GitHub Pages).** Decision: rebuild on `portfolio_v2`, deploy Vercel, old site frozen on `master`. Alternatives: incremental in-place migration; stay on GitHub Pages static export. Tradeoff: loses "every step deployable on the old URL" but the site is small enough that a rewrite is cheaper than a stepwise Next 12→15 + Chakra→Tailwind migration; Vercel unlocks next/image and no basePath at the cost of URL migration (handled P10).
3. **Mode persistence: localStorage + pre-paint inline script; one mounted renderer.** Decision: `data-mode` set by a blocking inline script; pages stay fully static; classic HTML is the server-rendered crawlable default; the interactive session mounts exactly one renderer at a time — switching unmounts the inactive one, preserving only domain/navigation state, with its chunk naturally cached for cheap remount. Alternatives: cookie + dynamic SSR per mode; useEffect-only (flashes); hidden+inert dual-DOM. Tradeoff: stored-card users get a skeleton (not classic flash) for one chunk-load; switch-back pays a remount instead of a reveal — cheap, and it keeps the single-renderer invariant enforceable.
4. **URL strategy: hash-only section identity, mode never in URL.** Decision: `#section` deep links; `replaceState` for scroll-spy, `pushState` for explicit nav. Alternatives: mode-specific routes; query param mode. Tradeoff: shared links always open the recipient's (or default classic) mode — a feature, not a bug, for recruiter links.
5. **Loading tiers & chunk ownership (incl. Motion/dnd-kit placement).** Decision: rogue chunk = board + Motion; drag = deferred sub-chunk (merge if measurement says split is overhead); ESLint import fences; CI byte budgets. Alternatives: everything in one rogue chunk; eager preload of all. Tradeoff: a bit of dynamic-import ceremony for guaranteed critical-path purity.
6. **Motion vs dnd-kit responsibility + 3D admission criteria.** Decision: dnd-kit = sensors/gesture/drop semantics; Motion = all visual transforms/springs; state machine = source of truth. 3D admitted only if: user-triggered, ≤ 500 kB model, no frame drops on mid mobile, loop stops when hidden, zero bytes pre-trigger. Alternatives: Motion-only hand-rolled drag (more code, worse a11y); auto-loading 3D (budget breach). Tradeoff: two animation-adjacent libraries coexist, controlled by the ownership rule.

## 7. Performance budget

No meaningful absolute numbers exist until P0 measures the scaffold; budgets below are anchored to the measured scaffold baseline (First Load JS recorded in P0 with exact framework versions) and standard Core Web Vitals thresholds, then locked with real numbers in P0/P5.

| Metric | Type | Value |
|---|---|---|
| Three.js/R3F bytes in critical or rogue chunks | **hard** | 0 |
| Both renderers actively running simultaneously | **hard** | never |
| Critical route First Load JS | target | ≤ baseline + 20 kB gz (lock number in P5 CI) |
| Rogue chunk (board + Motion) | target | ≤ 80 kB gz |
| Drag sub-chunk | target | ≤ 15 kB gz |
| Total rogue-side JS (all chunks, P7 done) | target | ≤ 120 kB gz |
| Section panel chunks (P7) | target | ≤ 10 kB gz each |
| LCP (mobile, classic first load) | target | ≤ 2.5 s (CWV "good") |
| CLS | target | ≤ 0.1, incl. mode-switch skeleton |
| INP | target | ≤ 200 ms incl. during drag |
| Lighthouse (mobile, prod) | target | ≥ 95 perf / 100 a11y / 100 SEO |
| Idle runtime work (either mode, no interaction) | **hard** | no rAF/animation loops |
| Per-image payload (optimized output) | target | ≤ 150 kB; LCP image prioritized |
| 3D model (only if P8 ships) | hard gate | ≤ 500 kB transfer, user-triggered only |
| Baseline scaffold numbers | measure | collected in P0, revised into CI in P5 |

## 8. MVP definition

Milestone ladder: **Feature-complete MVP** = P0–P5 · **Enhanced MVP** = + P6 + Projects panel from P7 · **Release candidate** = + P9 · **Production release** = + P10.

**MVP MUST HAVE (Feature-complete MVP)** — P0–P5 complete: fresh baseline on Vercel; typed content model + validation; full Classic (SEO, a11y, mobile); mode system with persistence, no-flash, hash sync, section preservation; Card Mode fully usable via click/keyboard/tap; enforced lazy-loading boundaries with intent preload. *This is professionally deployable with zero drag and zero 3D.*

**MVP SHOULD HAVE (Enhanced MVP)** — P6 drag/drop; P7's Projects panel (the recruiter-critical differentiation). **Justification for drag = SHOULD, not MUST:** Card Mode's identity reads through visuals + card metaphor already at P4; drag adds desktop delight but no information access, mobile (a large share of recruiter first-visits) never sees it, and shipping earlier matters more than the flourish. If timeline allows, include it; never block release on it.

**POST-MVP** — P7 Experience + Contact panels and any further section differentiation; P9 formal hardening pass gates the **Release candidate** (budgets are CI-enforced from P5, so hardening is polish, not rescue); P10 gates the **Production release** — copy rewrite may continue landing incrementally after launch; custom domain; analytics decision.

**EXPERIMENTAL** — P8 3D spike; any additional card mechanics (deck shuffling, card flip reveals); dark-mode toggle for Classic.

## 9. Critical review

**Architecture concerns.**
- The single-mounted-renderer rule (ADR-3) depends on the classic subtree being cleanly remountable: any classic component that accumulates client-side state outside the store would lose it on a mode round-trip. Guard: classic stays Server-Component-pure (toggle aside), and the P3 test suite includes a classic → rogue → classic round-trip assertion.
- Presentation metadata (`rarity`, `cardVariant`) living in the content layer slightly couples domain to Card Mode. Accepted (ADR-1) — but keep it to identifiers, never styling values, or the content layer becomes a theme file.
- `docs/architecture.md` says "incremental, not rewrite" — now superseded by the user's fresh-scaffold decision. P1 must update the doc, or every future session inherits a contradiction.

**Scope risks.**
- **P7 is the blowout risk** (seven themed mini-UIs). Mitigated by scoping to 3 panels with a written per-panel value gate. Hold that line.
- **Card visual polish (P4)** can absorb unlimited time. Timebox; the system (tokens, states, machine) is the deliverable, beauty iterates post-launch.
- **P10 copy rewrite** depends on the user supplying facts; start collecting them early (P1 harvest flags gaps) instead of discovering the bottleneck at release.

**Features to postpone.** 3D (default: skip); Experience/Contact themed panels (post-MVP); deck-shuffle/idle card animations (conflict with no-idle-loop rule anyway); analytics; blog/shots/posts revival; custom domain (decide at P10, not before).

**Simplifications.**
- One page, hash navigation, no per-project routes — cuts routing complexity; case-study pages only if P10 content genuinely outgrows in-page blocks.
- Generic expanded panel for 4 of 7 sections — most users won't inventory the difference; the 3 differentiated panels carry the concept.
- No Playwright until proven necessary; jsdom + manual preview checks cover the sync matrix at this app's size.
- Plain TS content — no MDX/CMS until long-form content exists.

**Unknowns requiring prototypes.**
- **No-flash stored-card-mode load feel** (skeleton acceptability on slow networks) — cheap prototype inside P3, tune in P5; can't be judged from reading code. Recommended default: ship skeleton, judge on throttled preview.
- **Hand/fan layout ergonomics on small desktop + tablet widths** — needs the P4 build in hands, not analysis. Default: fall back to grid below a width threshold.
- Everything else (persistence, sync, chunking, drag mechanics) is standard engineering — no prototypes needed.

## 10. Recommended first implementation task

**P0, task 1 — content harvest before deletion:** "Harvest all professional copy, project data, image references and the CV location from the legacy pages into `docs/legacy-content/*.md` (read-only against app code)." It's zero-risk, unblocks the destructive scaffold step, and surfaces the content-fact gaps that P10 will need from the user — the plan's only true external dependency — on day one. Immediately after: the scaffold task (P0 task 2).

## Verification (plan-level)

Each phase self-verifies via its Tests/checks + acceptance criteria; cross-cutting: CI (typecheck, lint, Vitest, build, byte budgets from P5) green at every merge; Vercel preview manually checked against the phase's scenario list; project skills (`architecture-review` P3, `card-interaction-review` P4/P6, `accessibility-review` P4/P7, `performance-review` P5/P9, `verify-feature` before every phase close) run at the named checkpoints.
