/**
 * Prepares Card Mode's background music (Roadmap P9.11) from the owner's track in `resources/`
 * (git-ignored): encodes it for the web into `public/audio/` and tracks its beats into a beat map
 * the board bounces to (ADR-016). Needs `ffmpeg` on PATH.
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

/** Analysis: mono at this rate; one onset value per hop over a window of this many samples. */
const RATE = 22050;
const HOP = 256;
const WINDOW = 1024;
/** Tempo search range and the prior's centre (a log-normal around it, one octave wide). */
const MIN_BPM = 60;
const MAX_BPM = 200;
const PRIOR_BPM = 120;
/**
 * How strictly the beat grid keeps its period: high enough to walk through bars without a kick,
 * loose enough to follow a tempo that drifts (this track speeds up from ~127 to ~130 BPM).
 */
const TIGHTNESS = 100;
/** The kick lives below this frequency; its energy is read at a finer hop to place each beat. */
const KICK_HZ = 150;
const KICK_HOP = 64;
/** A beat moves onto a kick at most this far from where the grid put it. */
const SNAP_S = 0.04;
/** Kick level (share of the track's typical kick) that counts as a kick at all, and as a hard one. */
const KICK_LEVEL = 0.25;
const HARD_LEVEL = 0.8;

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

/** In-place radix-2 FFT; `re.length` is a power of two. */
function fft(re: Float64Array, im: Float64Array) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let size = 2; size <= n; size <<= 1) {
    const step = (-2 * Math.PI) / size;
    for (let start = 0; start < n; start += size) {
      for (let k = 0; k < size / 2; k++) {
        const cos = Math.cos(step * k);
        const sin = Math.sin(step * k);
        const a = start + k;
        const b = a + size / 2;
        const tre = re[b] * cos - im[b] * sin;
        const tim = re[b] * sin + im[b] * cos;
        re[b] = re[a] - tre;
        im[b] = im[a] - tim;
        re[a] += tre;
        im[a] += tim;
      }
    }
  }
}

/**
 * Onset strength per hop: spectral flux of the log magnitude (how much new energy appears across
 * all frequencies), minus its local mean, scaled to unit spread. Every instrument votes, so the
 * beat survives passages without a kick.
 */
function onsetEnvelope(samples: Float32Array): Float64Array {
  const frames = Math.floor((samples.length - WINDOW) / HOP);
  const bins = WINDOW / 2;
  const hann = Float64Array.from(
    { length: WINDOW },
    (_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / WINDOW),
  );
  const flux = new Float64Array(frames);
  let previous = new Float64Array(bins);
  const re = new Float64Array(WINDOW);
  const im = new Float64Array(WINDOW);
  for (let f = 0; f < frames; f++) {
    for (let i = 0; i < WINDOW; i++) {
      re[i] = samples[f * HOP + i] * hann[i];
      im[i] = 0;
    }
    fft(re, im);
    const current = new Float64Array(bins);
    let sum = 0;
    for (let k = 0; k < bins; k++) {
      current[k] = Math.log1p(100 * Math.hypot(re[k], im[k]));
      sum += Math.max(0, current[k] - previous[k]);
    }
    flux[f] = f === 0 ? 0 : sum;
    previous = current;
  }
  const radius = Math.round(0.5 / (HOP / RATE));
  const onset = new Float64Array(frames);
  for (let f = 0; f < frames; f++) {
    let mean = 0;
    const from = Math.max(0, f - radius);
    const to = Math.min(frames - 1, f + radius);
    for (let g = from; g <= to; g++) mean += flux[g];
    onset[f] = Math.max(0, flux[f] - mean / (to - from + 1));
  }
  const spread = Math.sqrt(onset.reduce((sum, v) => sum + v * v, 0) / frames);
  return onset.map((v) => v / spread);
}

/** Beat period in hops: the autocorrelation lag of the onset curve the tempo prior likes best. */
function beatPeriod(onset: Float64Array): number {
  const hopS = HOP / RATE;
  const minLag = Math.floor(60 / MAX_BPM / hopS);
  const maxLag = Math.ceil(60 / MIN_BPM / hopS);
  const score = new Float64Array(maxLag + 2);
  for (let lag = minLag - 1; lag <= maxLag + 1; lag++) {
    let sum = 0;
    for (let f = lag; f < onset.length; f++) sum += onset[f] * onset[f - lag];
    const bpm = 60 / (lag * hopS);
    const prior = Math.exp(-0.5 * Math.log2(bpm / PRIOR_BPM) ** 2);
    score[lag] = (sum / (onset.length - lag)) * prior;
  }
  let best = minLag;
  for (let lag = minLag; lag <= maxLag; lag++) {
    if (score[lag] > score[best]) best = lag;
  }
  // Parabolic interpolation between neighbouring lags: the period is rarely a whole number of hops.
  const [a, b, c] = [score[best - 1], score[best], score[best + 1]];
  return best + (a - c) / (2 * (a - 2 * b + c));
}

/**
 * Dynamic-programming beat tracker (Ellis 2007, as in librosa): each frame's score is its onset
 * strength plus the best earlier beat's score, penalised by how far the gap strays from the period.
 * Backtracking from the best final beat gives a grid that follows the music's tempo as it drifts.
 */
function trackBeats(onset: Float64Array, period: number): number[] {
  const frames = onset.length;
  const spread = period / 32;
  const width = Math.ceil(period);
  const local = new Float64Array(frames);
  for (let f = 0; f < frames; f++) {
    let sum = 0;
    for (let d = -width; d <= width; d++) {
      const g = f + d;
      if (g >= 0 && g < frames) sum += onset[g] * Math.exp(-0.5 * (d / spread) ** 2);
    }
    local[f] = sum;
  }
  const score = new Float64Array(frames);
  const back = new Int32Array(frames).fill(-1);
  for (let f = 0; f < frames; f++) {
    let best = -Infinity;
    const from = Math.max(0, Math.round(f - 2 * period));
    const to = Math.round(f - period / 2);
    for (let g = from; g <= to; g++) {
      const candidate = score[g] - TIGHTNESS * Math.log((f - g) / period) ** 2;
      if (candidate > best) {
        best = candidate;
        back[f] = g;
      }
    }
    score[f] = local[f] + (back[f] >= 0 ? best : 0);
  }
  // The last beat: the latest local peak of the score that is not weak next to the others.
  const peaks: number[] = [];
  for (let f = 1; f < frames - 1; f++) {
    if (score[f] > score[f - 1] && score[f] >= score[f + 1]) peaks.push(f);
  }
  const sorted = peaks.map((f) => score[f]).sort((x, y) => x - y);
  const median = sorted[sorted.length >> 1];
  let f = peaks.findLast((p) => score[p] >= median / 2) ?? frames - 1;
  const beats: number[] = [];
  for (; f >= 0; f = back[f]) beats.push(f);
  return beats.reverse();
}

interface Hit {
  ms: number;
  /** 1–3: 1 a beat without a kick, 2 a kick, 3 a hard kick. */
  strength: number;
}

/**
 * Every beat of the track, each placed on its kick drum when one lands close to the grid (the
 * thud is what the bounce should match), weighted by how hard that kick lands.
 */
function findHits(samples: Float32Array): Hit[] {
  const onset = onsetEnvelope(samples);
  const hopS = HOP / RATE;
  // Onset frame f covers samples f·HOP … f·HOP + WINDOW: its time is the window's centre.
  const beats = trackBeats(onset, beatPeriod(onset)).map(
    (f) => f * hopS + WINDOW / 2 / RATE,
  );

  const low = lowPass(samples, KICK_HZ);
  const kickS = KICK_HOP / RATE;
  const kickFrames = Math.floor(low.length / KICK_HOP);
  const energy = new Float64Array(kickFrames);
  for (let k = 0; k < kickFrames; k++) {
    let sum = 0;
    for (let i = k * KICK_HOP; i < (k + 1) * KICK_HOP; i++) sum += low[i] * low[i];
    energy[k] = Math.log1p(1000 * (sum / KICK_HOP));
  }
  // A kick is where the low band's energy rises fastest, measured over two hops.
  const rise = (k: number) => energy[k + 1] - energy[k - 1];
  const snap = Math.round(SNAP_S / kickS);
  const kicks = beats.map((seconds) => {
    const centre = Math.round(seconds / kickS);
    let at = centre;
    let level = 0;
    for (let k = Math.max(1, centre - snap); k <= Math.min(kickFrames - 2, centre + snap); k++) {
      if (rise(k) > level) {
        level = rise(k);
        at = k;
      }
    }
    return { at, level };
  });
  const levels = kicks.map(({ level }) => level).sort((x, y) => x - y);
  const typical = levels[Math.floor(levels.length * 0.9)];
  return beats.map((seconds, index) => {
    const level = kicks[index].level / typical;
    const kicked = level >= KICK_LEVEL;
    return {
      ms: Math.round((kicked ? kicks[index].at * kickS : seconds) * 1000),
      strength: !kicked ? 1 : level < HARD_LEVEL ? 2 : 3,
    };
  });
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

/** The track's beats, on the kick drum where one lands, in ms from the start of the loop, ascending. */
export const hitMs: readonly number[] = [${hits.map((hit) => hit.ms).join(",")}];

/** How hard each beat lands, 1–3: no kick, a kick, a hard kick. */
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
const counts = [1, 2, 3].map((s) => hits.filter((hit) => hit.strength === s).length);
console.log(
  `${hits.length} beats over ${(durationMs / 1000).toFixed(1)} s (strength 1/2/3: ${counts.join("/")}).`,
);
