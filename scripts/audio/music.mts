/**
 * Prepares Card Mode's background music (Roadmap P9.11) from the owner's track in `resources/`
 * (git-ignored): encodes it for the web into `public/audio/` and finds its percussion hits — the
 * kick drum — into a beat map the board bounces to (ADR-016). Needs `ffmpeg` on PATH.
 *   npm run audio:music                 write public/audio/<track>.mp3 and audio/beats.generated.ts
 *   npm run audio:music -- --check      exit 1 if the committed beat map is stale
 * Like the combatant models, the source lives only in `resources/`, so CI cannot run this script.
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const source = join(root, "resources/SFX/midnight-pixel-garden_BK_loop.mp3");
const track = join(root, "public/audio/midnight-pixel-garden.mp3");
const beatMap = join(root, "src/features/rogue/audio/beats.generated.ts");

/** Background music needs no more: 128 kbps stereo, no cover art or tags. */
const BITRATE = "128k";

/** Analysis: mono at this rate, one energy value per hop. */
const RATE = 22050;
const HOP = 256;
/** The kick lives below this frequency. */
const KICK_HZ = 150;
/** A hit rises this far above the local average of the onset curve (0–1). */
const THRESHOLD = 0.32;
/**
 * …and reaches this share of the track's hardest hit: a peak that only stands out from a quiet
 * passage is not a kick you hear.
 */
const MIN_LEVEL = 0.5;
/** Hits closer than this are one hit: the bounce itself lasts about this long. */
const MIN_GAP_S = 0.2;

function ffmpeg(args: string[]): Buffer {
  const result = spawnSync("ffmpeg", ["-v", "error", ...args], {
    maxBuffer: 1 << 30,
  });
  if (result.status !== 0) {
    throw new Error(`ffmpeg failed: ${result.stderr.toString()}`);
  }
  return result.stdout;
}

/** RBJ biquad low-pass, run twice for a steeper slope. */
function lowPass(input: Float32Array, cutoff: number): Float32Array {
  const w = (2 * Math.PI * cutoff) / RATE;
  const alpha = Math.sin(w) / (2 * Math.SQRT1_2);
  const cos = Math.cos(w);
  const a0 = 1 + alpha;
  const b0 = (1 - cos) / 2 / a0;
  const b1 = (1 - cos) / a0;
  const a1 = (-2 * cos) / a0;
  const a2 = (1 - alpha) / a0;
  let signal = input;
  for (let pass = 0; pass < 2; pass++) {
    const out = new Float32Array(signal.length);
    let x1 = 0;
    let x2 = 0;
    let y1 = 0;
    let y2 = 0;
    for (let i = 0; i < signal.length; i++) {
      const x = signal[i];
      const y = b0 * x + b1 * x1 + b0 * x2 - a1 * y1 - a2 * y2;
      out[i] = y;
      x2 = x1;
      x1 = x;
      y2 = y1;
      y1 = y;
    }
    signal = out;
  }
  return signal;
}

interface Hit {
  ms: number;
  /** 1–3: how hard the hit lands, relative to the track's hardest. */
  strength: number;
}

/**
 * Kick onsets: low-band energy per hop, log-compressed; its rise (spectral flux of one band) is
 * the onset curve. A hit is a local peak of the curve standing above its moving average.
 */
function findHits(samples: Float32Array): Hit[] {
  const low = lowPass(samples, KICK_HZ);
  const frames = Math.floor(low.length / HOP);
  const energy = new Float32Array(frames);
  for (let f = 0; f < frames; f++) {
    let sum = 0;
    for (let i = f * HOP; i < (f + 1) * HOP; i++) sum += low[i] * low[i];
    energy[f] = Math.log1p(1000 * (sum / HOP));
  }
  const flux = new Float32Array(frames);
  let max = 0;
  for (let f = 1; f < frames; f++) {
    flux[f] = Math.max(0, energy[f] - energy[f - 1]);
    max = Math.max(max, flux[f]);
  }
  for (let f = 0; f < frames; f++) flux[f] /= max;

  const hopS = HOP / RATE;
  const peakRadius = 3;
  const averageRadius = 12;
  const minGap = Math.round(MIN_GAP_S / hopS);
  const peaks: { frame: number; value: number }[] = [];
  for (let f = averageRadius; f < frames - averageRadius; f++) {
    const value = flux[f];
    let peak = true;
    for (let d = -peakRadius; d <= peakRadius && peak; d++) {
      if (d !== 0 && flux[f + d] > value) peak = false;
    }
    if (!peak) continue;
    let average = 0;
    for (let d = -averageRadius; d <= averageRadius; d++) average += flux[f + d];
    average /= 2 * averageRadius + 1;
    if (value < average + THRESHOLD) continue;
    const last = peaks.at(-1);
    if (last && f - last.frame < minGap) {
      if (value > last.value) peaks[peaks.length - 1] = { frame: f, value };
      continue;
    }
    peaks.push({ frame: f, value });
  }
  // The curve is normalized, so the hardest hit is 1; strength spreads what passes the gate.
  const strongest = Math.max(...peaks.map((peak) => peak.value));
  const gate = MIN_LEVEL * strongest;
  return peaks
    .filter(({ value }) => value >= gate)
    .map(({ frame, value }) => ({
      ms: Math.round(frame * hopS * 1000),
      strength: Math.min(
        3,
        1 + Math.floor(((value - gate) / (strongest - gate)) * 3),
      ),
    }));
}

const check = process.argv.includes("--check");
if (!check) {
  mkdirSync(dirname(track), { recursive: true });
  ffmpeg([
    "-y",
    "-i",
    source,
    "-map",
    "0:a",
    "-map_metadata",
    "-1",
    "-codec:a",
    "libmp3lame",
    "-b:a",
    BITRATE,
    track,
  ]);
}

// Analyse the encoded file, the one the browser plays, so hit times match its timeline.
const pcm = ffmpeg(["-i", track, "-ac", "1", "-ar", String(RATE), "-f", "f32le", "-"]);
const samples = new Float32Array(pcm.buffer, pcm.byteOffset, pcm.byteLength / 4);
const hits = findHits(samples);
const durationMs = Math.round((samples.length / RATE) * 1000);

const content = `// Generated by scripts/audio/music.mts (npm run audio:music). Do not edit.

/** Length of one loop of the track, in ms. */
export const durationMs = ${durationMs};

/** Kick drum hits, in ms from the start of the loop, ascending. */
export const hitMs: readonly number[] = [${hits.map((hit) => hit.ms).join(",")}];

/** How hard each hit lands, 1–3. */
export const hitStrength: readonly number[] = [${hits.map((hit) => hit.strength).join(",")}];
`;

if (check) {
  const stale = readFileSync(beatMap, "utf8") !== content;
  if (stale) {
    console.error("audio/beats.generated.ts is stale: run npm run audio:music");
    process.exit(1);
  }
} else {
  writeFileSync(beatMap, content);
}
console.log(`${hits.length} hits over ${(durationMs / 1000).toFixed(1)} s.`);
