import { useEffect, useState } from "react";
import type { SectionId } from "@/domain/types";
import { frameLoaders } from "./ascii/frame-loaders";
import { useReducedMotion } from "./use-reduced-motion";

const FRAME_MS = 60;

/**
 * Plays one turn of the card's pre-rendered ASCII object when it appears, then rests on the first
 * frame — no idle loop. Hovering or focusing the art replays it. Reduced motion shows the rest
 * frame only.
 */
export function AsciiAnimation({ section }: { section: SectionId }) {
  const reducedMotion = useReducedMotion();
  const [loaded, setLoaded] = useState<{
    section: SectionId;
    frames: readonly string[];
  } | null>(null);
  const [frame, setFrame] = useState(0);
  const [plays, setPlays] = useState(0);
  const frames = loaded?.section === section ? loaded.frames : null;

  useEffect(() => {
    let cancelled = false;
    frameLoaders[section]().then((module) => {
      if (!cancelled) setLoaded({ section, frames: module.frames });
    });
    return () => {
      cancelled = true;
    };
  }, [section]);

  useEffect(() => {
    if (!frames || reducedMotion) return;
    let raf = 0;
    let start: number | null = null;
    const step = (time: number) => {
      start ??= time;
      const index = Math.floor((time - start) / FRAME_MS);
      if (index >= frames.length) {
        setFrame(0);
        return;
      }
      setFrame(index);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [frames, reducedMotion, plays]);

  return (
    <span
      aria-hidden="true"
      className="ascii-art"
      onPointerEnter={() => setPlays((count) => count + 1)}
    >
      {frames?.[frame] ?? ""}
    </span>
  );
}
