import { useEffect, useRef, useState } from "react";
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
 * the first frame: no idle loop. An event during a play extends it instead of restarting it, and a
 * play always ends on a whole loop, so the art never jumps. Reduced motion shows the rest frame
 * only. The frames are their own chunk, fetched when the battlefield mounts; the rest frame ships
 * with Card Mode.
 */
export function useBossArt(playKey: string, reducedMotion: boolean): string {
  const [loaded, setLoaded] = useState<BossFrames | null>(null);
  const [frame, setFrame] = useState(0);
  const raf = useRef(0);
  /** The running play, timed only by animation-frame timestamps: whole loops to play. */
  const play = useRef<{
    start: number | null;
    elapsed: number;
    loops: number;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    import("./ascii/frames/boss.generated").then((module) => {
      if (!cancelled) setLoaded(module);
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf.current);
      play.current = null;
    };
  }, []);

  useEffect(() => {
    if (!loaded || reducedMotion) return;
    const { frames, frameMs } = loaded;
    const loop = frames.length * frameMs;
    if (play.current) {
      play.current.loops = Math.floor(play.current.elapsed / loop) + LOOPS;
      return;
    }
    play.current = { start: null, elapsed: 0, loops: LOOPS };
    const step = (time: number) => {
      const running = play.current;
      if (!running) return;
      running.start ??= time;
      running.elapsed = time - running.start;
      if (running.elapsed >= running.loops * loop) {
        play.current = null;
        setFrame(0);
        return;
      }
      setFrame(Math.floor(running.elapsed / frameMs) % frames.length);
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  }, [loaded, reducedMotion, playKey]);

  return loaded && !reducedMotion ? loaded.frames[frame] : BOSS_REST;
}
