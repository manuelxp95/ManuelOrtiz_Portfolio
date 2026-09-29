import { useEffect, useRef, type CSSProperties } from "react";
import { AsciiArt } from "./AsciiArt";
import { ENVIRONMENT_LAYERS } from "./ascii/environment";
import { environmentArt } from "./ascii/frames/environment.generated";

interface EnvironmentProps {
  /** The layers behind the combatants, or those in front of them (still under the hand). */
  part: "back" | "front";
  /** The back part follows the pointer (fine pointers only); never under reduced motion. */
  reducedMotion: boolean;
}

/**
 * Card Mode's environment (Roadmap P9.12, ADR-017): the server-room ruins, one depth-cued ASCII
 * layer per entry of ENVIRONMENT_LAYERS. Its own chunk with the art, fetched when the battlefield
 * mounts. The camera is CSS: each layer shifts by `--cam-x`/`--cam-y` (set on the battlefield from
 * the pointer, the aimed target and card effects) times its parallax, so nothing runs while idle.
 * Decorative: hidden from assistive tech.
 */
export function Environment({ part, reducedMotion }: EnvironmentProps) {
  const stage = useRef<HTMLDivElement>(null);
  const follows = part === "back" && !reducedMotion;

  useEffect(() => {
    const field = stage.current?.parentElement;
    if (!follows || !field || !matchMedia("(pointer: fine)").matches) return;
    let frame = 0;
    let x = 0;
    let y = 0;
    const apply = () => {
      frame = 0;
      field.style.setProperty("--pointer-x", x.toFixed(3));
      field.style.setProperty("--pointer-y", y.toFixed(3));
    };
    // One style write per display frame at most, and only while the pointer moves.
    const move = (event: PointerEvent) => {
      x = (event.clientX / innerWidth) * 2 - 1;
      y = (event.clientY / innerHeight) * 2 - 1;
      frame ||= requestAnimationFrame(apply);
    };
    addEventListener("pointermove", move, { passive: true });
    return () => {
      removeEventListener("pointermove", move);
      cancelAnimationFrame(frame);
      field.style.removeProperty("--pointer-x");
      field.style.removeProperty("--pointer-y");
    };
  }, [follows]);

  return (
    <div
      ref={stage}
      aria-hidden="true"
      className="environment"
      data-part={part}
    >
      {ENVIRONMENT_LAYERS.filter(
        (layer) => layer.front === (part === "front"),
      ).map((layer) => (
        <pre
          key={layer.id}
          className="env-layer"
          data-layer={layer.id}
          data-anchor={layer.anchor}
          style={
            {
              "--cols": layer.size.cols,
              "--parallax": layer.parallax,
              "--depth": layer.depth,
            } as CSSProperties
          }
        >
          <AsciiArt art={environmentArt[layer.id]} />
        </pre>
      ))}
    </div>
  );
}
