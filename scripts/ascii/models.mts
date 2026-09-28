/**
 * Generates the combatants' ASCII art (Roadmap P9.8–P9.9) from their glTF models (`ASCII_MODELS`):
 * each model's own animation is skinned on the CPU, rasterized into a character grid and shaded
 * with the card renderer's light and ramp, so they read like the rest of Card Mode's ASCII objects.
 *   npm run ascii:models                  write ascii/models/<id>.generated.ts, ascii/frames/<id>.generated.ts
 *   npm run ascii:models -- --check       exit 1 if the committed files are stale
 *   npm run ascii:models -- --preview --model=hero [--yaw= --pitch= --cols= --rows=]
 * The models live in `resources/` (git-ignored, not shipped); only the generated text is committed,
 * so CI's `ascii:check` does not cover this script.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  LIGHT,
  shadeChar,
  type Vec3,
} from "../../src/features/rogue/ascii/renderer.ts";
import {
  ASCII_MODELS,
  type AsciiModel,
} from "../../src/features/rogue/ascii/scenes.ts";

type Mat4 = Float64Array; // column-major, like glTF

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const outDir = join(root, "src/features/rogue/ascii");

// ---------------------------------------------------------------- glTF reading

interface Accessor {
  bufferView: number;
  byteOffset?: number;
  componentType: number;
  count: number;
  type: string;
}
interface Node {
  name?: string;
  children?: number[];
  matrix?: number[];
  translation?: number[];
  rotation?: number[];
  scale?: number[];
  mesh?: number;
  skin?: number;
}
interface Gltf {
  scene?: number;
  scenes: { nodes: number[] }[];
  nodes: Node[];
  meshes: {
    name?: string;
    primitives: {
      attributes: Record<string, number>;
      indices: number;
      material: number;
    }[];
  }[];
  materials: { name: string }[];
  skins: { joints: number[]; inverseBindMatrices: number }[];
  animations: {
    channels: { sampler: number; target: { node: number; path: string } }[];
    samplers: { input: number; output: number; interpolation: string }[];
  }[];
  accessors: Accessor[];
  bufferViews: { byteOffset?: number; byteStride?: number }[];
  buffers: { uri: string }[];
}

interface Pose {
  translation: number[];
  rotation: number[];
  scale: number[];
}

interface Part {
  albedo: number;
  positions: number[];
  normals: number[];
  joints: number[];
  weights: number[];
  indices: number[];
}

interface Triangle {
  a: Vec3;
  b: Vec3;
  c: Vec3;
  na: Vec3;
  nb: Vec3;
  nc: Vec3;
  albedo: number;
}

const WIDTH: Record<string, number> = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };
const BYTES: Record<number, number> = { 5121: 1, 5123: 2, 5125: 4, 5126: 4 };

// ---------------------------------------------------------------- matrices

function multiply(a: Mat4, b: Mat4): Mat4 {
  const out = new Float64Array(16);
  for (let col = 0; col < 4; col++)
    for (let row = 0; row < 4; row++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) sum += a[k * 4 + row] * b[col * 4 + k];
      out[col * 4 + row] = sum;
    }
  return out;
}

function compose(t: number[], r: number[], s: number[]): Mat4 {
  const [x, y, z, w] = r;
  return new Float64Array([
    (1 - 2 * (y * y + z * z)) * s[0],
    2 * (x * y + z * w) * s[0],
    2 * (x * z - y * w) * s[0],
    0,
    2 * (x * y - z * w) * s[1],
    (1 - 2 * (x * x + z * z)) * s[1],
    2 * (y * z + x * w) * s[1],
    0,
    2 * (x * z + y * w) * s[2],
    2 * (y * z - x * w) * s[2],
    (1 - 2 * (x * x + y * y)) * s[2],
    0,
    t[0],
    t[1],
    t[2],
    1,
  ]);
}

const transformPoint = (m: Mat4, p: Vec3, w = 1): Vec3 => [
  m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12] * w,
  m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13] * w,
  m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14] * w,
];

// ---------------------------------------------------------------- one model

/** A glTF model's first animation, ready to be posed: its length and its skinned triangles. */
function loadModel(model: AsciiModel) {
  const modelPath = join(root, model.path);
    const gltf = JSON.parse(readFileSync(modelPath, "utf8")) as Gltf;
  const bin = readFileSync(join(dirname(modelPath), gltf.buffers[0].uri));
  const data = new DataView(bin.buffer, bin.byteOffset, bin.byteLength);


  /** An accessor as a flat array of numbers (width per element given by its type). */
  function read(index: number): number[] {
    const accessor = gltf.accessors[index];
    const view = gltf.bufferViews[accessor.bufferView];
    const width = WIDTH[accessor.type];
    const size = BYTES[accessor.componentType];
    const stride = view.byteStride ?? width * size;
    const start = (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
    const out: number[] = [];
    for (let element = 0; element < accessor.count; element++) {
      for (let component = 0; component < width; component++) {
        const at = start + element * stride + component * size;
        out.push(
          accessor.componentType === 5126
            ? data.getFloat32(at, true)
            : accessor.componentType === 5125
              ? data.getUint32(at, true)
              : accessor.componentType === 5123
                ? data.getUint16(at, true)
                : data.getUint8(at),
        );
      }
    }
    return out;
  }

  // ---------------------------------------------------------------- animation


  const restPose: (Pose | null)[] = gltf.nodes.map((node) =>
    node.matrix
      ? null
      : {
          translation: node.translation ?? [0, 0, 0],
          rotation: node.rotation ?? [0, 0, 0, 1],
          scale: node.scale ?? [1, 1, 1],
        },
  );

  const animation = gltf.animations[0];
  const channels = animation.channels.map((channel) => {
    const sampler = animation.samplers[channel.sampler];
    const times = read(sampler.input);
    const values = read(sampler.output);
    return {
      node: channel.target.node,
      path: channel.target.path as keyof Pose,
      times,
      values,
      width: values.length / times.length,
    };
  });
  const duration = Math.max(...channels.map((c) => c.times.at(-1)!));

  function sample(channel: (typeof channels)[number], time: number): number[] {
    const { times, values, width, path } = channel;
    let next = times.findIndex((t) => t >= time);
    if (next <= 0) next = next === 0 ? 0 : times.length - 1;
    const prev = Math.max(0, next - 1);
    const span = times[next] - times[prev];
    const f = span > 0 ? (time - times[prev]) / span : 0;
    const a = values.slice(prev * width, prev * width + width);
    const b = values.slice(next * width, next * width + width);
    if (path !== "rotation") return a.map((v, i) => v + (b[i] - v) * f);
    // Normalized lerp along the shorter arc: close to slerp between dense keys.
    const sign = a.reduce((sum, v, i) => sum + v * b[i], 0) < 0 ? -1 : 1;
    const q = a.map((v, i) => v + (sign * b[i] - v) * f);
    const norm = Math.hypot(...q);
    return q.map((v) => v / norm);
  }

  /** World matrix of every node at this time of the animation. */
  function worldMatrices(time: number): Mat4[] {
    const poses = restPose.map((pose) => (pose ? { ...pose } : null));
    for (const channel of channels) poses[channel.node]![channel.path] = sample(channel, time);
    const world: Mat4[] = new Array(gltf.nodes.length);
    const visit = (index: number, parent: Mat4) => {
      const node = gltf.nodes[index];
      const pose = poses[index];
      const local = pose
        ? compose(pose.translation, pose.rotation, pose.scale)
        : new Float64Array(node.matrix!);
      world[index] = multiply(parent, local);
      for (const child of node.children ?? []) visit(child, world[index]);
    };
    const identity = compose([0, 0, 0], [0, 0, 0, 1], [1, 1, 1]);
    for (const node of gltf.scenes[gltf.scene ?? 0].nodes) visit(node, identity);
    return world;
  }

  // ---------------------------------------------------------------- skinning

  /** How bright each material reads; materials left out are not drawn. */
  const ALBEDO: Record<string, number> = model.albedo;


  /** Brings a mesh's vertices into the skin's bind space, when its export left them elsewhere. */
  const bindFix = (meshName: string | undefined): Mat4 | null => {
    const scale = meshName && model.bindShape?.[meshName];
    if (!scale) return null;
    return compose([0, 0, 0], [0, 0, 0, 1], [scale, scale, scale]);
  };
  const transformAll = (values: number[], m: Mat4 | null, w: number) => {
    if (!m) return values;
    const out: number[] = [];
    for (let v = 0; v < values.length; v += 3)
      out.push(...transformPoint(m, [values[v], values[v + 1], values[v + 2]], w));
    return out;
  };

  const parts: Part[] = [];
  const skinnedNodes = gltf.nodes.filter((node) => node.mesh !== undefined);
  for (const node of skinnedNodes) {
    const mesh = gltf.meshes[node.mesh!];
    const fix = bindFix(mesh.name);
    for (const primitive of mesh.primitives) {
      const albedo = ALBEDO[gltf.materials[primitive.material].name];
      if (albedo === undefined) continue;
      parts.push({
        albedo,
        positions: transformAll(read(primitive.attributes.POSITION), fix, 1),
        normals: transformAll(read(primitive.attributes.NORMAL), fix, 0),
        joints: read(primitive.attributes.JOINTS_0),
        weights: read(primitive.attributes.WEIGHTS_0),
        indices: read(primitive.indices),
      });
    }
  }
  const skin = gltf.skins[0];
  const inverseBind = read(skin.inverseBindMatrices);


  /** Skinned triangles in view space (camera at −z looking +z, like the card renderer). */
  function posedTriangles(time: number, view: Mat4): Triangle[] {
    const world = worldMatrices(time);
    const jointMatrices = skin.joints.map((joint, j) =>
      multiply(view, multiply(world[joint], new Float64Array(inverseBind.slice(j * 16, j * 16 + 16)))),
    );
    const triangles: Triangle[] = [];
    for (const part of parts) {
      const count = part.positions.length / 3;
      const points: Vec3[] = [];
      const normals: Vec3[] = [];
      for (let v = 0; v < count; v++) {
        const p: Vec3 = [part.positions[v * 3], part.positions[v * 3 + 1], part.positions[v * 3 + 2]];
        const n: Vec3 = [part.normals[v * 3], part.normals[v * 3 + 1], part.normals[v * 3 + 2]];
        const sp: Vec3 = [0, 0, 0];
        const sn: Vec3 = [0, 0, 0];
        for (let k = 0; k < 4; k++) {
          const weight = part.weights[v * 4 + k];
          if (!weight) continue;
          const m = jointMatrices[part.joints[v * 4 + k]];
          const tp = transformPoint(m, p);
          const tn = transformPoint(m, n, 0);
          for (let i = 0; i < 3; i++) {
            sp[i] += tp[i] * weight;
            sn[i] += tn[i] * weight;
          }
        }
        const length = Math.hypot(...sn) || 1;
        points.push(sp);
        normals.push([sn[0] / length, sn[1] / length, sn[2] / length]);
      }
      for (let i = 0; i < part.indices.length; i += 3) {
        const [ia, ib, ic] = [part.indices[i], part.indices[i + 1], part.indices[i + 2]];
        triangles.push({
          a: points[ia],
          b: points[ib],
          c: points[ic],
          na: normals[ia],
          nb: normals[ib],
          nc: normals[ic],
          albedo: part.albedo,
        });
      }
    }
    return triangles;
  }

  return { duration, posedTriangles };
}

// ---------------------------------------------------------------- rasterizing

/**
 * Rotation from model space to view space: yaw (vertical axis), pitch, roll. A positive pitch tips
 * the top toward the camera — seen from above, the same convention as the card renderer.
 */
function viewMatrix(yaw: number, pitch: number, roll = 0): Mat4 {
  const half = (angle: number, axis: 0 | 1 | 2) => {
    const q = [0, 0, 0, Math.cos(angle / 2)];
    q[axis] = Math.sin(angle / 2);
    return compose([0, 0, 0], q, [1, 1, 1]);
  };
  return multiply(half(roll, 2), multiply(half(-pitch, 0), half(yaw, 1)));
}

interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

function bounds(triangles: Triangle[]): Bounds {
  const b = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
  for (const t of triangles)
    for (const p of [t.a, t.b, t.c]) {
      b.minX = Math.min(b.minX, p[0]);
      b.maxX = Math.max(b.maxX, p[0]);
      b.minY = Math.min(b.minY, p[1]);
      b.maxY = Math.max(b.maxY, p[1]);
    }
  return b;
}

/** Subsamples per cell side: a cell is drawn if any subsample hits, so thin legs survive. */
const SUB = 3;

function rasterize(triangles: Triangle[], frame: Bounds, cols: number, rows: number): string {
  // Cells are about twice as tall as wide; center the model in a frame of that aspect.
  const cell = Math.max((frame.maxX - frame.minX) / cols, (frame.maxY - frame.minY) / (rows * 2));
  const cx = (frame.minX + frame.maxX) / 2;
  const cy = (frame.minY + frame.maxY) / 2;
  const left = cx - (cols / 2) * cell;
  const top = cy + rows * cell;
  const w = cols * SUB;
  const h = rows * SUB;
  const depth = new Float64Array(w * h).fill(Infinity);
  const shade = new Float64Array(w * h).fill(-1);

  for (const t of triangles) {
    const ax = (t.a[0] - left) / cell * SUB, ay = (top - t.a[1]) / (cell * 2) * SUB;
    const bx = (t.b[0] - left) / cell * SUB, by = (top - t.b[1]) / (cell * 2) * SUB;
    const cxp = (t.c[0] - left) / cell * SUB, cyp = (top - t.c[1]) / (cell * 2) * SUB;
    const area = (bx - ax) * (cyp - ay) - (by - ay) * (cxp - ax);
    if (Math.abs(area) < 1e-12) continue;
    const x0 = Math.max(0, Math.floor(Math.min(ax, bx, cxp)));
    const x1 = Math.min(w - 1, Math.ceil(Math.max(ax, bx, cxp)));
    const y0 = Math.max(0, Math.floor(Math.min(ay, by, cyp)));
    const y1 = Math.min(h - 1, Math.ceil(Math.max(ay, by, cyp)));
    for (let y = y0; y <= y1; y++)
      for (let x = x0; x <= x1; x++) {
        const px = x + 0.5;
        const py = y + 0.5;
        const wa = ((bx - px) * (cyp - py) - (by - py) * (cxp - px)) / area;
        const wb = ((cxp - px) * (ay - py) - (cyp - py) * (ax - px)) / area;
        const wc = 1 - wa - wb;
        if (wa < 0 || wb < 0 || wc < 0) continue;
        const z = wa * t.a[2] + wb * t.b[2] + wc * t.c[2];
        const i = y * w + x;
        if (z >= depth[i]) continue;
        depth[i] = z;
        const n: Vec3 = [0, 1, 2].map(
          (k) => wa * t.na[k] + wb * t.nb[k] + wc * t.nc[k],
        ) as Vec3;
        const length = Math.hypot(...n) || 1;
        // Facing the camera means a negative z normal; flip normals that point away.
        const facing = n[2] > 0 ? -1 : 1;
        const diffuse = Math.max(
          0,
          (facing * (n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2])) / length,
        );
        shade[i] = diffuse * t.albedo;
      }
  }

  const lines: string[] = [];
  for (let row = 0; row < rows; row++) {
    let line = "";
    for (let col = 0; col < cols; col++) {
      // The nearest subsample of the cell decides its shade.
      let best = -1;
      let bestDepth = Infinity;
      for (let sy = 0; sy < SUB; sy++)
        for (let sx = 0; sx < SUB; sx++) {
          const i = (row * SUB + sy) * w + col * SUB + sx;
          if (depth[i] < bestDepth) {
            bestDepth = depth[i];
            best = shade[i];
          }
        }
      line += best < 0 ? " " : shadeChar(best);
    }
    lines.push(line.trimEnd().padEnd(cols));
  }
  return lines.join("\n");
}

// ---------------------------------------------------------------- output

/** `--model=hero --yaw=0.5 --pitch=0.3 --cols=72 --rows=30` override the config while previewing. */
const option = (name: string) =>
  process.argv.find((arg) => arg.startsWith(`--${name}=`))?.split("=")[1];

const header = (id: string) =>
  `// Generated by scripts/ascii/models.mts from the ${id} model — do not edit. Run \`npm run ascii:models\`.\n`;

/** The generated files of one model: its rest and defeated frames, and one loop of its animation. */
function render(id: string, model: AsciiModel): Map<string, string> {
  const { duration, posedTriangles } = loadModel(model);
  const yaw = Number(option("yaw") ?? model.view.yaw);
  const pitch = Number(option("pitch") ?? model.view.pitch);
  const cols = Number(option("cols") ?? model.size.cols);
  const rows = Number(option("rows") ?? model.size.rows);
  const view = viewMatrix(yaw, pitch);
  const posed: Triangle[][] = Array.from({ length: model.frames }, (_, frame) =>
    posedTriangles((frame / model.frames) * duration, view),
  );
  // One frame for the whole animation, so the model never jumps between frames.
  const frame = bounds(posed.flat());
  const frames = posed.map((triangles) => rasterize(triangles, frame, cols, rows));
  const fallen = posedTriangles(0, viewMatrix(yaw, pitch, model.defeatedRoll));
  const defeated = rasterize(fallen, bounds(fallen), cols, rows);
  const frameMs = Math.round((duration * 1000) / model.frames / model.speed);
  return new Map([
    [
      `models/${id}.generated.ts`,
      `${header(id)}/** At rest: the first frame of its animation. */\nexport const rest = ${JSON.stringify(frames[0])};\n\n/** Defeated. */\nexport const defeated = ${JSON.stringify(defeated)};\n`,
    ],
    [
      `frames/${id}.generated.ts`,
      `${header(id)}/** One loop of the model's own animation, at ${model.speed}× speed. */\nexport const frames: readonly string[] = [\n${frames.map((f) => `  ${JSON.stringify(f)},`).join("\n")}\n];\n\nexport const frameMs = ${frameMs};\n`,
    ],
  ]);
}

const only = option("model");
const models = Object.entries(ASCII_MODELS).filter(([id]) => !only || id === only);

if (process.argv.includes("--preview")) {
  for (const [id, model] of models) {
    const files = render(id, model);
    const art = files.get(`models/${id}.generated.ts`)!;
    const [rest, defeated] = [...art.matchAll(/= (".*");/g)].map((m) => JSON.parse(m[1]) as string);
    console.log(`== ${id}\n${rest}\n${"-".repeat(rest.indexOf("\n"))}\n${defeated}`);
  }
  process.exit(0);
}

const check = process.argv.includes("--check");
const stale: string[] = [];
let written = 0;
for (const [id, model] of models) {
  for (const [name, content] of render(id, model)) {
    const path = join(outDir, name);
    if (check) {
      let current = "";
      try {
        current = readFileSync(path, "utf8");
      } catch {
        // missing counts as stale
      }
      if (current !== content) stale.push(name);
    } else {
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, content);
      written++;
    }
  }
}
if (check && stale.length > 0) {
  console.error(`Stale model ASCII art (run \`npm run ascii:models\`): ${stale.join(", ")}`);
  process.exit(1);
}
console.log(check ? "Model ASCII art up to date." : `Wrote ${written} files.`);
