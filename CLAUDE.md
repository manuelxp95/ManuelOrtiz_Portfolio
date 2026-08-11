# Manuel Ortiz Portfolio — CLAUDE.md

## Mission
Professional software engineering portfolio with two renderers over one content model:
**Classic** (fast, readable, SEO/recruiter-optimized) and **Card Mode** (roguelike card-game
interaction, original design language — never copies Slay the Spire assets/UI). This is a
portfolio, not a browser game: usability, performance, accessibility and professional
readability always beat visual spectacle.

Full domain/architecture detail: [docs/architecture.md](docs/architecture.md). Read it before
any architecture-affecting change.

## Current state (read before touching anything)
This repo is a **legacy Next 12 / Pages Router / JS / Chakra UI** site (React 17, framer-motion
v5, `three` already a dependency, deployed to GitHub Pages via `gh-pages`). The rules below
describe the **target** architecture this project is migrating toward. Do not assume the target
stack (App Router, TS strict, Tailwind, Zustand, dnd-kit) exists until it's actually been
introduced — check `package.json`/`tsconfig.json` first. See `docs/architecture.md` for the
migration approach.

## Non-negotiable rules

1. **One source of truth for content.** Portfolio content (about, skills, experience, projects,
   education, contact, cv) lives once in a typed domain/content layer. Classic and Card Mode both
   render it — never duplicate professional copy between them.
2. **Mode is UI state, active section is domain state.** They're independent. Switching mode must
   preserve the active section (id, not mode-specific).
3. **Sections stay deep-linkable** via a stable id (e.g. `#projects`), regardless of mode. Don't
   invent `/classic/x` or `/rogue/x` routes without a strong reason.
4. **Never mount both renderers' expensive runtime simultaneously** just to make switching feel
   fast. Use progressive/tiered loading (critical → preview → intent-based → interaction-based →
   expensive). Full tier breakdown: `docs/architecture.md`.
5. **Three.js / React Three Fiber never ship in the critical bundle.** Lazy-load, isolate behind
   its own client boundary, stop rendering when unmounted/offscreen/hidden.
6. **Drag is never the only way to open a card.** Every draggable card also supports click and
   keyboard. Mobile is tap-first, not a scaled-down desktop drag experience.

## Stack

Next.js (current stable) · App Router · React · TypeScript strict · Tailwind CSS ·
Motion/Framer Motion · dnd-kit (semantic drag/drop) · Zustand (small coordination state only) ·
static generation/export where feasible. React Three Fiber/Three.js are optional, isolated,
lazy-loaded. No Redux, no game engine, no backend unless a concrete need proves one necessary.
Check the existing stack before adding any dependency.

## Performance

Progressive loading tiers (critical/preview/intent/interaction/expensive) — see
`docs/architecture.md`. Intent-based preload is fine (hover/focus on the mode toggle may preload
Card Mode); indiscriminate preloading of all app code is not.

## Accessibility & motion

Both modes fully usable via keyboard, pointer and touch. Semantic HTML and correct
button/link/dialog semantics over decorative divs. Never rely solely on color, hover, drag or
animation to convey state. Visible focus states always. Respect `prefers-reduced-motion` —
reduced motion must stay functionally complete, not just less pretty. Animate transform/opacity;
target ~150–300ms unless spring physics justify otherwise; no continuous idle animation loops.

## SEO / content

Professional content must be crawlable and meaningful without JS/WebGL. Don't gate essential
information behind canvas-only rendering or game interactions.

## Server/client boundaries & state

Server Components by default; `"use client"` only where real interactivity requires it. Keep
client islands narrow — don't make the root page/layout client just for a toggle or one card.
Local component state for ephemeral UI; Zustand only for state genuinely shared across distant
components (mode, active section/card, deck/interface state). Server-renderable content must not
depend on a client store.

## Styling

Tailwind for layout/utility styling. CSS variables/design tokens for spacing, radii, card
dimensions, surface/text colors, rarity states, elevation, timing, glow. CSS modules/dedicated
CSS for complex card effects where Tailwind utilities hurt readability. Prefer CSS over JS for
effects CSS can do.

## Code standards

TypeScript strict, no unnecessary `any`, explicit domain types, small focused components, no
premature abstraction, no generic `utils` dumping ground, no dead code, no commented-out code, no
TODO without a concrete blocker, no dependency without justification.

## Testing

Prioritize: section mapping, mode switching + active-section preservation, URL/hash sync,
keyboard accessibility, content/domain validation, key state transitions. Don't snapshot-test
static markup. Pick the testing stack based on the actual Next.js setup once it exists — don't
assume one now.

## Git

Never force-push, rewrite history, or commit secrets/`.env`/generated build output. No unrelated
refactors inside a scoped task. Before proposing a commit: check `git diff`, flag anything
unrelated. Never commit or push without being asked.

## Definition of done

1. TypeScript passes. 2. Lint passes. 3. Relevant tests pass. 4. Production build succeeds.
5. No console errors. 6. Keyboard flow works. 7. Mobile behavior considered. 8. Reduced-motion
behavior valid. 9. Critical bundle not unnecessarily grown. 10. No content duplicated between
modes.

## Skills

Use the project skills in `.claude/skills/` for their specific workflows instead of improvising:
`architecture-review`, `performance-review`, `accessibility-review`, `feature-plan`,
`verify-feature`, `card-interaction-review`.
