/**
 * Generates Card Mode's environment (Roadmap P9.12, ADR-017): the ruins of a server room, one
 * depth-cued ASCII layer (ADR-015) per entry of ENVIRONMENT_LAYERS, raymarched from signed-distance
 * scenes with a fixed seed so the output is stable.
 *   npm run ascii:env               write src/features/rogue/ascii/frames/environment.generated.ts
 *   npm run ascii:env -- --check    exit 1 if the committed file is stale
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  depthBand,
  withSilhouette,
  type DepthArt,
} from "../../src/features/rogue/ascii/depth.ts";
import {
  CELL_ASPECT,
  ENVIRONMENT_LAYERS,
  type EnvironmentLayerId,
} from "../../src/features/rogue/ascii/environment.ts";
import {
  LIGHT,
  ASCII_RAMP,
  type Vec3,
} from "../../src/features/rogue/ascii/renderer.ts";

const out = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../src/features/rogue/ascii/frames/environment.generated.ts",
);

// --- Signed distances -------------------------------------------------------------------------

const hypot = Math.hypot;

function box(p: Vec3, b: Vec3): number {
  const qx = Math.abs(p[0]) - b[0];
  const qy = Math.abs(p[1]) - b[1];
  const qz = Math.abs(p[2]) - b[2];
  return (
    hypot(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) +
    Math.min(Math.max(qx, qy, qz), 0)
  );
}

/** Upright capped cylinder. */
function column(p: Vec3, radius: number, halfHeight: number): number {
  const dx = hypot(p[0], p[2]) - radius;
  const dy = Math.abs(p[1]) - halfHeight;
  return Math.min(Math.max(dx, dy), 0) + hypot(Math.max(dx, 0), Math.max(dy, 0));
}

function capsule(p: Vec3, a: Vec3, b: Vec3, radius: number): number {
  const pa: Vec3 = [p[0] - a[0], p[1] - a[1], p[2] - a[2]];
  const ba: Vec3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const h = Math.min(
    1,
    Math.max(0, (pa[0] * ba[0] + pa[1] * ba[1] + pa[2] * ba[2]) / (ba[0] ** 2 + ba[1] ** 2 + ba[2] ** 2)),
  );
  return hypot(pa[0] - ba[0] * h, pa[1] - ba[1] * h, pa[2] - ba[2] * h) - radius;
}

const sub = (p: Vec3, c: Vec3): Vec3 => [p[0] - c[0], p[1] - c[1], p[2] - c[2]];

/** Rotation around the z axis (a lean left or right), then the y axis (a turn). */
function turn(p: Vec3, roll: number, yaw = 0): Vec3 {
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const x1 = p[0] * cy - p[2] * sy;
  const z1 = p[0] * sy + p[2] * cy;
  const cr = Math.cos(roll);
  const sr = Math.sin(roll);
  return [x1 * cr + p[1] * sr, -x1 * sr + p[1] * cr, z1];
}

const fract = (v: number) => v - Math.floor(v);

/** Deterministic pseudo-random numbers: the same ruins on every run. */
function random(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// --- Scenes ------------------------------------------------------------------------------------

interface Part {
  sdf: (p: Vec3) => number;
  /** How much light the surface returns at `p`, 0..1: seams, vents and grilles read darker. */
  albedo: (p: Vec3) => number;
}

interface Scene {
  parts: Part[];
  camera: Camera;
  /**
   * Mapped to the nearest and farthest depth band: the hit's world z under the parallel camera,
   * its distance (on a log scale) under the perspective one.
   */
  near: number;
  far: number;
  /**
   * How many glyphs of the ramp (`.:-=+*#%@`, lightest first) the scene may use. Scenery keeps to
   * the light end, so the combatants — the full ramp — carry the densest glyphs on screen.
   */
  glyphs: number;
}

type Camera =
  /**
   * Parallel rays, turned and tilted: every object keeps its size and shows two or three faces.
   * The picture is the plane z = `focus`, from x = ±`halfWidth` and up from y = `bottom`.
   */
  | {
      kind: "ortho";
      halfWidth: number;
      bottom: number;
      focus: number;
      yaw: number;
      pitch: number;
    }
  /** A real perspective, for the floor: tiles shrink toward the horizon. */
  | { kind: "perspective"; height: number; pitch: number; focal: number };

/**
 * The backdrops are laid out on the owner's references (`resources/parallax/WCP_*.png`, 1080 ×
 * 500 px): positions and sizes are given in their pixels, 100 px to a world unit, x from the
 * image's centre and y up from each layer's ground line (heights scaled by `V`).
 */
const X = (px: number) => (px - 540) / 100;
const U = (px: number) => px / 100;
/**
 * Heights are squeezed to three quarters: the sky above the combatants is far wider than the
 * references' (≈ 3.7 : 1 against 2.16 : 1), and the tallest towers must stay under the turn bar.
 */
const V = (px: number) => (px * 0.75) / 100;
const HALF_WIDTH = 5.4;

/** Grille rows every 10 reference px: rack faces, kept for the nearest layer only. */
const grille = (local: Vec3) => (fract(local[1] * 10) < 0.25 ? 0.5 : 0.9);
/** Backdrops read as flat silhouettes: detail competes with the combatants. */
const flat = () => 0.75;

interface BlockOptions {
  /** Height of its base above the ground line, px. */
  base?: number;
  /** Lean around its foot, radians (positive leans left). */
  lean?: number;
  /** Depth into the scene (z of its centre) and its thickness, world units. */
  z?: number;
  depth?: number;
  /** Snapped off: this many px sliced from the top, at this slope. */
  cut?: number;
  slope?: number;
}

/** A tower, rack or wall standing on the ground line (or on `base`). */
function block(
  x: number,
  width: number,
  height: number,
  options: BlockOptions = {},
): Part {
  const { base = 0, lean = 0, z = 0.3, depth = 0.4, cut = 0, slope = 0 } =
    options;
  const foot: Vec3 = [X(x), V(base), z];
  const [w, h] = [U(width) / 2, V(height) / 2];
  const local = (p: Vec3) => turn(sub(p, foot), lean);
  return {
    sdf: (p) => {
      const l = local(p);
      const body = box([l[0], l[1] - h, l[2]], [w, h, depth / 2]);
      return cut
        ? Math.max(body, l[1] - (2 * h - V(cut)) - slope * l[0])
        : body;
    },
    albedo: flat,
  };
}

/** A round silo or dome core: a vertical cylinder from `base` px up `height` px. */
function silo(
  x: number,
  radius: number,
  height: number,
  base = 0,
  z = 0.3,
): Part {
  const centre: Vec3 = [X(x), V(base + height / 2), z];
  return {
    sdf: (p) => column(sub(p, centre), U(radius), V(height) / 2),
    albedo: flat,
  };
}

/** Cables, poles, beams: a round line through points given as [x px, y px]. */
function wire(
  points: [number, number][],
  radius: number,
  z = 0.2,
  albedo = 0.8,
): Part {
  const world = points.map(([x, y]): Vec3 => [X(x), V(y), z]);
  return {
    sdf: (p) => {
      let d = Infinity;
      for (let i = 0; i + 1 < world.length; i++) {
        d = Math.min(d, capsule(p, world[i], world[i + 1], U(radius)));
      }
      return d;
    },
    albedo: () => albedo,
  };
}

/** A cable hanging between two points, sagging `sag` px at its middle. */
function sagging(
  from: [number, number],
  to: [number, number],
  sag: number,
  radius: number,
  z = 0.2,
): Part {
  const points = Array.from({ length: 9 }, (_, k): [number, number] => {
    const s = k / 8;
    return [
      from[0] + (to[0] - from[0]) * s,
      from[1] + (to[1] - from[1]) * s - sag * (1 - (2 * s - 1) ** 2),
    ];
  });
  return wire(points, radius, z, 0.7);
}

/** The rubble each backdrop stands on: a bumpy mass from below the frame up to about `base` px. */
function terrain(base: number, bumps: number, seed: number, z = 0.35): Part {
  const next = random(seed);
  const phase = [next() * 6, next() * 6, next() * 6];
  const height = (x: number) =>
    V(base) +
    V(bumps) *
      (0.5 * Math.sin(x * 1.3 + phase[0]) +
        0.3 * Math.sin(x * 3.1 + phase[1]) +
        0.2 * Math.sin(x * 7.7 + phase[2]));
  return {
    // Scaled down: the bumps make the height field steeper than a true distance.
    sdf: (p) =>
      Math.max((p[1] - height(p[0])) * 0.5, Math.abs(p[2] - z) - 0.45),
    albedo: () => 0.5,
  };
}

const backdrop = (parts: Part[], bottom: number, glyphs: number): Scene => ({
  parts,
  camera: {
    kind: "ortho",
    halfWidth: HALF_WIDTH,
    bottom,
    focus: 0.3,
    yaw: 0.22,
    pitch: 0.06,
  },
  near: -0.2,
  far: 0.9,
  glyphs,
});

/** WCP_1: leaning server monoliths, a stepped tower, antenna wreckage on a snapped one. */
function farScene(): Scene {
  return backdrop(
    [
      terrain(4, 8, 101),
      block(40, 45, 110, { lean: 0.3, cut: 20, slope: 0.6 }),
      block(168, 50, 95),
      block(168, 20, 15, { base: 95 }),
      block(270, 50, 110, { lean: 0.12 }),
      block(365, 85, 220),
      block(365, 65, 30, { base: 220 }),
      block(365, 40, 32, { base: 250 }),
      block(512, 85, 200, { lean: -0.03, cut: 12, slope: -0.3 }),
      wire(
        [
          [492, 200],
          [500, 222],
          [512, 205],
          [520, 226],
        ],
        2.5,
      ),
      wire(
        [
          [528, 200],
          [534, 238],
        ],
        2.5,
      ),
      block(742, 95, 70, { cut: 18, slope: 0.4 }),
      block(870, 40, 120, { cut: 10, slope: 0.8 }),
      block(922, 45, 85, { lean: 0.1 }),
    ],
    -0.15,
    3,
  );
}

/** WCP_3: a server-farm skyline around a domed core; spikes of wreckage to the right. */
function skylineScene(): Scene {
  const next = random(303);
  const spikes: Part[] = [];
  for (let x = 660; x < 1075; x += 18 + next() * 30) {
    const lean = (next() - 0.5) * 20;
    spikes.push(
      wire(
        [
          [x, 0],
          [x + lean, 10 + next() * 25],
        ],
        2.5,
        0.1 + next() * 0.4,
      ),
    );
  }
  const blocks: [number, number, number][] = [
    [60, 30, 18],
    [140, 28, 25],
    [210, 40, 35],
    [268, 80, 58],
    [330, 38, 28],
    [365, 20, 12],
    [408, 32, 65],
    [462, 65, 40],
    [553, 60, 52],
    [610, 50, 25],
  ];
  return backdrop(
    [
      terrain(6, 10, 303),
      silo(283, 25, 90),
      wire(
        [
          [283, 90],
          [283, 106],
        ],
        25,
      ),
      wire(
        [
          [296, 125],
          [301, 140],
        ],
        2.5,
      ),
      ...blocks.map(([x, w, h]) => block(x, w, h)),
      wire(
        [
          [40, 0],
          [42, 28],
        ],
        2.5,
      ),
      sagging([880, 22], [915, 22], -14, 2.5, 0.2),
      ...spikes,
    ],
    -0.2,
    4,
  );
}

/** WCP_5: a toppled rack on its stand, dangling cables; two network poles with a sagging line. */
function foregroundScene(): Scene {
  const panel: Vec3 = [X(162), V(47), 0.3];
  const tilt = -0.1;
  const line = (x0: number, y0: number, x1: number, y1: number, radius = 4) =>
    wire(
      [
        [x0, y0],
        [x1, y1],
      ],
      radius,
    );
  const dangling = (x: number, from: number, to: number) =>
    wire(
      [
        [x, from],
        [x + 3, to],
      ],
      3,
      0.1,
      0.6,
    );
  return backdrop(
    [
      terrain(0, 10, 505),
      {
        sdf: (p) => box(turn(sub(p, panel), tilt), [U(52), V(40), 0.18]),
        albedo: (p) => grille(turn(sub(p, panel), tilt)),
      },
      line(135, -5, 140, 12),
      line(178, -5, 173, 9),
      line(90, -5, 125, 22),
      ...[126, 150, 170, 190].map((x) => {
        const top = 88 + (x - 126) * 0.1;
        return line(x, top, x, top + 12, 3);
      }),
      dangling(214, 16, -8),
      dangling(222, 14, -4),
      dangling(230, 12, -10),
      line(465, -5, 457, 100, 5),
      line(435, 92, 483, 97),
      line(625, -3, 612, 108, 5),
      line(583, 98, 645, 105),
      sagging([478, 95], [590, 100], 18, 2),
      dangling(438, 92, 55),
      dangling(443, 93, 45),
      dangling(472, 95, 62),
      dangling(592, 99, 66),
      dangling(638, 104, 72),
      dangling(645, 105, 80),
    ],
    -0.4,
    5,
  );
}

function groundScene(): Scene {
  const next = random(53);
  const missing = new Set<string>();
  for (let i = 0; i < 90; i++) {
    missing.add(`${Math.floor((next() - 0.5) * 30)},${Math.floor(2 + next() * 30)}`);
  }
  const parts: Part[] = [
    {
      // The raised floor: a slab whose missing tiles leave pits.
      sdf: (p) => {
        const key = `${Math.floor(p[0])},${Math.floor(p[2])}`;
        const pit = missing.has(key)
          ? box([fract(p[0]) - 0.5, p[1] + 0.3, fract(p[2]) - 0.5], [0.46, 0.3, 0.46])
          : Infinity;
        return Math.max(p[1], -pit);
      },
      albedo: (p) => {
        if (p[1] < -0.01) return 0.03;
        // A neon grid: bright seams on dark tiles, gone with distance before they alias.
        // Lines across the view thin out less than those running toward the horizon.
        const seam =
          p[2] < 20 &&
          (fract(p[0]) < 0.07 + 0.01 * p[2] || fract(p[2]) < 0.03 + 0.006 * p[2]);
        const crack = Math.abs(Math.sin(p[0] * 1.7 + p[2] * 0.9) * 3 - p[2] * 0.2) < 0.05;
        if (seam) return 0.8;
        return crack ? 0.35 : 0.08;
      },
    },
  ];
  // Debris on the floor, left and right of the duel.
  for (let i = 0; i < 14; i++) {
    const side = i % 2 ? 1 : -1;
    const centre: Vec3 = [side * (3.5 + next() * 9), 0.12, 3 + next() * 14];
    const size = 0.12 + next() * 0.3;
    const roll = next() * Math.PI;
    const yaw = next() * Math.PI;
    parts.push({
      sdf: (p) => box(turn(sub(p, centre), roll, yaw), [size, size * 0.6, size * 0.8]),
      albedo: () => 0.9,
    });
  }
  return {
    parts,
    camera: { kind: "perspective", height: 1.6, pitch: 0.42, focal: 36 },
    near: 2,
    far: 40,
    glyphs: 3,
  };
}

const SCENES: Record<EnvironmentLayerId, () => Scene> = {
  far: farScene,
  skyline: skylineScene,
  ground: groundScene,
  foreground: foregroundScene,
};

// --- Raymarching ------------------------------------------------------------------------------

/** Camera space → world: tilt down by `pitch` (x axis), then turn by `yaw` (y axis). */
function toWorld(v: Vec3, yaw: number, pitch: number): Vec3 {
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  const y1 = v[1] * cp - v[2] * sp;
  const z1 = v[1] * sp + v[2] * cp;
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  return [v[0] * cy + z1 * sy, y1, -v[0] * sy + z1 * cy];
}

function march(scene: Scene, origin: Vec3, dir: Vec3) {
  const distance = (p: Vec3) => {
    let best = Infinity;
    let part: Part | null = null;
    for (const candidate of scene.parts) {
      const d = candidate.sdf(p);
      if (d < best) {
        best = d;
        part = candidate;
      }
    }
    return { d: best, part };
  };
  let t = 0;
  for (let step = 0; step < 160 && t < 80; step++) {
    const p: Vec3 = [origin[0] + dir[0] * t, origin[1] + dir[1] * t, origin[2] + dir[2] * t];
    const { d, part } = distance(p);
    if (d < 2e-3 && part) {
      const e = 2e-3;
      const at = (dx: number, dy: number, dz: number) => distance([p[0] + dx, p[1] + dy, p[2] + dz]).d;
      const nx = at(e, 0, 0) - at(-e, 0, 0);
      const ny = at(0, e, 0) - at(0, -e, 0);
      const nz = at(0, 0, e) - at(0, 0, -e);
      const n = hypot(nx, ny, nz) || 1;
      const diffuse = Math.max(0, (nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]) / n);
      return { t, z: p[2], light: (0.25 + 0.75 * diffuse) * part.albedo(p) };
    }
    t += d * 0.9;
  }
  return null;
}

function renderLayer(scene: Scene, cols: number, rows: number): DepthArt {
  const { camera } = scene;
  const lines: string[] = [];
  const depths: string[] = [];
  for (let row = 0; row < rows; row++) {
    let line = "";
    let depth = "";
    for (let col = 0; col < cols; col++) {
      let origin: Vec3;
      let dir: Vec3;
      if (camera.kind === "ortho") {
        const cell = (2 * camera.halfWidth) / cols;
        dir = toWorld([0, 0, 1], camera.yaw, camera.pitch);
        const onPlane: Vec3 = [
          (col + 0.5) * cell - camera.halfWidth,
          camera.bottom + (rows - row - 0.5) * (cell / CELL_ASPECT),
          camera.focus,
        ];
        origin = [
          onPlane[0] - dir[0] * 40,
          onPlane[1] - dir[1] * 40,
          onPlane[2] - dir[2] * 40,
        ];
      } else {
        const x = col + 0.5 - cols / 2;
        const y = (rows / 2 - row - 0.5) / CELL_ASPECT;
        const v = toWorld([x, y, camera.focal], 0, camera.pitch);
        const n = hypot(...v);
        origin = [0, camera.height, 0];
        dir = [v[0] / n, v[1] / n, v[2] / n];
      }
      const hit = march(scene, origin, dir);
      // Within the scene's glyph budget; a hit is never blank.
      line += hit
        ? ASCII_RAMP[
            1 + Math.min(scene.glyphs - 1, Math.floor(Math.min(1, hit.light) * scene.glyphs))
          ]
        : " ";
      const t = !hit
        ? 0
        : camera.kind === "ortho"
          ? (hit.z - scene.near) / (scene.far - scene.near)
          : Math.log(Math.max(hit.t, scene.near) / scene.near) /
            Math.log(scene.far / scene.near);
      depth += hit ? depthBand(t) : " ";
    }
    lines.push(line.trimEnd().padEnd(cols));
    depths.push(depth.trimEnd().padEnd(cols));
  }
  // Opaque (P9.12): a nearer layer hides what lies behind it.
  return withSilhouette({ chars: lines.join("\n"), depth: depths.join("\n") });
}

// --- Output ------------------------------------------------------------------------------------

const entries = ENVIRONMENT_LAYERS.map(({ id, size }) => {
  const art = renderLayer(SCENES[id](), size.cols, size.rows);
  return `  ${id}: ${JSON.stringify(art)},`;
});
const content = `// Generated by scripts/ascii/environment.mts — do not edit. Run \`npm run ascii:env\` to regenerate.
import type { DepthArt } from "../depth";
import type { EnvironmentLayerId } from "../environment";

export const environmentArt: Record<EnvironmentLayerId, DepthArt> = {
${entries.join("\n")}
};
`;

if (process.argv.includes("--check")) {
  let current = "";
  try {
    current = readFileSync(out, "utf8");
  } catch {
    // missing counts as stale
  }
  if (current !== content) {
    console.error("Stale environment art (run `npm run ascii:env`).");
    process.exit(1);
  }
  console.log("Environment art up to date.");
} else {
  writeFileSync(out, content);
  console.log(`Wrote ${ENVIRONMENT_LAYERS.length} environment layers.`);
}
