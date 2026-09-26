/**
 * Enforces the byte budgets of docs/Roadmap.md §7 (locked in Roadmap P5) against `next build`.
 *   npm run build && npm run budgets
 * Sizes are gzip level 9 of the emitted files, the same method as docs/perf-baseline.md.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const KB = 1024;
const BUDGETS = {
  /** P0 baseline 129.9 kB + 20 kB. */
  criticalJs: 149.9 * KB,
  /** Card Mode board chunk (board, cards, dialog, shared section bodies). */
  rogueChunk: 80 * KB,
  /** Every Card Mode-only chunk together (board + per-card ASCII rotations; later drag/panels). */
  rogueTotal: 120 * KB,
};
/** Strings only present in Card Mode code / Three.js builds; rotations are long ASCII-ramp strings. */
const ROGUE_MARKER = "card-board-heading";
const THREE_MARKERS = ["WebGLRenderer", "THREE.REVISION", "three.module"];

const next = ".next";
const html = readFileSync(join(next, "server/app/index.html"), "utf8");
const chunkDir = join(next, "static/chunks");
const chunks = readdirSync(chunkDir, { recursive: true })
  .map(String)
  .filter((file) => file.endsWith(".js"))
  .map((file) => `static/chunks/${file.replaceAll("\\", "/")}`);
const source = (file) => readFileSync(join(next, file), "utf8");
const gz = (file) => gzipSync(readFileSync(join(next, file)), { level: 9 }).length;
const kb = (bytes) => `${(bytes / KB).toFixed(1)} kB`;

const noModule = new Set(
  [...html.matchAll(/src="\/_next\/(static\/[^"]+\.js)" noModule/g)].map((m) => m[1]),
);
const initial = [
  ...new Set([...html.matchAll(/\/_next\/(static\/[^"'\s]+?\.js)/g)].map((m) => m[1])),
].filter((file) => !noModule.has(file) && existsSync(join(next, file)));

const rogueChunks = chunks.filter((file) => source(file).includes(ROGUE_MARKER));
const rotationChunks = chunks.filter(
  (file) => !rogueChunks.includes(file) && /"[ .:\-=+*#%@\\n]{200,}"/.test(source(file)),
);
const threeChunks = chunks.filter((file) =>
  THREE_MARKERS.some((marker) => source(file).includes(marker)),
);

const criticalJs = initial.reduce((sum, file) => sum + gz(file), 0);
const rogueChunk = Math.max(0, ...rogueChunks.map(gz));
const rogueTotal = [...rogueChunks, ...rotationChunks].reduce((sum, file) => sum + gz(file), 0);

const checks = [
  ["Critical JS (/)", criticalJs <= BUDGETS.criticalJs, `${kb(criticalJs)} ≤ ${kb(BUDGETS.criticalJs)}`],
  ["Card Mode chunk found", rogueChunks.length > 0, `${rogueChunks.length} chunk(s)`],
  ["Card Mode chunk", rogueChunk <= BUDGETS.rogueChunk, `${kb(rogueChunk)} ≤ ${kb(BUDGETS.rogueChunk)}`],
  ["Card Mode chunk not in initial load", !rogueChunks.some((f) => initial.includes(f)), ""],
  ["Card Mode total", rogueTotal <= BUDGETS.rogueTotal, `${kb(rogueTotal)} ≤ ${kb(BUDGETS.rogueTotal)} (${rotationChunks.length} rotation chunks)`],
  ["Three.js bytes anywhere", threeChunks.length === 0, `${threeChunks.length} chunk(s)`],
];

let failed = false;
for (const [name, ok, detail] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `: ${detail}` : ""}`);
  failed ||= !ok;
}
if (failed) process.exit(1);
