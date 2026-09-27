/**
 * ASCII renderer: raymarches a signed-distance shape and maps diffuse brightness to a character
 * ramp (the approach of alecjacobson/ascii3d, reduced to pure TypeScript). Card glyphs and
 * rotations are rendered at build time by `scripts/ascii/generate.mts`; the relic inspector
 * (Roadmap P8) also runs it in the browser, one frame per user input.
 * Keep this module dependency-free: Node runs it directly with type stripping.
 */

export type AsciiShape =
  | "sphere"
  | "box"
  | "torus"
  | "octahedron"
  | "coin"
  | "book"
  | "scroll"
  | "potato";

export const ASCII_RAMP = " .:-=+*#%@";

export interface AsciiRenderOptions {
  shape: AsciiShape;
  cols: number;
  rows: number;
  /** Spin around the vertical axis, radians. */
  yaw: number;
  /** Fixed tilt toward the viewer, radians. */
  pitch: number;
}

type Vec3 = [number, number, number];

const length = (x: number, y: number, z = 0) => Math.hypot(x, y, z);

function sdBox(p: Vec3, b: Vec3, radius = 0): number {
  const qx = Math.abs(p[0]) - b[0] + radius;
  const qy = Math.abs(p[1]) - b[1] + radius;
  const qz = Math.abs(p[2]) - b[2] + radius;
  const outside = length(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0));
  return outside + Math.min(Math.max(qx, qy, qz), 0) - radius;
}

/** Capped cylinder around the axis given by `axis` (0 = x, 1 = y, 2 = z). */
function sdCylinder(
  p: Vec3,
  axis: 0 | 1 | 2,
  radius: number,
  halfHeight: number,
) {
  const h = p[axis];
  const r = length(...(p.filter((_, i) => i !== axis) as [number, number]));
  const dx = r - radius;
  const dy = Math.abs(h) - halfHeight;
  return (
    Math.min(Math.max(dx, dy), 0) + length(Math.max(dx, 0), Math.max(dy, 0))
  );
}

/** Ellipsoid bound (Inigo Quilez): close to exact near the surface, cheap everywhere. */
function sdEllipsoid(p: Vec3, r: Vec3): number {
  const k0 = length(p[0] / r[0], p[1] / r[1], p[2] / r[2]);
  const k1 = length(p[0] / r[0] ** 2, p[1] / r[1] ** 2, p[2] / r[2] ** 2);
  return (k0 * (k0 - 1)) / (k1 || 1e-6);
}

/** Dimples on the potato surface. */
const POTATO_EYES: Vec3[] = [
  [0.55, 0.45, -0.45],
  [-0.6, -0.2, -0.55],
  [0.2, -0.5, 0.5],
  [-0.3, 0.55, 0.35],
  [0.9, 0.1, 0.3],
];

/** A lumpy ellipsoid with a few eyes; scaled down so the displaced field stays a safe step. */
function sdPotato(p: Vec3): number {
  const body = sdEllipsoid(p, [1.1, 0.74, 0.7]);
  const lumps =
    0.045 *
    Math.sin(3.1 * p[0] + 1.3) *
    Math.sin(2.7 * p[1] + 0.4) *
    Math.sin(3.4 * p[2] + 2.1);
  let eyes = Infinity;
  for (const e of POTATO_EYES)
    eyes = Math.min(eyes, length(p[0] - e[0], p[1] - e[1], p[2] - e[2]) - 0.11);
  return Math.max(body + lumps, -eyes) * 0.85;
}

const SHAPES: Record<AsciiShape, (p: Vec3) => number> = {
  sphere: (p) => length(...p) - 1,
  box: (p) => sdBox(p, [0.72, 0.72, 0.72], 0.08),
  torus: (p) => length(length(p[0], p[2]) - 0.8, p[1]) - 0.32,
  octahedron: (p) =>
    (Math.abs(p[0]) + Math.abs(p[1]) + Math.abs(p[2]) - 1.2) * 0.57735,
  coin: (p) => sdCylinder(p, 2, 0.95, 0.14),
  book: (p) => sdBox(p, [0.72, 0.95, 0.24], 0.05),
  scroll: (p) =>
    Math.min(
      sdCylinder(p, 0, 0.42, 0.8),
      sdCylinder([Math.abs(p[0]) - 0.85, p[1], p[2]], 0, 0.52, 0.08),
    ),
  potato: sdPotato,
};

function rotate(p: Vec3, yaw: number, pitch: number): Vec3 {
  // World → object space: undo the tilt (x axis), then the spin (y axis).
  const cp = Math.cos(-pitch);
  const sp = Math.sin(-pitch);
  const y1 = p[1] * cp - p[2] * sp;
  const z1 = p[1] * sp + p[2] * cp;
  const cy = Math.cos(-yaw);
  const sy = Math.sin(-yaw);
  return [p[0] * cy + z1 * sy, y1, -p[0] * sy + z1 * cy];
}

const LIGHT: Vec3 = (() => {
  const v: Vec3 = [-0.45, 0.7, -0.55];
  const n = length(...v);
  return [v[0] / n, v[1] / n, v[2] / n];
})();

/** Rows joined by "\n"; every row is exactly `cols` characters. */
export function renderAscii({
  shape,
  cols,
  rows,
  yaw,
  pitch,
}: AsciiRenderOptions): string {
  const sdf = (p: Vec3) => SHAPES[shape](rotate(p, yaw, pitch));
  const halfWidth = 1.45;
  // Terminal cells are about twice as tall as wide; keep shapes round.
  const halfHeight = (halfWidth * 2 * rows) / cols;
  const lines: string[] = [];

  for (let row = 0; row < rows; row++) {
    let line = "";
    for (let col = 0; col < cols; col++) {
      const x = ((col + 0.5) / cols) * 2 * halfWidth - halfWidth;
      const y = halfHeight - ((row + 0.5) / rows) * 2 * halfHeight;
      line += shade(sdf, x, y);
    }
    lines.push(line);
  }
  return lines.join("\n");
}

function shade(sdf: (p: Vec3) => number, x: number, y: number): string {
  let z = -3;
  for (let step = 0; step < 80 && z < 3; step++) {
    const d = sdf([x, y, z]);
    if (d < 1e-3) {
      const e = 1e-3;
      const nx = sdf([x + e, y, z]) - sdf([x - e, y, z]);
      const ny = sdf([x, y + e, z]) - sdf([x, y - e, z]);
      const nz = sdf([x, y, z + e]) - sdf([x, y, z - e]);
      const n = length(nx, ny, nz) || 1;
      const diffuse = Math.max(
        0,
        (nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]) / n,
      );
      const brightness = 0.12 + 0.88 * diffuse;
      // Index 1..9: a hit is never blank, so silhouettes stay readable in shadow.
      const index = 1 + Math.min(8, Math.floor(brightness * 9));
      return ASCII_RAMP[index];
    }
    z += d;
  }
  return " ";
}
