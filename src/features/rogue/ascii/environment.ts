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

/** Farthest first: the order they are drawn in. */
export const ENVIRONMENT_LAYERS = [
  {
    id: "far",
    depth: 0.9,
    parallax: 0.1,
    front: false,
    anchor: "above-horizon",
    size: { cols: 200, rows: 26 },
  },
  {
    id: "mid",
    depth: 0.7,
    parallax: 0.25,
    front: false,
    anchor: "above-horizon",
    size: { cols: 170, rows: 20 },
  },
  {
    id: "near",
    depth: 0.5,
    parallax: 0.45,
    front: false,
    anchor: "above-horizon",
    size: { cols: 140, rows: 22 },
  },
  {
    id: "ground",
    depth: 0.25,
    parallax: 0.7,
    front: false,
    anchor: "below-horizon",
    size: { cols: 150, rows: 16 },
  },
  {
    id: "foreground",
    depth: 0,
    parallax: 1,
    front: true,
    anchor: "bottom",
    size: { cols: 110, rows: 9 },
  },
] as const satisfies readonly EnvironmentLayer[];

export type EnvironmentLayerId = (typeof ENVIRONMENT_LAYERS)[number]["id"];

/**
 * Width of a character cell over its height, as rogue.css sets the layers (monospace, line-height
 * 1); rogue.css also sizes each layer to span 120 % of the battlefield, the camera's margin.
 */
export const CELL_ASPECT = 0.6;
