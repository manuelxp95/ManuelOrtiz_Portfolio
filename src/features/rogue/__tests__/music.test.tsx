// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  durationMs,
  hitMs,
  hitStrength,
} from "@/features/rogue/audio/beats.generated";

type Engine = typeof import("@/features/rogue/audio/music-engine");
type Settings = typeof import("@/features/rogue/audio/music-settings");

/** Just enough of Web Audio and <audio> for the engine: gains jump straight to a ramp's target. */
class FakeParam {
  constructor(public value: number) {}
  cancelScheduledValues() {}
  setValueAtTime(value: number) {
    this.value = value;
  }
  linearRampToValueAtTime(value: number) {
    this.value = value;
  }
}

let gains: FakeGain[] = [];
class FakeGain {
  gain: FakeParam;
  constructor(_context: unknown, options: { gain: number }) {
    this.gain = new FakeParam(options.gain);
    gains.push(this);
  }
  connect<Node>(node: Node) {
    return node;
  }
}

class FakeContext extends EventTarget {
  state = "running";
  currentTime = 0;
  outputLatency = 0;
  baseLatency = 0;
  destination = {};
  resume() {
    return Promise.resolve();
  }
  createMediaElementSource() {
    return { connect: <Node,>(node: Node) => node };
  }
}

let audio: FakeAudio;
let playError: DOMException | null = null;
class FakeAudio extends EventTarget {
  paused = true;
  currentTime = 0;
  loop = false;
  preload = "";
  constructor(public src: string) {
    super();
    // eslint-disable-next-line @typescript-eslint/no-this-alias -- the test drives the one element
    audio = this;
  }
  play() {
    if (playError) return Promise.reject(playError);
    this.paused = false;
    this.dispatchEvent(new Event("playing"));
    return Promise.resolve();
  }
  pause() {
    this.paused = true;
    this.dispatchEvent(new Event("pause"));
  }
}

let engine: Engine;
let settings: Settings;

beforeEach(async () => {
  vi.useFakeTimers();
  vi.resetModules();
  window.localStorage.clear();
  gains = [];
  playError = null;
  vi.stubGlobal("AudioContext", FakeContext);
  vi.stubGlobal("GainNode", FakeGain);
  vi.stubGlobal("Audio", FakeAudio);
  engine = await import("@/features/rogue/audio/music-engine");
  settings = await import("@/features/rogue/audio/music-settings");
});

afterEach(() => {
  engine.leaveCardMode();
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const [fade, duck] = [() => gains[0].gain, () => gains[1].gain];

describe("beat map (P9.11)", () => {
  it("lists ascending hits inside one loop, each with a strength of 1–3", () => {
    expect(hitMs.length).toBeGreaterThan(100);
    expect(hitMs.length).toBe(hitStrength.length);
    hitMs.forEach((ms, index) => {
      expect(ms).toBeLessThan(durationMs);
      if (index > 0) expect(ms).toBeGreaterThan(hitMs[index - 1]);
    });
    expect(
      hitStrength.every((strength) => strength >= 1 && strength <= 3),
    ).toBe(true);
  });

  it("finds the next hit by binary search", () => {
    const hits = [100, 500, 900];
    expect(engine.nextHitIndex(hits, 0)).toBe(0);
    expect(engine.nextHitIndex(hits, 0.5)).toBe(1);
    expect(engine.nextHitIndex(hits, 0.6)).toBe(2);
    expect(engine.nextHitIndex(hits, 1)).toBe(3);
  });
});

describe("music engine (P9.11)", () => {
  it("fades in on entering Card Mode, and out and paused in place on leaving", async () => {
    engine.enterCardMode();
    await vi.advanceTimersByTimeAsync(0);
    expect(audio.paused).toBe(false);
    expect(audio.loop).toBe(true);
    expect(fade().value).toBe(1);

    audio.currentTime = 42;
    engine.leaveCardMode();
    expect(fade().value).toBe(0);
    expect(audio.paused).toBe(false); // still fading out
    await vi.advanceTimersByTimeAsync(1000);
    expect(audio.paused).toBe(true);

    engine.enterCardMode();
    await vi.advanceTimersByTimeAsync(0);
    expect(audio.paused).toBe(false);
    expect(audio.currentTime).toBe(42);
  });

  it("steps back while an upgrade is on offer, then returns", () => {
    engine.enterCardMode();
    engine.setDucked(true);
    expect(duck().value).toBeLessThan(1);
    engine.setDucked(false);
    expect(duck().value).toBe(1);
  });

  it("bounces the board on each hit, alternating so CSS restarts the animation", async () => {
    const board = document.createElement("section");
    engine.enterCardMode();
    await vi.advanceTimersByTimeAsync(0);
    audio.currentTime = hitMs[0] / 1000 - 0.05;
    engine.setBeatTarget(board);
    expect(board.dataset.beat).toBeUndefined();
    await vi.advanceTimersByTimeAsync(50);
    expect(board.dataset.beat).toBe("a");
    expect(board.style.getPropertyValue("--beat-strength")).toBe(
      String(hitStrength[0] / 3),
    );
    audio.currentTime = hitMs[1] / 1000 - 0.05;
    await vi.advanceTimersByTimeAsync(80);
    await vi.advanceTimersByTimeAsync(50);
    expect(board.dataset.beat).toBe("b");
  });

  it("muting fades out, pauses and stops the bounce; unmuting resumes", async () => {
    const board = document.createElement("section");
    engine.enterCardMode();
    await vi.advanceTimersByTimeAsync(0);
    audio.currentTime = hitMs[0] / 1000 - 0.01;
    engine.setBeatTarget(board);
    await vi.advanceTimersByTimeAsync(20);
    expect(board.dataset.beat).toBeDefined();

    settings.setMuted(true);
    expect(fade().value).toBe(0);
    expect(board.dataset.beat).toBeUndefined();
    await vi.advanceTimersByTimeAsync(1000);
    expect(audio.paused).toBe(true);
    expect(window.localStorage.getItem("card-mode-music-muted")).toBe("1");

    settings.setMuted(false);
    await vi.advanceTimersByTimeAsync(0);
    expect(audio.paused).toBe(false);
    expect(fade().value).toBe(1);
  });

  it("waits for the visitor's first interaction when the browser blocks autoplay", async () => {
    playError = new DOMException("blocked", "NotAllowedError");
    engine.enterCardMode();
    await vi.advanceTimersByTimeAsync(0);
    expect(settings.musicSettings().blocked).toBe(true);
    expect(audio.paused).toBe(true);

    playError = null;
    fireEvent.pointerDown(document.body);
    await vi.advanceTimersByTimeAsync(0);
    expect(settings.musicSettings().blocked).toBe(false);
    expect(audio.paused).toBe(false);
  });

  it("stays silent where Web Audio is missing", async () => {
    vi.resetModules();
    vi.stubGlobal("AudioContext", undefined);
    const silent: Engine = await import("@/features/rogue/audio/music-engine");
    expect(() => {
      silent.enterCardMode();
      silent.setDucked(true);
      silent.setBeatTarget(document.createElement("section"));
      silent.leaveCardMode();
    }).not.toThrow();
  });
});

describe("MusicToggle (P9.11)", () => {
  async function renderToggle() {
    const { MusicToggle } = await import("@/features/rogue/audio/MusicToggle");
    render(<MusicToggle />);
    return screen.getByRole("button", { name: "Music" });
  }

  it("is a pressed toggle that mutes and remembers it", async () => {
    const toggle = await renderToggle();
    expect(toggle.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
    expect(window.localStorage.getItem("card-mode-music-muted")).toBe("1");
    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-pressed")).toBe("true");
  });

  it("starts the music instead of muting it while the browser holds it", async () => {
    const startMusic = vi.fn();
    vi.doMock("@/features/rogue/audio/use-card-music", () => ({
      musicEngine: () => ({ startMusic }),
    }));
    const { MusicToggle } = await import("@/features/rogue/audio/MusicToggle");
    settings.setBlocked(true);
    render(<MusicToggle />);
    const toggle = screen.getByRole("button", { name: "Music" });
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(toggle);
    expect(startMusic).toHaveBeenCalled();
    expect(settings.musicSettings().muted).toBe(false);
  });
});
