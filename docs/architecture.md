# Architecture

Detail supporting [CLAUDE.md](../CLAUDE.md). Read that first for the non-negotiable rules; this
document is the "why/how" behind them. The phased execution plan is
[Roadmap.md](Roadmap.md); formal decisions live in `docs/adr/` once written (Roadmap P0).

## Current state vs target

**Current (legacy, frozen):** Next 12, Pages Router, plain JS (no `tsconfig.json`), React 17,
Chakra UI, framer-motion v5, `three` (used by the legacy voxel header), deployed to GitHub Pages.
Content lives ad hoc inside page/component files — no shared domain layer, no mode system.

**Target (v2):** Next.js current stable (App Router, `src/` dir), TypeScript strict, Tailwind CSS
v4, one typed content layer rendered by two mode renderers (Classic, Card Mode/"rogue"),
deployed to **Vercel**.

**Migration approach: fresh scaffold, not in-place migration.** v2 is scaffolded from scratch on
branch `portfolio_v2`, replacing the root app. The legacy site stays untouched and deployable
from `master`. Legacy code is a source of content and reference only — its professional copy is
harvested into `docs/legacy-content/` before the legacy files are removed (Roadmap P0). Each phase
after P0 leaves `portfolio_v2` building and deployable as a Vercel preview; production cutover is
Roadmap P10.

Rendering: static generation (Vercel serves the pages statically); `output: 'export'` is not
required, so `next/image` optimization is available and no `basePath` is needed.

## Domain model

Stable section ids (typed union) — seven top-level sections:

```ts
type SectionId =
  | "about" | "skills" | "experience" | "projects"
  | "education" | "contact" | "cv";
```

Game development, backend and similar domains are **tags** on projects and skills, not
top-level sections: fewer cards, clearer navigation, no duplicate project groupings.

Section → renderer mapping (same content, different presentation):

| Section    | Classic          | Card Mode              |
|------------|------------------|------------------------|
| about      | About section    | Character Card         |
| skills     | Skills section   | Skill Deck             |
| experience | Experience       | Quest Map              |
| projects   | Projects         | Relic Collection       |
| education  | Education        | Codex                  |
| contact    | Contact          | Merchant / Contact card|
| cv         | CV               | Scroll / document card |

Presentation metadata the renderers need (`classicLabel`, `cardLabel`, `cardVariant`, `rarity`,
icon identifiers) lives beside the domain data as plain identifiers — never styling values or
JSX.

Project entries carry: id, name, summary, description (problem/context), role,
responsibilities, stack, links (repo/play/store), media (path + required alt), tags, optional
impact. Concrete engineering facts over marketing adjectives. Content is plain typed TypeScript
(no JSON/MDX/CMS until long-form content exists).

Active section is **domain state**, independent of presentation mode, and must survive a mode
switch (e.g. viewing Projects in Classic → switch to Card Mode → Relic Collection is active).

Mode is internally `classic` | `rogue`. Public UI copy: "Classic" / "Card Mode" — never "Legacy".

## Navigation

Sections are deep-linkable via the URL hash (`#projects`), independent of mode. Mode is never
encoded in the URL; no mode-specific routes (`/classic/x`, `/rogue/x`). History policy:
`pushState` for explicit navigation clicks, `replaceState` for scroll-driven section changes.

Mode preference persists in `localStorage`. No-flash strategy: a tiny blocking inline script in
the root layout reads the stored mode before paint and sets `data-mode` on `<html>`. Classic HTML
is always the server-rendered default (crawlers and first-time visitors get it); a stored `rogue`
preference hides classic via CSS pre-paint and shows a static skeleton until the Card Mode chunk
loads. Never resolve mode in `useEffect` alone — it flashes the wrong mode.

## Loading tiers

1. **Critical** — page shell, header, classic content, mode toggle, store, hash sync,
   above-fold styles.
2. **Preview** — static CSS skeleton of the Card Mode board, shown while its chunk loads.
3. **Intent** — the Card Mode renderer chunk (board + Motion), preloaded once on
   hover/focus/touchstart of the mode toggle (skipped on `saveData`).
4. **Interaction** — drag sub-chunk (dnd-kit), section-specific panels, expanded-card media.
5. **Expensive** — Three.js, React Three Fiber, 3D models. Never in the initial render or the
   Card Mode chunk; only on an explicit user action; isolated.

**Chunk warm ≠ component mounted.** Exactly one renderer is mounted at a time: switching mode
unmounts the inactive renderer; only domain/navigation state (mode, activeSection) survives; the
already-downloaded chunk stays cached so remounting is cheap. Never keep two fully-mounted
renderers (hidden or `inert`) just to make switching instantaneous.

Byte budgets: `docs/Roadmap.md` §7 is the single source; CI enforces them from Roadmap P5.

## State boundaries

- Local component state: ephemeral, isolated UI (hover, expanded/collapsed, drag-in-progress).
- Card interaction state: the Card Mode state machine (`card-machine.ts`), owned by the rogue
  feature — not the global store.
- Zustand: `mode` and `activeSection` only. Add a field only when distant components genuinely
  need to share it; record why.
- Server Components render content directly from the domain/content layer; they must not depend
  on the Zustand store.

## Card interaction states

Card Mode components are reasoned about as a state machine, not just CSS. Canonical states:

```
idle → hovered/focused → selected → expanded → closing/restoring → idle
                  ↘ grabbed/dragging → drop candidate → expanded   (drag enhancement, Roadmap P6)
```

`selected` is the card matching `activeSection`. Every non-drag state needs a mouse, keyboard
and touch path; drag states are desktop-pointer only and always have a click/keyboard/tap
equivalent. Handle interruptions: mode switched mid-interaction, viewport resized, Escape pressed,
reduced motion active, card opened directly via URL hash.

Library responsibilities: dnd-kit owns gesture recognition and drop semantics; Motion owns visual
transforms/springs; the state machine owns truth — library events only dispatch transitions.

## 3D isolation

3D lives in `src/features/rogue/three/` and is imported only via a user-triggered dynamic
`import()` from the specific optional component that needs it — never by the Card Mode root, so a
nested optional 3D feature can't pull Three.js into a shared chunk. Rendering loops stop on
unmount, inactive view, or non-visible tab. Admission criteria: Roadmap ADR-6; 3D is not in the
MVP and may never ship.

## Testing

Vitest + React Testing Library (introduced in Roadmap P1): domain/content validation, store and
hash-sync logic, mode switching with section preservation, keyboard flows, card state machine.
Playwright only if jsdom proves insufficient (evaluated in Roadmap P9).
