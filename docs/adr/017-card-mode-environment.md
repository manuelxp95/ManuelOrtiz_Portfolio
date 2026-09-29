# ADR-017 — Card Mode environment: parallax layers of depth-cued ASCII (Roadmap P9.12)

- **Status:** Accepted — requested by the project owner (2026-09-29)
- **Date:** 2026-09-29
- **Source:** Owner direction: layers around the combatants for a parallax background — five to
  start (foreground close to the cards, the ground the characters stand on, a near background, an
  intermediate one, a far one), open to more later; every layer in the depth-cued pseudo-3D ASCII
  look (ADR-015); the combatants moved up toward the middle of the screen, away from the cards, so
  they are seen better; the layers built to move or take effects, since played cards may affect the
  environment. Owner choices: the ruins of a server room (the Legacy Bug's lair); parallax driven by
  the pointer plus game events; a quake on strong attacks as the first effect.

## Decision

- **Registry** (`ascii/environment.ts`, dependency-free): `ENVIRONMENT_LAYERS`, farthest first.
  Each layer has an `id`, a `depth` (0 nearest … 1 farthest), a `parallax` factor, `front` (in front
  of the combatants, still under the hand), an `anchor` (`above-horizon` stands on the combatants'
  feet line, `below-horizon` hangs down from it — the floor, `bottom` sits on the battlefield's
  bottom under the hand) and a character `size`. A new layer is one entry here, one scene of the same
  id in the generator, and `npm run ascii:env`.
- **Art at build time** (`scripts/ascii/environment.mts`, `npm run ascii:env`, `--check` in CI):
  signed-distance scenes raymarched to `DepthArt` with a fixed seed. Background layers use a
  parallel (oblique) camera, turned and tilted so racks, towers and pillars show two or three faces;
  the floor uses a perspective camera so its tiles shrink toward the horizon. Bands come from the
  hit's depth within each scene's own range; shading reuses the card renderer's light and ramp
  (`LIGHT`, `shadeChar`).
- **Six layers on the owner's references** (revised 2026-09-29): the owner supplied five parallax
  silhouettes of a ruined city (`resources/parallax/WCP_1…5.png`, git-ignored; 1 farthest — order
  confirmed by the owner, and it matches their tones and ground lines: darker and lower is nearer).
  The four backdrops and the foreground follow their composition, turned into ruined server
  infrastructure: `far` (WCP_1) leaning server monoliths, a stepped tower, antenna wreckage;
  `towers` (WCP_2) two data silos, racks on stilts wired to a pole, collapsed cable-tray ramps;
  `skyline` (WCP_3) a server-farm skyline around a domed core, spikes of wreckage; `conduits`
  (WCP_4) elevated data conduits on pylons; `foreground` (WCP_5) a toppled rack on its stand and two
  network poles with a sagging line. Each backdrop stands on its own rubble mass, as in the
  references. The neon-grid floor stays as the combatants' ground (owner choice), making six
  layers. Scenes are authored in reference pixels (100 px to a world unit), with heights squeezed
  to 75 %: the sky above the combatants is far wider than the references' (≈ 3.7 : 1 against
  2.16 : 1) and the tallest towers must stay under the turn bar.
- **Combatants at two thirds** on desktop (owner review: too large on a standard browser):
  `.combatant-art` tops out at 0.41rem instead of 0.62rem; phones keep their minimum size.
- **Hue tells the layers apart, brightness tells their depth** (revised 2026-09-29, owner review:
  "the layers can't be told apart — it looks like a heap of letters"; direction: retro-futurist
  80s colors, the farther the dimmer). Each layer has its own neon token on the battlefield
  (`--env-far` indigo, `--env-towers` violet, `--env-skyline` fuchsia, `--env-conduits` electric
  blue, `--env-ground` hot pink, `--env-foreground` amber-orange; deeper shades in the light theme, brighter in the dark) and is
  mixed toward the background by its depth — 90 % of its hue for the nearest down to 31 % for the
  farthest — while its own bands fog further on top (ADR-015 extended). The floor became a neon
  grid: bright seams on dark tiles, fading out toward the horizon, and a sunset glow sits on the
  horizon behind the farthest layer. The combatants keep the neutral text color and the accent, so
  they stay apart from every hue. A new layer adds a `--env-<id>` token and its `data-layer` rule.
- **Presenter** (`Environment.tsx`): its own chunk with the art, imported when the battlefield
  mounts; the field works without it. Rendered twice by `Battlefield`: `part="back"` before the
  combatants and `part="front"` after them, so DOM order stacks them (behind / in front of the
  combatants, under the hand, under a played card) with no new z-index. `aria-hidden`.
- **Layout:** `--horizon` (`hand overlap + clamp(2rem, 11dvh, 6.5rem)`) is the battlefield's
  bottom padding, so the combatants stand well above the hand and whole; the layers anchor to the
  same variable. Each layer spans 120 % of the field (`font-size = 1.2 × 100cqw / (cols × 0.6)`),
  so the camera can move without showing an edge.
- **Camera** — CSS only: `--cam-x = pointer-x × 0.6 + aim-x`, `--cam-y = pointer-y × 0.4`; each
  layer `translate`s by `−cam × parallax` (7cqw / 2cqh at most) with a 600 ms ease-out. Inputs:
  the pointer (fine pointers only; `Environment` writes `--pointer-x/y` on the field at most once
  per display frame, only while the pointer moves) and the aimed target (`data-aim="bug|hero"`
  pans toward it). Nothing runs while idle: no animation loop.
- **Effects:** a card declares `environment?: EnvironmentEffect` in its `CardAction`
  (`"quake"` today, on Résumé scroll and the experience combo — the strong attacks, golden copies
  included). While its effect plays the field carries `data-env-effect` and an alternating
  `data-env-key` (a/b restarts the animation for a second quake in a row); CSS shakes every layer on
  `transform` (which adds to the camera's `translate`), scaled by its parallax, timed with the
  combatant's hit (450 ms delay, 500 ms). New effects: a union member, a keyframe, a card that
  declares it.
- **Reduced motion:** no pointer listener; CSS pins every layer (`translate: -50% 0`, no
  transition, no animation). The scene stays; nothing moves. Effects are decorative — the live
  region already narrates the hit.
- **Budgets:** a new `Environment` check (≤ 8 kB gz, never in the initial or Card Mode loads).

## Alternatives

- Pre-rendered images or a canvas — breaks the ASCII language and ADR-015's depth cueing, and the
  theme switch.
- Three.js / R3F for real parallax — excluded from Card Mode (ADR-006/007); CSS translate is enough.
- One component rendering all layers with z-index — front layers would have to beat the hand's
  stacking or the battlefield would isolate and trap the played card under the hand.
- Ambient loops (drifting smoke, blinking LEDs) — against "no continuous idle animation loops";
  not requested.
- Tiling layers for endless scrolling — no effect needs it yet; the 20 % overscan covers the camera.

## Consequences

Card Mode load 79.9 kB gz (+0.1 kB: the loader and the effect attributes), 0.1 kB under budget;
the environment chunk is 3.0 kB gz (six layers); all Card Mode chunks 110.4 kB of 120. The combatants no longer
have their feet under the cards (P9.6's overlap now reaches the foreground layer only). On narrow
phones the layers scale with the width, so the scene is small but complete.
