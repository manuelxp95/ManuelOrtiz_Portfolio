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

Project entries carry: id, name, optional year, context (professional / game-jam / coursework /
personal), summary, description (problem/context), optional role, responsibilities, stack,
genres, platforms, links (repo/store/itch/web-build/video/notebook, each with a human-readable
label), optional thumbnail, media, domain tags, optional impact, and a `featured` flag. Every
media entry stores its `public/` path, required alt text and intrinsic width/height (so
`next/image` renders without layout shift). Domain tags shared by projects, skills and experience:
`backend | web | testing | game-dev | cinematics | xr | ai`. Concrete engineering facts over
marketing adjectives. Content is plain typed TypeScript (no JSON/MDX/CMS until long-form content
exists): types in `src/domain/types.ts`, section registry in `src/domain/sections.ts`, content in
`src/content/*` behind a single `src/content/index.ts` export surface, validated by
`src/domain/__tests__/content.test.ts`.

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
2. **Preview** — static CSS skeleton of the Card Mode board, shown while its chunk loads (same
   viewport-tall stage as the board, so the swap never shifts layout).
3. **Intent** — the Card Mode renderer load (board, cards, dialog, dnd-kit, Motion),
   preloaded once on hover/focus/touchstart of the mode toggle through
   `src/features/rogue/preload.ts` (skipped on Save-Data / `prefers-reduced-data`).
4. **Interaction** — per-card ASCII rotations, section-specific panels (one chunk each, warmed on
   card hover/focus; the generic panel stands in while one loads), expanded-card media.
5. **Expensive** — the relic inspector (P8, ADR-007) and any Three.js / React Three Fiber / 3D
   models. Never in the initial render or the Card Mode chunk; only on an explicit user action;
   isolated.

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
idle → hovered/focused → selected → [inspecting] → playing → expanded → closing/restoring → idle
                  ↘ grabbed/dragging → drop candidate → playing       (drag enhancement, Roadmap P6)
```

`inspecting` (touch only) and `playing` were added in Roadmap P9.1 (ADR-008).

`selected` is the card matching `activeSection`. Every non-drag state needs a mouse, keyboard
and touch path; drag states are desktop-pointer only and always have a click/keyboard/tap
equivalent. Handle interruptions: mode switched mid-interaction, viewport resized, Escape pressed,
reduced motion active, card opened directly via URL hash.

Implementation (Roadmap P4): `src/features/rogue/card-machine.ts` owns expanded/closing;
hovered/focused are CSS pseudo-states (`:hover`, `:focus-visible`, `:focus-within`); selected is
derived from the store; restoring is focus returning to the card once the machine is idle. The
expanded card is a native modal `<dialog>` rendering the same section bodies as Classic
(`src/components/sections/*`). Card Mode's look is ASCII art: fixed character-grid faces plus
build-time rendered rotations (`npm run ascii`).

Drag (Roadmap P6): mouse-only `MouseSensor`, drop a card on the battlefield above the hand to play
it; releasing elsewhere, Escape, resize or a hidden tab return it to the hand. Every card still
plays by click, Enter/Space and tap.

Battlefield (Roadmap P9.1, ADR-008): the board is a viewport-tall game screen at every width — a
battlefield with an original ASCII bug and its HP above a fanned hand (overlapping as much as the
width needs). Playing a card flies it to the battlefield and runs a short effect specific to the
card (tokens derived from the content, `src/features/rogue/battle.ts`), deals its damage, then
opens the card's dialog; a tap, Enter or Escape skips the effect and reduced motion skips it
entirely. Mouse click and keyboard play at once; a finger tap first lifts the card out of the fan
(`inspecting`), and a second tap, a swipe up or a tap on the battlefield plays it. Direct opens (URL
hash, back/forward) skip the effect but still count as played.

Duel (Roadmap P9.2, ADR-009): the battlefield holds the hero (the owner; placeholder ASCII until
his model is converted) on the left and the bug on the right. ATTACK cards hit the bug (the three
attacks add up to its HP); SKILL and POWER cards act on the hero and grant statuses. While a card
is dragged — or lifted by a tap — a targeting arrow (`TargetArrow.tsx`) runs from the card to its
target, which glows; releasing anywhere over the battlefield plays the card.

Turns (Roadmap P9.3, ADR-010): the hero has two actions (cards played from the hand) per turn;
then the bug takes its telegraphed turn — attack, charge (×2), attack, heal — once the board is
idle again, never over an open card. Statuses are mechanics (Strength, Block, Dodge, heal). A win
or a loss offers "Play again"; cards always open their sections. `battle.ts` owns the fight; the
board only schedules the bug's turn.

Deck (Roadmap P9.4, ADR-011): 27 cards — 7 sections, one per project, one upgrade per skill
category (`cards.ts`). The opening hand is 5 section cards; each played card returns to the deck at
a random position and the hand refills. Projects and Skills draw their kind of card; project cards
attack and open their relic; skill cards upgrade the hero. A section whose card is in the deck
stays one click away in the site header. The deck is drawn as a pile beside the hand; cards fly from
it into the hand and the fan re-spaces smoothly (P9.5).
The battlefield has no frame and does not clip (P9.6): the hand rises into it, so its cards may
cover the combatants' feet, and played cards and effects travel freely over the hand. The drop
target is the field above the hand, decided by the pointer (`pointerWithin`), so a card picked up
from the hand is never already over the field.

Modifiers (Roadmap P9.7, ADR-012): every two rounds (hero turn + bug turn) the fight pauses on a
modal offer of three random modifiers; the picked one stacks for the rest of the fight (Escape or
"Skip" declines). Modifiers are data in a registry (`modifiers.ts`): per-stack stats added to the
hero's `HeroStats`, and/or a one-off effect; the fight stores only stack counts and derives the
stats, so adding a modifier is one entry. The offer cards float at the top of the screen, rising
from below it. Gold Standard shuffles golden copies (`gold:<card>`, effect ×1.5) of 3 random cards
into the deck.

Combatant models (Roadmap P9.8–P9.9, ADR-013/014): the bug and the hero are skinned glTF models
(git-ignored `resources/`) registered in `ASCII_MODELS` and converted to ASCII at build time by
`scripts/ascii/models.mts` with the card renderer's light and ramp. Committed output per model: a
rest and a defeated frame (Card Mode chunk) and one animation loop (own chunk, played by
`ModelArt.tsx`). The bug is seen three-quarter from above, head toward the hero, looping at 0.5×;
the hero three-quarter toward the bug, near eye level, looping its IDLE at 1×. These loops are the
one owner-approved idle animation; reduced motion shows the rest frames. Card Mode shows both
models' CC BY 4.0 credits.

Library responsibilities: dnd-kit owns gesture recognition and drop semantics; Motion owns
JS-driven transforms/springs (entrances, layout slides — added in P7); the state machine owns
truth — library events only dispatch transitions. Effects CSS can do (hover lift, dialog open/close)
stay CSS.

Section panels (Roadmap P7): Projects (relic collection), Experience (quest path) and Contact
(merchant offers) have their own panels in `src/features/rogue/sections/`; About, Skills,
Education and CV keep the generic panel. Panels render the same content layer as Classic.

## 3D isolation

3D lives in `src/features/rogue/three/` and is imported only via a user-triggered dynamic
`import()` from the specific optional component that needs it — never by the Card Mode root, so a
nested optional 3D feature can't pull Three.js into a shared chunk. Rendering loops stop on
unmount, inactive view, or non-visible tab. Admission criteria: Roadmap ADR-6; 3D is not in the
MVP and may never ship.

Roadmap P8 chose ASCII pseudo-3D instead (ADR-007): the Card Mode SDF raymarcher also runs in the
browser for the relic inspector (`src/features/rogue/inspector/`), a user-triggered chunk opened
from a project's "View relic in 3D" button. It draws one frame per input, never while idle; models
are listed in `RELIC_MODELS` (`src/features/rogue/ascii/scenes.ts`).

## Testing

Vitest + React Testing Library (introduced in Roadmap P1): domain/content validation, store and
hash-sync logic, mode switching with section preservation, keyboard flows, card state machine.
Playwright only if jsdom proves insufficient (evaluated in Roadmap P9).
