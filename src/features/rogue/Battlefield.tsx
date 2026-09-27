import { useDroppable } from "@dnd-kit/core";
import { m, type TargetAndTransition, type Transition } from "motion/react";
import { useEffect, type ReactNode } from "react";
import type { SectionId } from "@/domain/types";
import {
  BUG,
  bossIntent,
  cardActions,
  HERO,
  type BoardState,
  type BossMove,
  type Combat,
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

/** A number or word that floats up from a combatant when something happens to it. */
interface Popup {
  text: string;
  tone: "damage" | "heal" | "power";
  key: number;
}

interface CombatantProps {
  side: Target;
  name: string;
  hp: number;
  maxHp: number;
  art: string;
  statuses: string[];
  /** Above the bug: what it will do on its turn. */
  intent?: string;
  aimed: boolean;
  defeated: boolean;
  /** The card whose effect is landing on this combatant. */
  cardEffect: { card: SectionId; key: number } | null;
  popup: Popup | null;
  /** Shakes when hit (key restarts it). */
  shakeKey: number | null;
  /** The bug lunges at the hero when it attacks. */
  lunge: number | null;
  reducedMotion: boolean;
}

function Combatant({
  side,
  name,
  hp,
  maxHp,
  art,
  statuses,
  intent,
  aimed,
  defeated,
  cardEffect,
  popup,
  shakeKey,
  lunge,
  reducedMotion,
}: CombatantProps) {
  const action = cardEffect ? cardActions[cardEffect.card] : null;
  const moving = !reducedMotion && (shakeKey !== null || lunge !== null);

  return (
    <div
      className="combatant"
      data-combatant={side}
      data-aimed={aimed || undefined}
      data-defeated={defeated || undefined}
    >
      {intent !== undefined && (
        <p className="combatant-intent font-mono">
          <span className="sr-only">Next move: </span>
          {intent}
        </p>
      )}
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
          key={`art-${shakeKey ?? lunge ?? 0}`}
          aria-hidden="true"
          className="combatant-art"
          initial={false}
          animate={
            !moving
              ? undefined
              : lunge !== null
                ? { x: [0, -48, 0] }
                : { x: [0, -8, 8, -5, 5, 0] }
          }
          transition={{ duration: 0.45, delay: lunge !== null ? 0.2 : 0.45 }}
        >
          {art}
        </m.pre>
        {action && cardEffect && !reducedMotion && (
          <div
            key={`effect-${cardEffect.key}`}
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
        {popup && (
          <m.span
            key={`popup-${popup.key}`}
            aria-hidden="true"
            className="popup"
            data-tone={popup.tone}
            initial={reducedMotion ? false : { opacity: 0, y: 0 }}
            animate={
              reducedMotion
                ? { opacity: 1 }
                : { opacity: [0, 1, 1, 0], y: [0, -30, -40, -50] }
            }
            transition={{ duration: 0.8, delay: 0.45 }}
          >
            {popup.text}
          </m.span>
        )}
      </div>
      <ul aria-label={`${name}'s statuses`} className="combatant-statuses">
        {statuses.map((status) => (
          <li key={status}>{status}</li>
        ))}
      </ul>
    </div>
  );
}

const intentLabel = (intent: { move: BossMove; amount: number }) =>
  intent.move === "attack"
    ? `⚔ attack ${intent.amount}`
    : intent.move === "heal"
      ? `✚ heal ${intent.amount}`
      : "⚡ charge: next attack ×2";

/** What the live region says about the last card or bug move. */
function describe(hit: Hit, combat: Combat): string {
  if (hit.by === "card") {
    const action = cardActions[hit.card];
    return action.target === "hero"
      ? `${action.verb}. ${HERO.name} has ${combat.heroHp} HP.`
      : `${action.verb}: ${BUG.name} takes ${hit.damage} damage, ${combat.bugHp} HP left.`;
  }
  if (hit.move === "charge")
    return `${BUG.name} charges up: its next attack deals double damage.`;
  if (hit.move === "heal")
    return `${BUG.name} heals ${hit.amount}, ${combat.bugHp} HP.`;
  if (hit.dodged) return `${BUG.name} attacks, but ${HERO.name} dodges.`;
  return `${BUG.name} attacks: ${hit.amount} damage${hit.blocked ? `, ${hit.blocked} blocked` : ""}. ${HERO.name} has ${combat.heroHp} HP.`;
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
  /** The card effect finished. */
  onEffectDone: () => void;
  /** "Play again" after a win or a loss. */
  onReset: () => void;
  /** Renders the played card's face for the flight. */
  renderFace: (card: SectionId) => ReactNode;
}

/**
 * The battlefield above the hand (Roadmap P9.1–P9.3): the hero on the left, the bug on the right,
 * a turn bar, and the drop target of the drag enhancement. Attack cards land on the bug, skill and
 * power cards on the hero; every two cards the bug takes its announced turn. Decorative for
 * assistive tech except the statuses, the bug's intent, the outcome and a polite live region.
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
  onReset,
  renderFace,
}: BattlefieldProps) {
  const { setNodeRef } = useDroppable({ id: BATTLEFIELD_ID });
  const { combat, lastHit: hit } = board;
  const playing = board.card.status === "playing" ? board.card.card : null;
  const bossActing = combat.boss === "acting";
  const cardHit = hit?.by === "card" ? hit : null;
  const bugHit = hit?.by === "bug" && bossActing ? hit : null;

  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(onEffectDone, EFFECT_MS);
    return () => window.clearTimeout(timer);
  }, [playing, onEffectDone]);

  const effectOn = (side: Target) =>
    playing && cardHit?.card === playing && cardActions[playing].target === side
      ? { card: playing, key: cardHit.count }
      : null;

  const bugPopup: Popup | null =
    playing && cardHit && cardHit.damage > 0
      ? { text: `−${cardHit.damage}`, tone: "damage", key: cardHit.count }
      : bugHit?.move === "heal"
        ? { text: `+${bugHit.amount}`, tone: "heal", key: bugHit.count }
        : bugHit?.move === "charge"
          ? { text: "⚡ ×2", tone: "power", key: bugHit.count }
          : null;
  const heroPopup: Popup | null =
    bugHit?.move === "attack"
      ? {
          text: bugHit.dodged
            ? "dodged"
            : bugHit.amount > 0
              ? `−${bugHit.amount}`
              : "blocked",
          tone: bugHit.amount > 0 ? "damage" : "power",
          key: bugHit.count,
        }
      : null;

  const heroStatuses = [
    combat.block > 0 && `Block ${combat.block}`,
    combat.strength > 0 && `Str ${combat.strength}`,
    combat.dodge && "Dodge",
  ].filter((status): status is string => !!status);
  const turnText = combat.outcome
    ? combat.outcome === "won"
      ? "Bug fixed!"
      : `${HERO.name} is down.`
    : combat.boss === "waiting"
      ? `Turn ${combat.turn} · ${combat.actionsLeft} ${combat.actionsLeft === 1 ? "action" : "actions"} before the bug acts`
      : `Turn ${combat.turn} · the bug's move`;

  return (
    <div
      ref={setNodeRef}
      data-dragging={dragging || undefined}
      data-candidate={candidate || undefined}
      data-playing={playing ?? undefined}
      data-boss={combat.boss}
      className="battlefield"
      onClick={onActivate}
    >
      <p className="turn-bar font-mono">{turnText}</p>
      <div className="combatants">
        <Combatant
          side="hero"
          name={HERO.name}
          hp={combat.heroHp}
          maxHp={HERO.maxHp}
          art={HERO_ART}
          statuses={heroStatuses}
          aimed={aimed === "hero"}
          defeated={combat.outcome === "lost"}
          cardEffect={effectOn("hero")}
          popup={heroPopup}
          shakeKey={
            bugHit?.move === "attack" && bugHit.amount > 0 ? bugHit.count : null
          }
          lunge={null}
          reducedMotion={reducedMotion}
        />
        <Combatant
          side="bug"
          name={BUG.name}
          hp={combat.bugHp}
          maxHp={BUG.maxHp}
          art={combat.outcome === "won" ? SQUASHED_ART : BUG_ART}
          statuses={combat.charged ? ["Charged ×2"] : []}
          intent={combat.outcome ? undefined : intentLabel(bossIntent(combat))}
          aimed={aimed === "bug"}
          defeated={combat.outcome === "won"}
          cardEffect={effectOn("bug")}
          popup={bugPopup}
          shakeKey={
            playing && cardHit && cardHit.damage > 0 ? cardHit.count : null
          }
          lunge={bugHit?.move === "attack" ? bugHit.count : null}
          reducedMotion={reducedMotion}
        />
      </div>
      {playing && flight && !reducedMotion && (
        <m.div
          key={`flight-${cardHit?.count}`}
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
      {combat.outcome ? (
        <div className="outcome" role="status">
          <p className="font-mono">
            {combat.outcome === "won"
              ? "> bug fixed. every card still opens its section_"
              : `> ${HERO.name} needs a break. the cards still open their sections_`}
          </p>
          <button
            type="button"
            className="outcome-button"
            onClick={(event) => {
              event.stopPropagation();
              onReset();
            }}
          >
            Play again
          </button>
        </div>
      ) : (
        <p className="battlefield-hint font-mono">
          {candidate
            ? "[ release to play ]"
            : dragging
              ? "[ drop the card on the field ]"
              : "> attacks hit the bug, skills and powers help you_"}
        </p>
      )}
      <p className="sr-only" aria-live="polite">
        {hit ? describe(hit, combat) : ""}
      </p>
    </div>
  );
}
