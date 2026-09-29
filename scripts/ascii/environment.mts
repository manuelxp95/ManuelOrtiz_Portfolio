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
import { depthBand, type DepthArt } from "../../src/features/rogue/ascii/depth.ts";
import {
  CELL_ASPECT,
  ENVIRONMENT_LAYERS,
  type EnvironmentLayerId,
} from "../../src/features/rogue/ascii/environment.ts";
import {
  LIGHT,
  shadeChar,
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

function torusFlat(p: Vec3, major: number, minor: number): number {
  return hypot(hypot(p[0], p[2]) - major, p[1]) - minor;
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

/** Server racks: front grille rows and a frame; `h` is the rack's half height. */
const rackAlbedo = (local: Vec3, h: number) => {
  if (Math.abs(local[1]) > h - 0.08) return 0.55;
  return fract(local[1] * 5) < 0.3 ? 0.45 : 1;
};

function farScene(): Scene {
  const next = random(11);
  const parts: Part[] = [];
  for (let x = -17; x <= 17; x += 1.4 + next() * 1.4) {
    const w = 0.35 + next() * 0.45;
    const d = 0.4 + next() * 0.4;
    const h = 0.8 + next() * 1.9;
    const z = 9 + next() * 6;
    const lean = next() < 0.2 ? (next() - 0.5) * 0.5 : 0;
    const centre: Vec3 = [x, h, z];
    // A broken tower: its top sliced off at a slant.
    const cut = next() < 0.45 ? 0.3 + next() * 0.6 : 0;
    const slope = (next() - 0.5) * 1.2;
    parts.push({
      sdf: (p) => {
        const local = turn(sub(p, centre), lean);
        const body = box(local, [w, h, d]);
        return cut ? Math.max(body, local[1] - (h - cut) - slope * local[0]) : body;
      },
      // Floors of the tower, like windows gone dark.
      albedo: (p) => (fract(p[1] * 2.2) < 0.25 ? 0.45 : 0.85),
    });
  }
  return {
    parts,
    camera: { kind: "ortho", halfWidth: 17, bottom: 0, focus: 12, yaw: 0.35, pitch: 0.08 },
    near: 8,
    far: 16,
  };
}

function midScene(): Scene {
  const next = random(23);
  const parts: Part[] = [];
  for (const row of [0, 1]) {
    for (let x = -12 + row * 0.5; x <= 12; x += 1.05) {
      const roll = next();
      if (roll < 0.35) continue;
      const z = 4 + row * 2.2 + next() * 0.3;
      if (roll < 0.45) {
        // Fallen on its side.
        const centre: Vec3 = [x, 0.38, z];
        const yaw = (next() - 0.5) * 0.8;
        parts.push({
          sdf: (p) => box(turn(sub(p, centre), 0, yaw), [1.1, 0.38, 0.45]),
          albedo: (p) => rackAlbedo(turn(sub(p, centre), 0, yaw), 0.38),
        });
        continue;
      }
      const h = 1 + next() * 0.25;
      const lean = roll < 0.6 ? (next() - 0.5) * 0.7 : 0;
      // Leaning racks pivot on their bottom edge.
      const base: Vec3 = [x, 0, z];
      parts.push({
        sdf: (p) => {
          const local = turn(sub(p, base), lean);
          return box([local[0], local[1] - h, local[2]], [0.4, h, 0.45]);
        },
        albedo: (p) => {
          const local = turn(sub(p, base), lean);
          return rackAlbedo([local[0], local[1] - h, local[2]], h);
        },
      });
    }
  }
  return {
    parts,
    camera: { kind: "ortho", halfWidth: 12, bottom: -0.1, focus: 5, yaw: 0.3, pitch: 0.12 },
    near: 3.4,
    far: 7.2,
  };
}

function nearScene(): Scene {
  const next = random(37);
  const parts: Part[] = [];
  const pillars: { x: number; top: number }[] = [];
  // Clear of the combatants (about x = ±4): at the sides, and one between them.
  for (const x of [-7.1, -5.6, 0, 6.3, 7.3]) {
    const px = x + (next() - 0.5) * 0.6;
    const half = 0.9 + next() * 1.1;
    const r = 0.38 + next() * 0.12;
    const slope = (next() - 0.5) * 1.4;
    const centre: Vec3 = [px, half, 3 + next() * 1.2];
    pillars.push({ x: px, top: 2 * half - 0.3 });
    parts.push({
      sdf: (p) => {
        const local = sub(p, centre);
        // Snapped off: the top sliced at a slant, with a rough edge.
        const rough = 0.12 * Math.sin(local[0] * 11) * Math.sin(local[2] * 9);
        return Math.max(
          column(local, r, half),
          local[1] - half + 0.4 - slope * local[0] + rough,
        );
      },
      // Fluted: vertical grooves around the shaft, and the stones' joints.
      albedo: (p) => {
        const local = sub(p, centre);
        const angle = Math.atan2(local[2], local[0]);
        const groove = fract((angle / (2 * Math.PI)) * 10) < 0.25;
        return groove || fract(local[1] * 0.9) < 0.07 ? 0.5 : 1;
      },
    });
  }
  // Cables sagging between close pillars (never across a combatant).
  for (let i = 0; i + 1 < pillars.length; i++) {
    const [a, b] = [pillars[i], pillars[i + 1]];
    if (b.x - a.x > 3) continue;
    const top = Math.min(a.top, b.top);
    const sag = 0.8 + next() * 0.8;
    const points: Vec3[] = Array.from({ length: 9 }, (_, k) => {
      const s = k / 8;
      return [a.x + (b.x - a.x) * s, top - sag * (1 - (2 * s - 1) ** 2), 3.4];
    });
    parts.push({
      sdf: (p) => {
        let d = Infinity;
        for (let k = 0; k + 1 < points.length; k++) {
          d = Math.min(d, capsule(p, points[k], points[k + 1], 0.06));
        }
        return d;
      },
      albedo: () => 0.7,
    });
  }
  // Half-buried rack frames beside the pillars.
  for (const x of [-2.2, 2.4]) {
    const centre: Vec3 = [x + (next() - 0.5), 0.5, 5.2];
    const yaw = (next() - 0.5) * 0.6;
    parts.push({
      sdf: (p) => {
        const local = turn(sub(p, centre), 0, yaw);
        const shell = box(local, [0.55, 0.9, 0.5]);
        const hollow = box([local[0], local[1], local[2] - 0.2], [0.45, 0.8, 0.5]);
        return Math.max(shell, -hollow);
      },
      albedo: (p) => rackAlbedo(turn(sub(p, centre), 0, yaw), 0.9),
    });
  }
  return {
    parts,
    camera: { kind: "ortho", halfWidth: 9, bottom: -0.1, focus: 3.5, yaw: 0.22, pitch: 0.14 },
    near: 2.4,
    far: 6,
  };
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
        if (p[1] < -0.01) return 0.04;
        // Tile seams fade with distance before they alias into noise.
        const seamWidth = 0.06 + 0.012 * p[2];
        const seam =
          p[2] < 14 &&
          (fract(p[0]) < seamWidth || fract(p[2]) < seamWidth);
        const crack = Math.abs(Math.sin(p[0] * 1.7 + p[2] * 0.9) * 3 - p[2] * 0.2) < 0.05;
        return seam || crack ? 0.06 : 0.2;
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
  };
}

function foregroundScene(): Scene {
  const next = random(71);
  const parts: Part[] = [];
  for (let i = 0; i < 12; i++) {
    const side = i % 2 ? 1 : -1;
    const centre: Vec3 = [side * (2.4 + next() * 3.2), 0.1, next() * 1.5];
    const size = 0.2 + next() * 0.4;
    const roll = next() * Math.PI;
    const yaw = next() * Math.PI;
    parts.push({
      sdf: (p) => box(turn(sub(p, centre), roll, yaw), [size, size * 0.7, size * 0.9]),
      albedo: (p) => (fract((p[0] + p[1]) * 4) < 0.15 ? 0.4 : 0.7),
    });
  }
  // A coil of cable on the left, a broken rack panel on the right.
  const coil: Vec3 = [-4.3, 0.12, 0.6];
  parts.push({
    sdf: (p) =>
      Math.min(
        torusFlat(sub(p, coil), 0.55, 0.09),
        torusFlat(sub(p, [coil[0] + 0.1, coil[1] + 0.16, coil[2]]), 0.45, 0.09),
      ),
    albedo: () => 0.75,
  });
  const panel: Vec3 = [4.6, 0.3, 0.8];
  parts.push({
    sdf: (p) => box(turn(sub(p, panel), 0.35, 0.5), [0.7, 0.1, 0.45]),
    albedo: (p) => rackAlbedo(turn(sub(p, panel), 0.35, 0.5), 0.1),
  });
  return {
    parts,
    camera: { kind: "ortho", halfWidth: 6, bottom: -0.25, focus: 0.8, yaw: 0.15, pitch: 0.5 },
    near: -0.8,
    far: 2.4,
  };
}

const SCENES: Record<EnvironmentLayerId, () => Scene> = {
  far: farScene,
  mid: midScene,
  near: nearScene,
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
      line += hit ? shadeChar(Math.min(1, hit.light)) : " ";
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
  return { chars: lines.join("\n"), depth: depths.join("\n") };
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
