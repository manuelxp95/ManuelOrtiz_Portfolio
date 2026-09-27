import { useDroppable } from "@dnd-kit/core";
import { m, type TargetAndTransition, type Transition } from "motion/react";
import { useEffect, type ReactNode } from "react";
import type { SectionId } from "@/domain/types";
import {
  BUG,
  bugHp,
  cardActions,
  HERO,
  heroStatuses,
  type BoardState,
  type EffectKind,
  type Hit,
  type Target,
} from "./battle";

export const BATTLEFIELD_ID = "battlefield";

/** How long a played card's effect runs before its dialog opens (any tap, Enter or Escape skips). */
export const EFFECT_MS = 900;

/** Placeholder hero until the owner's model is converted to ASCII (ADR-009). */
const HERO_ART = String.raw`
    .---.
   ( o o )
    \ - /
  .-'---'-.
 / |  M  | \
   |_____|
   /  |  \
  /   |   \ `.slice(1);

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

/** Where the card lands relative to where it was played from, measured on play or drop. */
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

/** One motion per token, relative to the target's center; every kind reads differently. */
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
        initial: { opacity: 0, y: 70, x: `${spread * 0.5}rem` },
        animate: { opacity: [0, 1, 0], y: [70, -10, -40] },
        transition: { duration: 0.55, delay, times: [0, 0.6, 1] },
      };
    case "combo":
      return {
        initial: { opacity: 0, x: -140, y: (index % 3) * 14 - 14 },
        animate: { opacity: [0, 1, 0], x: [-140, 0, 0], scale: [1, 1, 1.6] },
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
          x: [0, Math.cos(angle) * 90],
          y: [0, Math.sin(angle) * 60],
        },
        transition: { duration: 0.5, delay: 0.35 },
      };
    case "runes":
      return {
        initial: { opacity: 0, scale: 0 },
        animate: {
          opacity: [0, 1, 0],
          scale: [0, 1.4, 1],
          x: Math.cos(angle) * 60,
          y: Math.sin(angle) * 55,
        },
        transition: { duration: 0.55, delay },
      };
    case "coins":
      return {
        initial: { opacity: 0, y: -90, x: `${spread * 0.6}rem` },
        animate: { opacity: [0, 1, 0], y: [-90, 0, 10] },
        transition: {
          duration: 0.45,
          delay: 0.3 + index * 0.05,
          times: [0, 0.8, 1],
        },
      };
    case "scroll":
      return {
        initial: { opacity: 0, scaleX: 0, y: 40 + index * 14 },
        animate: { opacity: [0, 1, 0], scaleX: [0, 1, 1] },
        transition: { duration: 0.55, delay: 0.3 + index * 0.05 },
      };
  }
}

interface CombatantProps {
  side: Target;
  name: string;
  hp: number;
  maxHp: number;
  art: string;
  statuses?: string[];
  aimed: boolean;
  defeated?: boolean;
  /** The card whose effect is landing on this combatant, if any. */
  effect: { card: SectionId; hit: Hit | null } | null;
  reducedMotion: boolean;
}

function Combatant({
  side,
  name,
  hp,
  maxHp,
  art,
  statuses = [],
  aimed,
  defeated = false,
  effect,
  reducedMotion,
}: CombatantProps) {
  const action = effect ? cardActions[effect.card] : null;
  const hit = effect?.hit ?? null;
  const struck = !!hit && hit.damage > 0 && !reducedMotion;

  return (
    <div
      className="combatant"
      data-combatant={side}
      data-aimed={aimed || undefined}
      data-defeated={defeated || undefined}
    >
      <p className="combatant-name">
        {name}
        <span className="combatant-hp-text">
          {" "}
          · HP {hp}/{maxHp}
        </span>
      </p>
      <div aria-hidden="true" className="combatant-hp">
        <span style={{ width: `${(hp / maxHp) * 100}%` }} />
      </div>
      <div className="combatant-body">
        <m.pre
          key={`art-${hit?.count ?? 0}`}
          aria-hidden="true"
          className="combatant-art"
          initial={false}
          animate={
            struck
              ? { x: [0, -8, 8, -5, 5, 0] }
              : action && !reducedMotion
                ? { y: [0, -6, 0] }
                : undefined
          }
          transition={{ duration: 0.4, delay: 0.45 }}
        >
          {art}
        </m.pre>
        {action && !reducedMotion && (
          <div
            key={`effect-${hit?.count}`}
            aria-hidden="true"
            className="effect-layer"
          >
            {action.tokens.map((token, index) => (
              <m.span
                key={index}
                className="effect-token"
                data-kind={action.kind}
                {...tokenMotion(action.kind, index, action.tokens.length)}
              >
                {token}
              </m.span>
            ))}
            {struck && (
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
              {action.verb}
            </m.span>
          </div>
        )}
      </div>
      {statuses.length > 0 && (
        <ul aria-label={`${name}'s statuses`} className="combatant-statuses">
          {statuses.map((status) => (
            <li key={status}>{status}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface BattlefieldProps {
  board: BoardState;
  dragging: boolean;
  candidate: boolean;
  /** The target of the card being dragged or lifted, highlighted while aiming. */
  aimed: Target | null;
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
 * The battlefield above the hand (Roadmap P9.1–P9.2): the hero on the left, the bug on the right,
 * and the drop target of the drag enhancement. Attack cards land on the bug, skill and power cards
 * on the hero. Decorative for assistive tech except the statuses and a polite live region stating
 * what each played card did.
 */
export function Battlefield({
  board,
  dragging,
  candidate,
  aimed,
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
  const target = playing ? cardActions[playing].target : null;
  const effectOn = (side: Target) =>
    playing && target === side
      ? { card: playing, hit: hit?.card === playing ? hit : null }
      : null;

  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(onEffectDone, EFFECT_MS);
    return () => window.clearTimeout(timer);
  }, [playing, onEffectDone]);

  let message = "";
  if (hit) {
    const action = cardActions[hit.card];
    message =
      action.target === "hero"
        ? `${action.verb}: ${HERO.name} gains ${action.status}.`
        : hit.damage > 0
          ? `${action.verb}: ${BUG.name} takes ${hit.damage} damage, ${hp} HP left.${defeated ? " Bug fixed." : ""}`
          : `${action.verb}: ${BUG.name} already took that hit.`;
  }

  return (
    <div
      ref={setNodeRef}
      data-dragging={dragging || undefined}
      data-candidate={candidate || undefined}
      data-playing={playing ?? undefined}
      className="battlefield"
      onClick={onActivate}
    >
      <div className="combatants">
        <Combatant
          side="hero"
          name={HERO.name}
          hp={HERO.maxHp}
          maxHp={HERO.maxHp}
          art={HERO_ART}
          statuses={heroStatuses(board.played)}
          aimed={aimed === "hero"}
          effect={effectOn("hero")}
          reducedMotion={reducedMotion}
        />
        <Combatant
          side="bug"
          name={BUG.name}
          hp={hp}
          maxHp={BUG.maxHp}
          art={defeated ? SQUASHED_ART : BUG_ART}
          aimed={aimed === "bug"}
          defeated={defeated}
          effect={effectOn("bug")}
          reducedMotion={reducedMotion}
        />
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
            ? "[ drop the card on the field ]"
            : defeated
              ? "> bug fixed. replay any card to reread it_"
              : "> attacks hit the bug, skills and powers help you_"}
      </p>
      <p className="sr-only" aria-live="polite">
        {message}
      </p>
    </div>
  );
}
