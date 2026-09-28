# ADR-014 — Hero from a 3D model; one registry for the combatant models (Roadmap P9.9)

- **Status:** Accepted — requested by the project owner (2026-09-27)
- **Date:** 2026-09-27
- **Source:** Owner direction: "I left the player model in `resources/`, with its default
  animation. Replace the current player with it, in the ASCII art style, with the same technique;
  `resources/screenshots/` has references of the desired pose." Extends ADR-013 (boss) and
  ADR-009 (the hero placeholder).

## Decision

- **Input:** `resources/base_mesh_chibi/` ("Base Mesh Chibi" by abhishekfarshwan, Sketchfab,
  CC BY 4.0; 1.4k triangles, a 42-joint Mixamo rig, one 9.8 s IDLE animation). Git-ignored, never
  shipped.
- **One registry, one generator.** The boss-only settings became `ASCII_MODELS` in
  `ascii/scenes.ts` (`boss`, `hero`): path, credit, per-material albedo, grid size, view, frame
  count, speed and defeated roll. `scripts/ascii/boss.mts` became `scripts/ascii/models.mts`
  (`npm run ascii:models`), rendering every model — or one with `--model=` — with the same skinning,
  rasterizing and shading as before; the boss's frames are byte-identical. Output per model:
  `ascii/models/<id>.generated.ts` (`rest`, `defeated`) and `ascii/frames/<id>.generated.ts`
  (loop + `frameMs`). `ModelArt.tsx` (was `BossArt.tsx`) plays any model's loop;
  `modelFrameLoaders` makes each loop its own chunk.
- **Bind-space fix (`bindShape`).** This export bound its two meshes in different spaces: the head
  skins correctly, the body came out ~50× too large. Comparing the joints' bind positions (inverse
  bind matrices) with their world poses showed the bind space is the head mesh's own space; the
  body's vertices fit it with a uniform scale, fitted at 0.040 (mean distance of rigidly weighted
  vertices to their bones is minimal there). `bindShape: { "Body_Material.001_0": 0.04 }` scales
  that mesh before skinning; models that skin correctly (the boss) leave it out.
- **Hero settings:** 28×20 grid, view yaw 2.0, pitch 0.1 — three-quarter, turned toward the bug,
  near eye level, like the references — 64 frames over the 9.8 s IDLE loop (153 ms per frame,
  1× speed), defeated pose lying on its side (roll π/2). Same accent color as before.
- **Loop:** the hero loops continuously like the boss — CLAUDE.md's idle-loop exception now covers
  both combatants' model loops. Reduced motion shows the rest frame.
- **Credits:** Card Mode's credit line names both models with their CC BY 4.0 licenses.
- **Tests:** the combatant-art test covers every registered model through its loader; the board's
  component tests keep both loops still (`src/test/still-models.ts`).

## Updating or adding a combatant model

1. Put the glTF (with its `.bin`) in `resources/<name>/` and add or edit its entry in
   `ASCII_MODELS`: `path`, `credit`, `albedo` per material name (materials left out are not
   drawn).
2. Preview and tune the view, then copy the values into `view` (positive pitch = seen from above;
   a model facing +z looks left at yaw ≈ −2.2, right at ≈ 2.0):
   `node scripts/ascii/models.mts --preview --model=<id> --yaw=2.0 --pitch=0.1 --cols=40 --rows=28`
3. If one mesh renders at the wrong scale, find its factor (see Decision) and set `bindShape`.
4. `npm run ascii:models` writes the generated files; commit them. `npm run ascii:models --
   --check` verifies them locally (CI has no models). Run `npm run budgets`: rest and defeated
   frames count toward the Card Mode load.

## Alternatives

- Keeping the ASCII placeholder hero — the owner supplied a model.
- A second, hero-only generator — duplicated skinning code; the registry keeps one pipeline.
- Rebinding the body through its exported node matrices (`Object_50`) — tested: it lands at the
  right size but tears the mesh (arms spread, body hollow); the uniform scale does not.

## Consequences

Card Mode load 79.2 kB gz (+0.5 kB), 0.8 kB under the 80 kB budget; the hero loop chunk is 4.5 kB
gz. The next Card Mode feature needs a budget decision first. The `bindShape` factor is fitted,
not read from the file: a re-exported model needs it re-checked.
