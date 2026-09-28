# ADR-013 — Boss from a 3D model, rendered as ASCII at build time (Roadmap P9.8)

- **Status:** Accepted — requested by the project owner (2026-09-27)
- **Date:** 2026-09-27
- **Source:** Owner direction: "I left the boss model in `resources/`, with its default animation;
  that folder must be ignored. Replace the current boss with the model, in the ASCII art style,
  with the same technique used for the cards." Extends ADR-007 (ASCII pseudo-3D) and ADR-009.

## Decision

- **Input:** a skinned glTF model in `resources/boss_v1/` ("Boppin' Ariados" by zcythe, Sketchfab,
  CC BY 4.0; 15k triangles, 27 joints, one 0.67 s animation). `resources/` is git-ignored: the
  model is never committed or shipped.
- **Build-time conversion** (`scripts/ascii/boss.mts`, `npm run ascii:boss`): dependency-free Node.
  It reads the glTF and its buffer, samples the model's animation (linear keys, normalized-lerp
  rotations), skins the vertices on the CPU, rasterizes the triangles into a 44×18 character grid
  (3×3 subsamples per cell so thin legs survive, nearest depth wins) and shades each cell with the
  card renderer's light and character ramp (`LIGHT`, `shadeChar` in `ascii/renderer.ts`). Per
  material brightness makes the eyes read (sclera bright, pupils dark); the see-through eye
  reflection is left out. View, size, frame count and credit live in `BOSS_*` in `ascii/scenes.ts`;
  `--preview --yaw= --pitch=` prints a frame for tuning.
- **Output (committed):** `ascii/boss.generated.ts` — the rest frame and a defeated frame (the
  model turned legs up) — and `ascii/frames/boss.generated.ts`, one 16-frame loop of the animation
  plus its frame time. CI cannot regenerate them (no model there), so `ascii:check` does not cover
  them; `npm run ascii:boss -- --check` does locally.
- **Playback, like the card objects** (`use-boss-art.ts`): the loop plays twice when the fight
  opens, when the bug acts, when a card hits it and when a pointer reaches it, then rests on the
  first frame — no idle loop. Reduced motion shows the rest frame only. The existing hit shake and
  attack lunge still move the art.
- **Loading:** the rest and defeated frames ship with Card Mode; the loop is its own chunk,
  fetched when the battlefield mounts.
- **Credit:** CC BY 4.0 requires attribution, so Card Mode shows "Bug based on “Boppin' Ariados”
  by zcythe (CC BY 4.0), rendered as ASCII" under the board's hint, with links.

## Alternatives

- Runtime rendering of the mesh in the browser — ships the model (1.2 MB) and costs CPU per frame.
- An SDF re-modelled by hand, as for the relic — loses the model and its animation.
- A continuous idle loop of the animation — CLAUDE.md forbids idle loops; events replay it instead.

## Consequences

Card Mode load 78.7 kB gz (+1.0 kB), 1.3 kB under the 80 kB budget; the animation chunk is 2.3 kB
gz. The character the model depicts is a third-party franchise design (Ariados, Pokémon): the
CC BY 4.0 license covers the modeller's work, not the character's trademark — flagged to the owner.
