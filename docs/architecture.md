# Architecture

Detail supporting [CLAUDE.md](../CLAUDE.md). Read that first for the non-negotiable rules; this
document is the "why/how" behind them.

## Current state vs target

**Current (as of this doc):** Next 12, Pages Router, plain JS (no `tsconfig.json`), React 17,
Chakra UI, framer-motion v5, `three` already a dependency, deployed to GitHub Pages via
`gh-pages`/`homepage`. Content lives ad hoc inside page/component files — no shared domain layer,
no mode system.

**Target:** Next.js current stable, App Router, TypeScript strict, Tailwind, one typed content
layer rendered by two mode renderers (Classic, Card Mode/"rogue").

**Migration approach:** incremental, not a rewrite-in-place big bang. Introduce
`src/domain`/`src/content` and TypeScript first, behind the existing Pages Router if needed,
before touching the App Router or the rogue renderer. Each migration step should leave the site
deployable. Do not treat this section as fixed — update it as the migration actually progresses;
it will go stale fast if it isn't kept current.

## Domain model

Stable section ids (typed union), e.g.:

```ts
type SectionId =
  | "about" | "skills" | "experience" | "projects"
  | "game-dev" | "backend" | "education" | "contact" | "cv";
```

Section → renderer mapping (same content, different presentation):

| Section    | Classic          | Card Mode            |
|------------|------------------|-----------------------|
| about      | About section    | Character Card        |
| skills     | Skills section   | Skill Deck             |
| experience | Experience       | Quest Map              |
| projects   | Projects         | Relic Collection       |
| education  | Education        | Codex                  |
| contact    | Contact          | Merchant / Contact card|
| cv         | CV               | Scroll / document card |

Project entries should eventually carry: name, short description, problem/context, role,
responsibilities, stack, technical decisions, implementation notes, result/impact, links, repo
(if public), media, tags. Concrete engineering facts over marketing adjectives.

Active section is **domain state**, independent of presentation mode, and must survive a mode
switch (e.g. viewing Projects in Classic → switch to Card Mode → Relic Collection is active).

Mode is internally `classic` | `rogue`. Public UI copy: "Classic" / "Card Mode" — never "Legacy".

## Navigation

Sections are deep-linkable via a stable, lightweight mechanism (e.g. `#projects`), independent of
mode. Avoid mode-specific routes (`/classic/x`, `/rogue/x`) unless a concrete future requirement
forces it.

Mode preference persists locally. Investigate a no-flash approach (e.g. resolving mode before
paint / a blocking inline script / cookie-based initial render) rather than defaulting to
`useEffect` + `localStorage`, which flashes the wrong mode on load.

## Loading tiers

1. **Critical** — page shell, header, initial-mode content, mode toggle, minimal UI, above-fold
   styles.
2. **Lightweight** — minimal preview/skeleton for the alternate mode.
3. **Intent-based** — the alternate renderer and its interaction libraries, preloaded on
   hover/focus/touchstart of the mode toggle.
4. **Interaction-based** — expanded project views, experience visualization, filters, optional
   media.
5. **Expensive** — Three.js, React Three Fiber, 3D models, expensive effects. Never in the
   initial render; lazy, isolated, non-blocking.

Never keep two fully-mounted, fully-active renderers around just to make switching feel
instantaneous — that trades bundle/runtime cost for a UX gain achievable with tier 2 previews +
tier 3 intent preload.

## State boundaries

- Local component state: ephemeral, isolated UI (hover, expanded/collapsed, drag-in-progress).
- Zustand: cross-component coordination only — mode, active section/card, deck/interface state
  that multiple distant components need to read or write.
- Server Components render content directly from the domain/content layer; they must not depend
  on the Zustand store.

## Card interaction states

Card Mode components should be reasoned about as a state machine, not just CSS:
idle → hovered/focused → grabbed/dragged → drop candidate → active → expanded →
closing/restoring. Every state needs a mouse, keyboard and touch path. Handle interruptions:
mode switched mid-interaction, viewport resized, Escape pressed, reduced motion active, card
opened directly via URL/hash.

## 3D isolation

3D lives in `features/portfolio/rogue/three/` (or equivalent) and is imported only by the
specific optional component that needs it — never by the Card Mode root, so a nested optional 3D
feature can't pull Three.js into a shared chunk. Rendering loops stop on unmount, inactive view,
or non-visible tab.
