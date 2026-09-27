import { useDroppable } from "@dnd-kit/core";
import { m, type TargetAndTransition, type Transition } from "motion/react";
import { useEffect, type ReactNode } from "react";
import type { SectionId } from "@/domain/types";
import {
  BUG,
  bugHp,
  cardEffects,
  type BoardState,
  type EffectKind,
} from "./battle";

export const BATTLEFIELD_ID = "battlefield";

/** How long a played card's effect runs before its dialog opens (any tap, Enter or Escape skips). */
export const EFFECT_MS = 900;

const BUG_ART = String.raw`
      \       /
       \ .-. /
     .-'     '-.
    /  (o) (o)  \
 --|     ___     |--
 --|    [___]    |--
 --\   .-----.   /--
    '-._______.-'`.slice(1);

const SQUASHED_ART = String.raw`

        x     x
     .-----------.
 ___/   x     x   \___
    '-._________.-'
     [ BUG  FIXED ]`.slice(1);

/** Where the card lands relative to its place in the hand, measured when it is played. */
export interface Flight {
  dx: number;
  dy: number;
  width: number;
}

type TokenMotion = {
  initial: TargetAndTransition;
  animate: TargetAndTransition;
  transition: Transition;
};

/** One motion per token, relative to the bug's center; every kind reads differently. */
function tokenMotion(
  kind: EffectKind,
  index: number,
  count: number,
): TokenMotion {
  const angle = (index / Math.max(count, 1)) * Math.PI * 2;
  const spread = (index - (count - 1) / 2) * 2.2;
  const delay = 0.3 + index * 0.06;
  switch (kind) {
    case "summon":
      return {
        initial: { opacity: 0, scale: 0.2, y: 60 },
        animate: { opacity: [0, 1, 0], scale: [0.2, 2.4, 3], y: [60, 0, 0] },
        transition: { duration: 0.6, delay: 0.3, times: [0, 0.5, 1] },
      };
    case "buff":
      return {
        initial: { opacity: 0, y: 90, x: `${spread}rem` },
        animate: { opacity: [0, 1, 0], y: [90, -10, -40] },
        transition: { duration: 0.55, delay, times: [0, 0.6, 1] },
      };
    case "combo":
      return {
        initial: { opacity: 0, y: 110, x: `${spread}rem` },
        animate: { opacity: [0, 1, 0], y: [110, 0, 0], scale: [1, 1, 1.6] },
        transition: {
          duration: 0.3,
          delay: 0.3 + index * 0.08,
          times: [0, 0.7, 1],
        },
      };
    case "burst":
      return {
        initial: { opacity: 0, x: 0, y: 0 },
        animate: {
          opacity: [0, 1, 0],
          x: [0, Math.cos(angle) * 110],
          y: [0, Math.sin(angle) * 70],
        },
        transition: { duration: 0.5, delay: 0.35 },
      };
    case "runes":
      return {
        initial: { opacity: 0, scale: 0 },
        animate: {
          opacity: [0, 1, 0],
          scale: [0, 1.4, 1],
          x: Math.cos(angle) * 95,
          y: Math.sin(angle) * 60,
        },
        transition: { duration: 0.55, delay },
      };
    case "coins":
      return {
        initial: { opacity: 0, y: -110, x: `${spread}rem` },
        animate: { opacity: [0, 1, 0], y: [-110, 0, 10] },
        transition: {
          duration: 0.45,
          delay: 0.3 + index * 0.05,
          times: [0, 0.8, 1],
        },
      };
    case "scroll":
      return {
        initial: { opacity: 0, scaleX: 0, y: 70 + index * 14 },
        animate: { opacity: [0, 1, 0], scaleX: [0, 1, 1] },
        transition: { duration: 0.55, delay: 0.3 + index * 0.05 },
      };
  }
}

interface BattlefieldProps {
  board: BoardState;
  dragging: boolean;
  candidate: boolean;
  flight: Flight | null;
  reducedMotion: boolean;
  /** Tap on the field: skips a running effect, or plays the lifted card. */
  onActivate: () => void;
  /** The effect finished. */
  onEffectDone: () => void;
  /** Renders the played card's face for the flight. */
  renderFace: (card: SectionId) => ReactNode;
}

/**
 * The battlefield above the hand (Roadmap P9.1): the drop target of the drag enhancement, the
 * stage of each card's effect, and the bug's health. Decorative for assistive tech except the live
 * region, which states what each played card did.
 */
export function Battlefield({
  board,
  dragging,
  candidate,
  flight,
  reducedMotion,
  onActivate,
  onEffectDone,
  renderFace,
}: BattlefieldProps) {
  const { setNodeRef } = useDroppable({ id: BATTLEFIELD_ID });
  const hp = bugHp(board.played);
  const defeated = hp === 0;
  const playing = board.card.status === "playing" ? board.card.card : null;
  const hit = board.lastHit;
  const effect = playing ? cardEffects[playing] : null;

  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(onEffectDone, EFFECT_MS);
    return () => window.clearTimeout(timer);
  }, [playing, onEffectDone]);

  const message = hit
    ? [
        `${cardEffects[hit.card].verb}.`,
        hit.damage > 0
          ? `${BUG.name} takes ${hit.damage} damage, ${hp} HP left.`
          : `${BUG.name} already took that hit.`,
        defeated ? "Bug fixed: every section has been read." : "",
      ]
        .filter(Boolean)
        .join(" ")
    : "";

  return (
    <div
      ref={setNodeRef}
      data-dragging={dragging || undefined}
      data-candidate={candidate || undefined}
      data-playing={playing ?? undefined}
      className="battlefield"
      onClick={onActivate}
    >
      <div className="bug" data-defeated={defeated || undefined}>
        <p className="bug-name">
          {BUG.name}
          <span className="bug-hp-text">
            {" "}
            · HP {hp}/{BUG.maxHp}
          </span>
        </p>
        <div aria-hidden="true" className="bug-hp">
          <span style={{ width: `${(hp / BUG.maxHp) * 100}%` }} />
        </div>
        <div className="bug-body">
          <m.pre
            key={hit?.count ?? 0}
            aria-hidden="true"
            className="bug-art"
            initial={false}
            animate={
              hit && hit.damage > 0 && !reducedMotion
                ? { x: [0, -8, 8, -5, 5, 0] }
                : undefined
            }
            transition={{ duration: 0.4, delay: playing ? 0.45 : 0 }}
          >
            {defeated ? SQUASHED_ART : BUG_ART}
          </m.pre>
          {effect && !reducedMotion && (
            <div key={hit?.count} aria-hidden="true" className="effect-layer">
              {effect.tokens.map((token, index) => {
                const motion = tokenMotion(
                  effect.kind,
                  index,
                  effect.tokens.length,
                );
                return (
                  <m.span
                    key={index}
                    className="effect-token"
                    data-kind={effect.kind}
                    {...motion}
                  >
                    {token}
                  </m.span>
                );
              })}
              {hit && hit.damage > 0 && (
                <m.span
                  className="damage"
                  initial={{ opacity: 0, y: 0 }}
                  animate={{ opacity: [0, 1, 1, 0], y: [0, -30, -40, -50] }}
                  transition={{ duration: 0.6, delay: 0.45 }}
                >
                  −{hit.damage}
                </m.span>
              )}
              <m.span
                className="effect-verb"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: [0, 1, 1], y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                {effect.verb}
              </m.span>
            </div>
          )}
        </div>
      </div>
      {playing && flight && !reducedMotion && (
        <m.div
          key={`flight-${hit?.count}`}
          aria-hidden="true"
          className="section-card played-card"
          style={{ width: flight.width }}
          initial={{ x: flight.dx, y: flight.dy, rotate: -6, scale: 1 }}
          animate={{
            x: 0,
            y: 0,
            rotate: 0,
            scale: [1, 1.1, 0.6],
            opacity: [1, 1, 0],
          }}
          transition={{ duration: 0.55, times: [0, 0.55, 1], ease: "easeOut" }}
        >
          {renderFace(playing)}
        </m.div>
      )}
      <p className="battlefield-hint font-mono">
        {candidate
          ? "[ release to play ]"
          : dragging
            ? "[ drop the card on the bug ]"
            : defeated
              ? "> bug fixed. replay any card to reread it_"
              : "> play a card on the bug_"}
      </p>
      <p className="sr-only" aria-live="polite">
        {message}
      </p>
    </div>
  );
}
