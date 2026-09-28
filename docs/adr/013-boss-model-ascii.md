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
  rotations), skins the vertices on the CPU, rasterizes the triangles into a 48×20 character grid
  (3×3 subsamples per cell so thin legs survive, nearest depth wins) and shades each cell with the
  card renderer's light and character ramp (`LIGHT`, `shadeChar` in `ascii/renderer.ts`). Per
  material brightness makes the eyes read (sclera bright, pupils dark); the see-through eye
  reflection is left out. View, size, frame count and credit live in `BOSS_*` in `ascii/scenes.ts`;
  `--preview --yaw= --pitch=` prints a frame for tuning.
- **Output (committed):** `ascii/boss.generated.ts` — the rest frame and a defeated frame (the
  model turned legs up) — and `ascii/frames/boss.generated.ts`, one 24-frame loop of the animation
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

## Follow-up (owner review, same day): view and smoothness

- **View:** the model faces +z, so the first render (yaw −0.6) showed it mostly from behind. Matched
  to the owner's reference screenshots (`resources/screenshots/`): yaw −2.2, pitch 0.55 — a
  three-quarter view from above, head and horn at the lower left facing the hero, abdomen rising
  to the upper right. Grid 48×20.
- **Smoothness:** 24 frames per loop instead of 16; an event during a play extends it by whole
  loops instead of restarting it from frame 0 (the visible jump), and a play always ends on a loop
  boundary (the rest frame). Timing uses only animation-frame timestamps.

## Follow-up 2 (owner review, same day): from above, and a continuous loop

- **Pitch sign:** the mesh path applied the tilt forward while the card renderer undoes it, so a
  positive pitch showed the model from below. `viewMatrix` now uses −pitch: positive = seen from
  above, the card renderer's convention (pitch 0.55 unchanged).
- **Continuous loop (exception to CLAUDE.md's "no continuous idle animation loops", owner
  request):** the boss's animation now loops while the fight is on screen, at 0.75× speed
  (`BOSS_ANIMATION_SPEED`; 37 ms per frame). It is the only loop in Card Mode: `BossArt.tsx`
  re-renders only the boss text, once per animation frame (React skips same-index updates), pauses
  with the tab hidden (animation frames stop) and never runs under reduced motion, which shows the
  rest frame. The event-driven replay of follow-up 1 is gone. CLAUDE.md names the exception.
- **Tests:** in jsdom every loop frame is a DOM mutation that makes Testing Library re-run its slow
  role queries, timing out async queries; the board's component tests mock the frames to one still
  frame (`src/test/boss-frames.ts`).

## Follow-up 3 (owner review, same day): slower loop

- The loop now plays at **0.5×** speed (`BOSS_ANIMATION_SPEED = 0.5`; 56 ms per frame, a
  1.33 s loop). Frame count, view and bundle size are unchanged; only `frameMs` in the generated
  loop changed.

## Current settings

Since ADR-014 the boss is the `boss` entry of `ASCII_MODELS` (`src/features/rogue/ascii/scenes.ts`),
rendered by `scripts/ascii/models.mts` (`npm run ascii:models`) into the lazy
`ascii/frames/boss.generated.ts` (depth-cued, ADR-015), played by `ModelArt.tsx`.

| Setting | Value | Field |
|---|---|---|
| View | yaw −2.2, pitch 0.55 (three-quarter from above, head toward the hero) | `view` |
| Grid | 48×20 characters | `size` |
| Loop | 24 frames, 0.5× speed (56 ms per frame), continuous | `frames`, `speed` |
| Defeated | legs up (roll π) | `defeatedRoll` |
| Materials | body 1, limbs 0.75, horns 0.55, sclera 1, pupils 0; eye reflection not drawn | `albedo` |
| Credit | "Boppin' Ariados" by zcythe, CC BY 4.0, shown in Card Mode | `credit` |

## Updating the boss

See ADR-014, "Updating or adding a combatant model" (`--model=boss`).

## Alternatives

- Runtime rendering of the mesh in the browser — ships the model (1.2 MB) and costs CPU per frame.
- An SDF re-modelled by hand, as for the relic — loses the model and its animation.
- Replaying the animation on events only (the first version) — the owner wanted it alive at rest.

## Consequences

Card Mode load 78.7 kB gz (+1.0 kB), 1.3 kB under the 80 kB budget; the animation chunk is 3.4 kB
gz. The character the model depicts is a third-party franchise design (Ariados, Pokémon): the
CC BY 4.0 license covers the modeller's work, not the character's trademark — flagged to the owner.
