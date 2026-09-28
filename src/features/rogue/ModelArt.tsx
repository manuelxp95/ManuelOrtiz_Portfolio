import { useEffect, useState } from "react";
import { AsciiArt } from "./AsciiArt";
import type { DepthArt } from "./ascii/depth";
import { modelFrameLoaders } from "./ascii/frame-loaders";
import { ASCII_MODELS, type AsciiModelId } from "./ascii/scenes";

interface ModelFrames {
  frames: readonly DepthArt[];
  frameMs: number;
  defeated: DepthArt;
}

interface ModelArtProps {
  model: AsciiModelId;
  /** Shows the defeated pose instead of the loop. */
  defeated: boolean;
  reducedMotion: boolean;
}

/**
 * A combatant's ASCII art (Roadmap P9.8–P9.9): its model's own animation, pre-rendered, looping
 * while the fight is on screen. The combatants' loops are Card Mode's one owner-approved idle
 * animation (ADR-013): they only re-render this text, advance once per frame of the animation,
 * stop with the tab hidden (animation frames pause) and never run under reduced motion, which shows
 * the rest frame (the loop's first). All of a model's art is its own chunk, fetched when the
 * battlefield mounts; until it arrives an empty box of the art's size holds its place.
 */
export function ModelArt({ model, defeated, reducedMotion }: ModelArtProps) {
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
    if (!loaded || reducedMotion || defeated) return;
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
  }, [loaded, reducedMotion, defeated]);

  if (!loaded) {
    const { cols, rows } = ASCII_MODELS[model].size;
    return (
      <span
        className="ascii-depth"
        style={{ width: `${cols}ch`, height: `${rows}lh` }}
      />
    );
  }
  return (
    <AsciiArt
      art={
        defeated ? loaded.defeated : loaded.frames[reducedMotion ? 0 : frame]
      }
    />
  );
}
