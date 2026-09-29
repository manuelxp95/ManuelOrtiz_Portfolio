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
  /** Card Mode load (board, cards, dialog, section bodies, dnd-kit, Motion): every JS chunk of it. */
  rogueChunk: 80 * KB,
  /** Each P7 section panel, beyond what the Card Mode load already brought. */
  panel: 10 * KB,
  /** P8 relic inspector (runtime ASCII renderer), loaded only on "View relic in 3D". */
  inspector: 5 * KB,
  /** P9.12 environment (layer art + presenter), fetched when the battlefield mounts. */
  environment: 8 * KB,
  /** Every Card Mode-only chunk together (Card Mode load + ASCII rotations + panels + inspector). */
  rogueTotal: 120 * KB,
};
/** Strings only present in Card Mode code / Three.js builds; rotations are long ASCII-ramp strings. */
const ROGUE_MARKER = "card-board-heading";
const PANEL_MARKERS = {
  projects: "relic-grid",
  experience: "quest-path",
  contact: "merchant-offers",
};
const INSPECTOR_MARKER = "relic-inspector-art";
const ENVIRONMENT_MARKER = "env-layer";
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
const total = (files) => [...new Set(files)].reduce((sum, file) => sum + gz(file), 0);

const noModule = new Set(
  [...html.matchAll(/src="\/_next\/(static\/[^"]+\.js)" noModule/g)].map((m) => m[1]),
);
const initial = [
  ...new Set([...html.matchAll(/\/_next\/(static\/[^"'\s]+?\.js)/g)].map((m) => m[1])),
].filter((file) => !noModule.has(file) && existsSync(join(next, file)));

/**
 * A dynamic import() loads a group of chunks, listed together in its loader
 * (`["static/chunks/a.js","static/chunks/b.js",…].map(…)`); the group of a module is every group
 * that contains the chunk holding its marker.
 */
const loadGroups = chunks.flatMap((file) =>
  [...source(file).matchAll(/\[((?:"static\/chunks\/[^"]+",?)+)\]/g)].map((m) =>
    [...m[1].matchAll(/"(static\/chunks\/[^"]+\.js)"/g)].map((file) => file[1]),
  ),
);
const groupOf = (marker) => {
  const holders = chunks.filter((file) => source(file).includes(marker));
  const group = loadGroups.filter((files) => files.some((file) => holders.includes(file)));
  return [...new Set([...holders, ...group.flat()])];
};

const rogueChunks = groupOf(ROGUE_MARKER);
const rotationChunks = chunks.filter(
  (file) => !rogueChunks.includes(file) && /"[ .:\-=+*#%@\\n]{200,}"/.test(source(file)),
);
const panels = Object.entries(PANEL_MARKERS).map(([section, marker]) => {
  const own = groupOf(marker).filter((file) => !rogueChunks.includes(file));
  return { section, own, bytes: total(own) };
});
const panelChunks = panels.flatMap((panel) => panel.own);
const inspectorHolders = chunks.filter((file) => source(file).includes(INSPECTOR_MARKER));
const inspector = groupOf(INSPECTOR_MARKER).filter(
  (file) => !rogueChunks.includes(file) && !panelChunks.includes(file),
);
const environmentHolders = chunks.filter((file) => source(file).includes(ENVIRONMENT_MARKER));
const environment = groupOf(ENVIRONMENT_MARKER).filter(
  (file) =>
    !rogueChunks.includes(file) &&
    !panelChunks.includes(file) &&
    !inspector.includes(file) &&
    !rotationChunks.includes(file),
);
const environmentArt = rotationChunks.filter((file) => environmentHolders.includes(file));
const threeChunks = chunks.filter((file) =>
  THREE_MARKERS.some((marker) => source(file).includes(marker)),
);

const criticalJs = initial.reduce((sum, file) => sum + gz(file), 0);
const rogueChunk = total(rogueChunks);
const environmentBytes = total([...environment, ...environmentArt]);
const rogueTotal = total([
  ...rogueChunks,
  ...rotationChunks,
  ...panelChunks,
  ...inspector,
  ...environment,
]);

const checks = [
  ["Critical JS (/)", criticalJs <= BUDGETS.criticalJs, `${kb(criticalJs)} ≤ ${kb(BUDGETS.criticalJs)}`],
  ["Card Mode chunk found", rogueChunks.length > 0, `${rogueChunks.length} chunk(s)`],
  ["Card Mode load", rogueChunk <= BUDGETS.rogueChunk, `${kb(rogueChunk)} ≤ ${kb(BUDGETS.rogueChunk)}`],
  ["Card Mode chunks not in initial load", !rogueChunks.some((f) => initial.includes(f)), ""],
  ...panels.flatMap(({ section, own, bytes }) => [
    [`Panel ${section}`, own.length > 0 && bytes <= BUDGETS.panel, `${kb(bytes)} ≤ ${kb(BUDGETS.panel)} (${own.length} chunk(s))`],
    [`Panel ${section} not in initial load`, !own.some((f) => initial.includes(f)), ""],
  ]),
  ["Relic inspector", inspector.length > 0 && total(inspector) <= BUDGETS.inspector, `${kb(total(inspector))} ≤ ${kb(BUDGETS.inspector)} (${inspector.length} chunk(s))`],
  [
    "Relic inspector only on demand",
    !inspectorHolders.some((f) => initial.includes(f) || rogueChunks.includes(f) || panelChunks.includes(f)),
    "not in the initial, Card Mode or panel loads",
  ],
  [
    "Environment",
    environmentHolders.length > 0 && environmentBytes <= BUDGETS.environment,
    `${kb(environmentBytes)} ≤ ${kb(BUDGETS.environment)}`,
  ],
  [
    "Environment only with the battlefield",
    !environmentHolders.some((f) => initial.includes(f) || rogueChunks.includes(f)),
    "not in the initial or Card Mode loads",
  ],
  ["Card Mode total", rogueTotal <= BUDGETS.rogueTotal, `${kb(rogueTotal)} ≤ ${kb(BUDGETS.rogueTotal)} (${rotationChunks.length} rotation chunks)`],
  ["Three.js bytes anywhere", threeChunks.length === 0, `${threeChunks.length} chunk(s)`],
];

let failed = false;
for (const [name, ok, detail] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `: ${detail}` : ""}`);
  failed ||= !ok;
}
if (failed) process.exit(1);
