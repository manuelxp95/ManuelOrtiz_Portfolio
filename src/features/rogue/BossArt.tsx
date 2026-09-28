import { useEffect, useState } from "react";
import { BOSS_REST } from "./ascii/boss.generated";

interface BossFrames {
  frames: readonly string[];
  frameMs: number;
}

/**
 * The boss's ASCII art (Roadmap P9.8): its model's own animation, pre-rendered, looping while the
 * fight is on screen. The one loop Card Mode allows, at the owner's request (ADR-013): it only
 * re-renders this text, advances once per frame of the animation, stops with the tab hidden
 * (animation frames pause) and never runs under reduced motion, which shows the rest frame. The
 * frames are their own chunk, fetched when the battlefield mounts; the rest frame ships with Card
 * Mode.
 */
export function BossArt({ reducedMotion }: { reducedMotion: boolean }) {
  const [loaded, setLoaded] = useState<BossFrames | null>(null);
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    let cancelled = false;
    import("./ascii/frames/boss.generated").then((module) => {
      if (!cancelled) setLoaded(module);
    });
    return () => {
      cancelled = true;
    };
  }, []);

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

  return loaded && !reducedMotion ? loaded.frames[frame] : BOSS_REST;
}
