import { useEffect, useState } from "react";
import { BOSS_REST } from "./ascii/boss.generated";

/** The model's loop is short: each event plays it this many times. */
const LOOPS = 2;

interface BossFrames {
  frames: readonly string[];
  frameMs: number;
}

/**
 * The boss's ASCII art (Roadmap P9.8). Like the card objects, its pre-rendered animation plays when
 * something happens — the fight opens, the boss acts or is hit, a pointer reaches it — then rests on
 * the first frame: no idle loop. Reduced motion shows the rest frame only. The frames are their own
 * chunk, fetched when the battlefield mounts; the rest frame ships with Card Mode.
 */
export function useBossArt(playKey: string, reducedMotion: boolean): string {
  const [loaded, setLoaded] = useState<BossFrames | null>(null);
  const [frame, setFrame] = useState<number | null>(null);

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
      const index = Math.floor((time - start) / frameMs);
      if (index >= frames.length * LOOPS) {
        setFrame(null);
        return;
      }
      setFrame(index % frames.length);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [loaded, reducedMotion, playKey]);

  return loaded && frame !== null && !reducedMotion
    ? loaded.frames[frame]
    : BOSS_REST;
}
