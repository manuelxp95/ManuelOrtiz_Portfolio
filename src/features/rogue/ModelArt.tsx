import { useEffect, useState } from "react";
import { modelFrameLoaders } from "./ascii/frame-loaders";
import type { AsciiModelId } from "./ascii/scenes";

interface ModelFrames {
  frames: readonly string[];
  frameMs: number;
}

interface ModelArtProps {
  model: AsciiModelId;
  /** Shown until the loop loads, and under reduced motion. */
  rest: string;
  reducedMotion: boolean;
}

/**
 * A combatant's ASCII art (Roadmap P9.8–P9.9): its model's own animation, pre-rendered, looping
 * while the fight is on screen. The combatants' loops are Card Mode's one owner-approved idle
 * animation (ADR-013): they only re-render this text, advance once per frame of the animation,
 * stop with the tab hidden (animation frames pause) and never run under reduced motion, which shows
 * the rest frame. Each loop is its own chunk, fetched when the battlefield mounts; the rest frame
 * ships with Card Mode.
 */
export function ModelArt({ model, rest, reducedMotion }: ModelArtProps) {
  const [loaded, setLoaded] = useState<ModelFrames | null>(null);
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    let cancelled = false;
    modelFrameLoaders[model]().then((module) => {
      if (!cancelled) setLoaded(module);
    });
    return () => {
      cancelled = true;
    };
  }, [model]);

  useEffect(() => {
    if (!loaded || reducedMotion) return;
    const { frames, frameMs } = loaded;
    let raf = 0;
    let start: number | null = null;
    const step = (time: number) => {
      start ??= time;
      // Same frame index → React bails out: one render per animation frame, not per display frame.
      setFrame(Math.floor((time - start) / frameMs) % frames.length);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [loaded, reducedMotion]);

  return loaded && !reducedMotion ? loaded.frames[frame] : rest;
}
