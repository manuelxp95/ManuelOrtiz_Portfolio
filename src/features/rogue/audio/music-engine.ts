import { durationMs, hitMs, hitStrength } from "./beats.generated";
import {
  musicSettings,
  setBlocked,
  subscribeMusicSettings,
} from "./music-settings";

/**
 * Card Mode's audio (Roadmap P9.11, ADR-016): its own chunk, loaded when the board mounts.
 *
 * Graph: <audio> → fade → duck → music bus → speakers. The track streams through a media element
 * (a decoded 3-minute buffer would hold ~60 MB) and loops there. Fades and ducking are gain ramps
 * on their own nodes, so they never fight each other; entering, leaving, muting and hiding the tab
 * all fade, and silence pauses the element in place. Sound effects (P9.13: the intro's alarm) are
 * synthesized into their own bus beside the music bus.
 *
 * The board bounces on the track's beats: they come from a beat map tracked at build time, and a
 * timer follows `audio.currentTime` from hit to hit, alternating `data-beat` on the board so CSS
 * restarts its bounce animation. No analysis runs in the browser.
 */

const TRACK_URL = "/audio/midnight-pixel-garden.mp3";

/** Faint: background music under a portfolio. */
const MUSIC_VOLUME = 0.28;
/** While an upgrade is on offer the music steps back to this share of its volume. */
const DUCKED = 0.4;

/** Effects are synthesized; a sawtooth siren is loud, so the bus sits low. */
const EFFECTS_VOLUME = 0.1;
/** An alarm that can't start this soon (the browser still holds the audio) is dropped, not delayed. */
const ALARM_LATE_MS = 500;

const FADE_IN_S = 1.5;
const FADE_OUT_S = 0.8;
const DUCK_S = 0.5;
const UNDUCK_S = 1;

/** A hit this close after the last one is the same hit. */
const SAME_HIT_S = 0.08;

/** Index of the first hit at or after `seconds` into the loop; `hitMs.length` past the last. */
export function nextHitIndex(hits: readonly number[], seconds: number): number {
  const ms = seconds * 1000;
  let low = 0;
  let high = hits.length;
  while (low < high) {
    const middle = (low + high) >> 1;
    if (hits[middle] < ms) low = middle + 1;
    else high = middle;
  }
  return low;
}

interface Graph {
  context: AudioContext;
  element: HTMLAudioElement;
  fade: GainNode;
  duck: GainNode;
  effects: GainNode;
}

let graph: Graph | null = null;
/** Card Mode is on screen. */
let active = false;
let ducked = false;
let beatTarget: HTMLElement | null = null;
let beatTimer: number | undefined;
let pauseTimer: number | undefined;
let beatPhase = false;
let mutedSeen = false;

function createGraph(): Graph | null {
  if (typeof AudioContext === "undefined") return null;
  const context = new AudioContext();
  const element = new Audio(TRACK_URL);
  element.loop = true;
  element.preload = "auto";
  const fade = new GainNode(context, { gain: 0 });
  const duck = new GainNode(context, { gain: 1 });
  const bus = new GainNode(context, { gain: MUSIC_VOLUME });
  context
    .createMediaElementSource(element)
    .connect(fade)
    .connect(duck)
    .connect(bus)
    .connect(context.destination);
  const effects = new GainNode(context, { gain: EFFECTS_VOLUME });
  effects.connect(context.destination);
  for (const event of ["playing", "pause", "seeked"]) {
    element.addEventListener(event, scheduleBeat);
  }
  context.addEventListener("statechange", scheduleBeat);
  document.addEventListener("visibilitychange", sync);
  mutedSeen = musicSettings().muted;
  subscribeMusicSettings(() => {
    if (musicSettings().muted === mutedSeen) return;
    mutedSeen = musicSettings().muted;
    sync();
  });
  return { context, element, fade, duck, effects };
}

/** Moves a gain to `value` over `seconds`, from wherever a running ramp has it now. */
function ramp(gain: AudioParam, value: number, seconds: number) {
  const now = graph!.context.currentTime;
  gain.cancelScheduledValues(now);
  gain.setValueAtTime(gain.value, now);
  gain.linearRampToValueAtTime(value, now + seconds);
}

function wantsMusic(): boolean {
  return active && !musicSettings().muted && !document.hidden;
}

/** Heard right now: playing, with the browser letting the audio out. */
function audible(): boolean {
  return (
    graph !== null &&
    !graph.element.paused &&
    graph.context.state === "running" &&
    wantsMusic()
  );
}

/** Browsers hold audio until the visitor interacts; the first interaction starts it. */
function waitForGesture() {
  setBlocked(true);
  window.addEventListener("pointerdown", unlock, { capture: true, once: true });
  window.addEventListener("keydown", unlock, { capture: true, once: true });
}

function unlock(event?: Event) {
  window.removeEventListener("pointerdown", unlock, { capture: true });
  window.removeEventListener("keydown", unlock, { capture: true });
  // The music toggle's own click decides (see `startMusic`); starting here would mute it at once.
  if ((event?.target as Element | null)?.closest?.("[data-music-toggle]")) {
    waitForGesture();
    return;
  }
  setBlocked(false);
  sync();
}

/** Brings the audio in line with what should be heard: fades in, or fades out and pauses. */
function sync() {
  if (!graph) return;
  const { context, element, fade } = graph;
  window.clearTimeout(pauseTimer);
  if (!wantsMusic()) {
    setBlocked(false);
    ramp(fade.gain, 0, FADE_OUT_S);
    // Paused, not stopped: the next visit continues from here.
    pauseTimer = window.setTimeout(() => element.pause(), FADE_OUT_S * 1000);
    scheduleBeat();
    return;
  }
  ramp(fade.gain, 1, FADE_IN_S);
  void context.resume();
  element.play().then(
    () => {
      if (context.state !== "running") waitForGesture();
      scheduleBeat();
    },
    (error: unknown) => {
      if (error instanceof DOMException && error.name === "NotAllowedError") {
        waitForGesture();
      }
    },
  );
}

function pulse(index: number) {
  if (!beatTarget) return;
  beatPhase = !beatPhase;
  beatTarget.dataset.beat = beatPhase ? "a" : "b";
  beatTarget.style.setProperty(
    "--beat-strength",
    String(hitStrength[index] / 3),
  );
}

/** Waits for the next beat of the track and bounces the board on it. */
function scheduleBeat() {
  window.clearTimeout(beatTimer);
  if (!graph || !beatTarget || !audible() || hitMs.length === 0) {
    if (beatTarget) delete beatTarget.dataset.beat;
    return;
  }
  const { context, element } = graph;
  // The element's clock runs ahead of the speakers by the output latency.
  const latency = context.outputLatency || context.baseLatency || 0;
  const now = element.currentTime - latency;
  let index = nextHitIndex(hitMs, now);
  let at = hitMs[index] / 1000;
  if (index === hitMs.length) {
    index = 0;
    at = (durationMs + hitMs[0]) / 1000;
  }
  beatTimer = window.setTimeout(
    () => {
      pulse(index);
      beatTimer = window.setTimeout(scheduleBeat, SAME_HIT_S * 1000);
    },
    Math.max(0, (at - now) * 1000),
  );
}

/** Card Mode mounted: the music fades in where it last stopped. */
export function enterCardMode() {
  active = true;
  graph ??= createGraph();
  sync();
}

/** Card Mode unmounted: the music fades out and pauses in place. */
export function leaveCardMode() {
  active = false;
  sync();
}

/** The music toggle's click: a user gesture, so it can always start the audio. */
export function startMusic() {
  setBlocked(false);
  sync();
}

/**
 * The intro's alarm (P9.13): three rising and falling siren sweeps, ~1.2 s, synthesized (no
 * asset). Silent when muted or hidden; dropped when the browser holds the audio.
 */
export function playAlarm() {
  if (!graph || musicSettings().muted || document.hidden) return;
  const { context, effects } = graph;
  const asked = performance.now();
  void context.resume().then(() => {
    if (performance.now() - asked > ALARM_LATE_MS) return;
    const start = context.currentTime;
    const siren = new OscillatorNode(context, { type: "sawtooth" });
    const tone = new BiquadFilterNode(context, {
      type: "lowpass",
      frequency: 2000,
    });
    const level = new GainNode(context, { gain: 0 });
    siren.connect(tone).connect(level).connect(effects);
    for (let sweep = 0; sweep < 3; sweep++) {
      const at = start + sweep * 0.4;
      siren.frequency.setValueAtTime(620, at);
      siren.frequency.linearRampToValueAtTime(1080, at + 0.2);
      siren.frequency.linearRampToValueAtTime(620, at + 0.4);
    }
    level.gain.linearRampToValueAtTime(1, start + 0.03);
    level.gain.setValueAtTime(1, start + 1.1);
    level.gain.linearRampToValueAtTime(0, start + 1.2);
    siren.start(start);
    siren.stop(start + 1.25);
  });
}

/** An upgrade is on offer: the music steps back while the visitor decides. */
export function setDucked(next: boolean) {
  if (!graph || next === ducked) return;
  ducked = next;
  ramp(graph.duck.gain, next ? DUCKED : 1, next ? DUCK_S : UNDUCK_S);
}

/** The element that bounces on the beat, or null for no bounce. */
export function setBeatTarget(element: HTMLElement | null) {
  if (beatTarget && beatTarget !== element) delete beatTarget.dataset.beat;
  beatTarget = element;
  scheduleBeat();
}
