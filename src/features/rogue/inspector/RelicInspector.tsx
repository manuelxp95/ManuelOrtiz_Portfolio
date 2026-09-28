import {
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { AsciiArt } from "../AsciiArt";
import { renderAscii, type AsciiShape } from "../ascii/renderer";
import { INSPECTOR_POSE, INSPECTOR_SIZE } from "../ascii/scenes";
import { useReducedMotion } from "../use-reduced-motion";

interface Pose {
  yaw: number;
  pitch: number;
}

const PITCH_LIMIT = 1.2;
/** One button press or arrow key: 15°. */
const STEP = Math.PI / 12;
const RADIANS_PER_PX = 0.012;
/** Coasting velocity decays as e^(−FRICTION·ms); below MIN_SPEED (rad/ms) it stops. */
const FRICTION = 0.004;
const MIN_SPEED = 0.0002;
/** A release later than this after the last move is a stop, not a flick. */
const FLICK_MS = 80;
const INTRO_SPEED = 0.006;

const clampPitch = (pitch: number) =>
  Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, pitch));

const turnKeys: Record<string, [number, number]> = {
  ArrowLeft: [-STEP, 0],
  ArrowRight: [STEP, 0],
  ArrowUp: [0, -STEP],
  ArrowDown: [0, STEP],
};

interface RelicInspectorProps {
  shape: AsciiShape;
  /** Text alternative of the model. */
  description: string;
}

/**
 * Pseudo-3D relic viewer (Roadmap P8, ADR-007): raymarches the model to ASCII in the browser, one
 * frame per input — dragging, arrow keys or the turn buttons. Released flicks coast to a stop; an
 * intro coast shows the model's depth once. No frame is drawn while nothing moves, and reduced
 * motion drops both coasts (direct manipulation still works).
 */
export function RelicInspector({ shape, description }: RelicInspectorProps) {
  const reducedMotion = useReducedMotion();
  const [pose, setPose] = useState<Pose>(INSPECTOR_POSE);
  const art = useMemo(
    () => renderAscii({ shape, ...INSPECTOR_SIZE, ...pose }),
    [shape, pose],
  );
  const coastFrame = useRef(0);
  const inputFrame = useRef(0);
  const pending = useRef<[number, number]>([0, 0]);
  const drag = useRef<{
    x: number;
    y: number;
    time: number;
    vYaw: number;
    vPitch: number;
  } | null>(null);

  function turn(yaw: number, pitch: number) {
    setPose((current) => ({
      yaw: current.yaw + yaw,
      pitch: clampPitch(current.pitch + pitch),
    }));
  }

  /** Pointer moves can outpace the display: apply them once per animation frame. */
  function queueTurn(yaw: number, pitch: number) {
    pending.current[0] += yaw;
    pending.current[1] += pitch;
    inputFrame.current ||= requestAnimationFrame(() => {
      inputFrame.current = 0;
      const [queuedYaw, queuedPitch] = pending.current;
      pending.current = [0, 0];
      turn(queuedYaw, queuedPitch);
    });
  }

  function stopCoast() {
    cancelAnimationFrame(coastFrame.current);
    coastFrame.current = 0;
  }

  /** Keep turning with the given velocity (rad/ms) until friction stops it. */
  function coast(vYaw: number, vPitch: number) {
    stopCoast();
    if (reducedMotion) return;
    let last = performance.now();
    const step = (now: number) => {
      const elapsed = Math.min(now - last, 50);
      last = now;
      const decay = Math.exp(-FRICTION * elapsed);
      vYaw *= decay;
      vPitch *= decay;
      turn(vYaw * elapsed, vPitch * elapsed);
      coastFrame.current =
        Math.hypot(vYaw, vPitch) > MIN_SPEED ? requestAnimationFrame(step) : 0;
    };
    coastFrame.current = requestAnimationFrame(step);
  }

  const intro = useEffectEvent(() => coast(INTRO_SPEED, 0));
  useEffect(() => {
    intro();
    return () => {
      cancelAnimationFrame(coastFrame.current);
      cancelAnimationFrame(inputFrame.current);
    };
  }, []);

  function onPointerDown(event: PointerEvent<HTMLElement>) {
    if (event.button !== 0) return;
    stopCoast();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      x: event.clientX,
      y: event.clientY,
      time: event.timeStamp,
      vYaw: 0,
      vPitch: 0,
    };
  }

  function onPointerMove(event: PointerEvent<HTMLElement>) {
    const current = drag.current;
    if (!current) return;
    const yaw = (event.clientX - current.x) * RADIANS_PER_PX;
    const pitch = (event.clientY - current.y) * RADIANS_PER_PX;
    const elapsed = Math.max(1, event.timeStamp - current.time);
    drag.current = {
      x: event.clientX,
      y: event.clientY,
      time: event.timeStamp,
      vYaw: yaw / elapsed,
      vPitch: pitch / elapsed,
    };
    queueTurn(yaw, pitch);
  }

  function onPointerUp(event: PointerEvent<HTMLElement>) {
    const released = drag.current;
    drag.current = null;
    if (released && event.timeStamp - released.time < FLICK_MS)
      coast(released.vYaw, released.vPitch);
  }

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    const delta = turnKeys[event.key];
    if (!delta) return;
    event.preventDefault();
    stopCoast();
    turn(...delta);
  }

  return (
    <figure className="relic-inspector">
      <pre
        aria-hidden="true"
        className="relic-inspector-art"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (drag.current = null)}
      >
        <AsciiArt art={art} />
      </pre>
      <figcaption className="sr-only">
        ASCII 3D model: {description}.
      </figcaption>
      <div
        role="group"
        aria-label="Turn the model"
        onKeyDown={onKeyDown}
        className="relic-inspector-controls"
      >
        {(
          [
            ["Turn left", "◄", "ArrowLeft"],
            ["Turn right", "►", "ArrowRight"],
            ["Tilt up", "▲", "ArrowUp"],
            ["Tilt down", "▼", "ArrowDown"],
          ] as const
        ).map(([label, glyph, key]) => (
          <button
            key={key}
            type="button"
            aria-label={label}
            onClick={() => {
              stopCoast();
              turn(...turnKeys[key]);
            }}
          >
            {glyph}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            stopCoast();
            setPose(INSPECTOR_POSE);
          }}
        >
          Reset view
        </button>
      </div>
      <p className="font-mono text-xs text-muted">
        &gt; drag the relic, or use the arrow keys on these buttons_
      </p>
    </figure>
  );
}
