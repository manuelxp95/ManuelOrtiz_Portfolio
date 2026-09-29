/**
 * Card Mode's environment (Roadmap P9.12, ADR-017): the ruins of a server room drawn as layers of
 * depth-cued ASCII (ADR-015) behind and in front of the combatants. Each layer is pre-rendered at
 * build time by scripts/ascii/environment.mts; the board shifts each by its `parallax` when the
 * camera moves (pointer, aiming, card effects). Adding a layer: an entry here, a scene of the same
 * id in the script, `npm run ascii:env`.
 * Keep this module dependency-free: the build script imports it with type stripping.
 */
export interface EnvironmentLayer {
  readonly id: string;
  /**
   * 0 nearest … 1 farthest. Sets the layer's fog (its color mixed toward the background, on top of
   * its own depth bands) and the drawing order.
   */
  readonly depth: number;
  /** How far the layer moves with the camera: 1 the most (nearest), 0 not at all. */
  readonly parallax: number;
  /** In front of the combatants (still under the hand) instead of behind them. */
  readonly front: boolean;
  /**
   * Where the layer sits: standing on the horizon (the line of the combatants' feet), hanging down
   * from it (the floor they stand on), or on the bottom of the battlefield, under the hand.
   */
  readonly anchor: "above-horizon" | "below-horizon" | "bottom";
  /** Characters across and down; the layer spans a bit more than the battlefield's width. */
  readonly size: { readonly cols: number; readonly rows: number };
}

/**
 * Farthest first: the order they are drawn in. The four backdrops follow the owner's parallax
 * references (`resources/parallax/WCP_1…5.png`, 1 farthest), turned from a ruined city into ruined
 * server infrastructure; the neon floor between them is where the combatants stand.
 */
export const ENVIRONMENT_LAYERS = [
  /** WCP_1: leaning server monoliths, one stepped tower, antenna wreckage. */
  {
    id: "far",
    depth: 0.95,
    parallax: 0.08,
    front: false,
    anchor: "above-horizon",
    size: { cols: 200, rows: 26 },
  },
  /** WCP_2: two data silos, racks on stilts, collapsed cable-tray ramps. */
  {
    id: "towers",
    depth: 0.8,
    parallax: 0.18,
    front: false,
    anchor: "above-horizon",
    size: { cols: 180, rows: 21 },
  },
  /** WCP_3: a server-farm skyline around a domed core, debris spikes to the right. */
  {
    id: "skyline",
    depth: 0.62,
    parallax: 0.3,
    front: false,
    anchor: "above-horizon",
    size: { cols: 160, rows: 12 },
  },
  /** WCP_4: elevated data conduits on pylons, crossing and curving. */
  {
    id: "conduits",
    depth: 0.45,
    parallax: 0.45,
    front: false,
    anchor: "above-horizon",
    size: { cols: 150, rows: 10 },
  },
  /** The neon-grid floor the combatants stand on. */
  {
    id: "ground",
    depth: 0.25,
    parallax: 0.7,
    front: false,
    anchor: "below-horizon",
    size: { cols: 150, rows: 16 },
  },
  /** WCP_5: a toppled rack on its stand, two network poles with a sagging cable. */
  {
    id: "foreground",
    depth: 0,
    parallax: 1,
    front: true,
    anchor: "bottom",
    size: { cols: 120, rows: 10 },
  },
] as const satisfies readonly EnvironmentLayer[];

export type EnvironmentLayerId = (typeof ENVIRONMENT_LAYERS)[number]["id"];

/**
 * Width of a character cell over its height, as rogue.css sets the layers (monospace, line-height
 * 1); rogue.css also sizes each layer to span 120 % of the battlefield, the camera's margin.
 */
export const CELL_ASPECT = 0.6;
