# ADR-015 — Depth-cued ASCII: the standard for pseudo-3D elements

- **Status:** Accepted — requested by the project owner (2026-09-27)
- **Date:** 2026-09-27
- **Source:** Owner direction: "research how to create a depth effect in the ASCII models — farther
  elements in a darker color than nearer ones … apply it to every 3D element; it will be the
  standard architecture for elements that fake three dimensions; apply the most suitable pattern."
  Extends ADR-007 (ASCII pseudo-3D), ADR-013 and ADR-014 (model pipeline).

## Context

The technique is **depth cueing**: intensity fades with distance, classically as linear or
exponential fog that blends a surface toward the background by a factor of its depth, applied
after rasterization from the depth buffer. ASCII renderers that keep glyph, color and depth per
cell (and ASCII shaders with "depth color falloff") use the same idea: characters carry light,
color carries depth — two independent channels.

## Decision

- **Value object — `DepthArt`** (`src/features/rogue/ascii/depth.ts`, dependency-free): `chars`
  (rows joined by `\n`) and a parallel `depth` string with a band per drawn character (`0` nearest
  … `3` farthest, `" "` for blanks). `depthBand(t)` quantizes a normalized depth; `flatArt()` puts
  flat text in front; `depthLayers()` splits art into one string per band (cached per object).
- **Producers** normalize depth over a **stable range** so a moving object's colors never
  flicker:
  - `renderAscii` (SDF raymarcher: card glyphs, card rotations, relic inspector) maps the hit's
    view depth over a fixed range (−1.2 … 0.3) that fits the unit-sized shapes.
  - `scripts/ascii/models.mts` (skinned glTF combatants) keeps each cell's nearest depth and
    normalizes over the whole animation's range (the defeated pose over its own).
  - `buildCardFace` composes a card: the frame and text are flat (band 0), the glyph keeps its
    depth.
- **Presenter — `AsciiArt.tsx`:** stacks one text layer per band in a single grid cell inside
  whatever element holds the art, so fonts, sizes, hover and selection colors keep applying.
- **Fog — CSS (`.ascii-depth` in rogue.css):** each farther band is
  `color-mix(in oklab, currentColor N%, var(--bg))` — 100 / 76 / 56 / 40 % — linear fog toward the
  background, quantized to 4 bands. Mixing toward `--bg` makes it right in light and dark themes
  with no extra tokens.
- **Every pseudo-3D element uses it:** card glyphs in the hand, the card dialog's rotation, the
  relic inspector, and both combatants (loop, rest and defeated). New pseudo-3D elements must
  produce `DepthArt` and render through `AsciiArt` (CLAUDE.md, Styling).
- **Budget:** depth roughly doubles the text of the art (well-compressing digits). To stay within
  the Card Mode budget, the combatants' rest and defeated frames moved into each model's lazy
  chunk (`frames/<id>.generated.ts`: loop, `frameMs`, `defeated`; rest = first frame); an empty
  box of the art's size holds its place until it arrives. Card glyphs stay in Card Mode.
- **Accessibility:** the art stays decorative (`aria-hidden`); depth adds no information, so
  nothing relies on color. Reduced motion is unaffected.

## Alternatives

- Depth in the characters only (sparser glyphs farther away) — no bytes, but light and distance
  would share one channel and shapes would lose shading.
- One `<span>` per run of equal depth — hundreds of nodes per frame; four layers are four text
  nodes.
- Canvas rendering — would duplicate text layout and theming CSS already does.
- Per-frame depth range — simpler, but a turning object's colors would shift frame to frame.
- Edge lines at depth discontinuities (as some ASCII shaders do) — possible later on top of this.

## Consequences

Card Mode load 79.0 kB gz (−0.2 kB after moving the combatants' static frames out); all Card
Mode chunks 106.5 kB (loops grow ~50 % with depth: boss 5.9 kB, hero 7.1 kB, rotations
~2.6 kB each). A combatant can appear a moment after the board on a cold load. Tests check every
generated art's depth grid and bands, and read component art back through `src/test/ascii-text.ts`.
