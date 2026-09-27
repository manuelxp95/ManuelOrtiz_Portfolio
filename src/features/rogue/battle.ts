import { profile } from "@/content";
import { sections } from "@/domain/sections";
import type { SectionId } from "@/domain/types";
import {
  cardReducer,
  initialCardState,
  type CardEvent,
  type CardState,
} from "./card-machine";
import {
  cardAction,
  projectCards,
  sectionOf,
  skillCards,
  type CardId,
} from "./cards";

/**
 * The battlefield of Card Mode (Roadmap P9.1–P9.4): a turn-based duel between the hero (the
 * portfolio's owner) and an original ASCII bug, played from a deck. Every two cards the hero plays,
 * the bug takes a turn. The game never gates content: a card always opens its dialog, whatever
 * the state of the fight, and the site header reaches every section even when its card is in
 * the deck.
 */
export const BUG = { name: "The Legacy Bug", maxHp: 100 } as const;
export const HERO = { name: profile.name.split(" ")[0], maxHp: 50 } as const;

/** Cards the hero plays before the bug acts. */
export const ACTIONS_PER_TURN = 2;
/** The hand refills to this after each play; draw effects can push it up to the maximum. */
export const HAND_SIZE = 5;
export const MAX_HAND = 7;

export type BossMove = "attack" | "charge" | "heal";

/** The bug's readable cycle; its next move is always shown as its intent. */
export const BOSS_PATTERN: readonly BossMove[] = [
  "attack",
  "charge",
  "attack",
  "heal",
];
export const BOSS_ATTACK = 8;
export const BOSS_HEAL = 12;

export interface Combat {
  heroHp: number;
  block: number;
  strength: number;
  dodge: boolean;
  bugHp: number;
  /** A charge doubles the bug's next attack. */
  charged: boolean;
  /** 1-based turn number. */
  turn: number;
  actionsLeft: number;
  /** "pending": the bug acts once the board is back to idle; "acting": its move is showing. */
  boss: "waiting" | "pending" | "acting";
  outcome: "won" | "lost" | null;
}

export const initialCombat: Combat = {
  heroHp: HERO.maxHp,
  block: 0,
  strength: 0,
  dodge: false,
  bugHp: BUG.maxHp,
  charged: false,
  turn: 1,
  actionsLeft: ACTIONS_PER_TURN,
  boss: "waiting",
  outcome: null,
};

/** What the last card or bug move did, for the effect animation and the live region. */
export type Hit =
  | {
      by: "card";
      card: CardId;
      damage: number;
      /** Cards the play pulled from the deck into the hand. */
      drawn: CardId[];
      /** Increments per event, so each one restarts its animation. */
      count: number;
    }
  | {
      by: "bug";
      move: BossMove;
      /** Attack: damage the hero took after block; heal: HP restored. */
      amount: number;
      blocked: number;
      dodged: boolean;
      count: number;
    };

export interface BoardState {
  card: CardState;
  /** Draw pile, top first. */
  deck: CardId[];
  hand: CardId[];
  /** Sections opened this session (read), in order. */
  played: SectionId[];
  combat: Combat;
  lastHit: Hit | null;
  /** PRNG state: shuffles and reinsertions stay a pure function of the events. */
  seed: number;
}

/** mulberry32: [a number in [0, 1), the next seed]. */
export function random(seed: number): [number, number] {
  const next = (seed + 0x6d2b79f5) >>> 0;
  let t = next;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, next];
}

function shuffle<T>(items: readonly T[], seed: number): [T[], number] {
  const result = [...items];
  let state = seed;
  for (let index = result.length - 1; index > 0; index--) {
    const [value, next] = random(state);
    state = next;
    const swap = Math.floor(value * (index + 1));
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return [result, state];
}

/**
 * The opening hand is dealt from the section cards only, so the first thing a visitor sees is the
 * portfolio's sections; project and skill cards wait in the shuffled deck.
 */
function deal(seed: number): Pick<BoardState, "deck" | "hand" | "seed"> {
  const [shuffledSections, afterSections] = shuffle(
    sections.map((section) => section.id),
    seed,
  );
  const hand = shuffledSections.slice(0, HAND_SIZE);
  const [deck, afterDeck] = shuffle(
    [...shuffledSections.slice(HAND_SIZE), ...projectCards, ...skillCards],
    afterSections,
  );
  return { hand, deck, seed: afterDeck };
}

export function createBoardState(seed: number): BoardState {
  return {
    card: initialCardState,
    played: [],
    combat: initialCombat,
    lastHit: null,
    ...deal(seed),
  };
}

export type BoardEvent =
  | CardEvent
  /** The board is idle and the bug's turn is due: it makes its move. */
  | { type: "BOSS_ACT" }
  /** The bug's move has shown (or was skipped): the hero's next turn starts. */
  | { type: "BOSS_DONE" }
  /** "Play again" after a win or a loss: the fight restarts with a fresh deal. */
  | { type: "RESET_BATTLE" };

export function bossMove(combat: Pick<Combat, "turn">): BossMove {
  return BOSS_PATTERN[(combat.turn - 1) % BOSS_PATTERN.length];
}

/** The bug's intent for its coming turn: its move and, for attacks, the damage. */
export function bossIntent(combat: Combat): { move: BossMove; amount: number } {
  const move = bossMove(combat);
  if (move === "attack")
    return {
      move,
      amount: combat.charged ? BOSS_ATTACK * 2 : BOSS_ATTACK,
    };
  return { move, amount: move === "heal" ? BOSS_HEAL : 0 };
}

export function cardDamage(card: CardId, strength: number): number {
  const attack = cardAction(card).attack;
  return attack ? attack.hits * (attack.perHit + strength) : 0;
}

const isKind = (card: CardId, kind: "project" | "skill") =>
  card.startsWith(`${kind}:`);

/**
 * A card leaves the hand: its draw effect pulls matching cards from the deck, the hand refills to
 * its size from the top, and the played card goes back into the deck at a random position.
 */
function cycle(
  state: BoardState,
  card: CardId,
): Pick<BoardState, "deck" | "hand" | "seed"> & { drawn: CardId[] } {
  let hand = state.hand.filter((held) => held !== card);
  let deck = [...state.deck];
  const drawn: CardId[] = [];
  const draw = cardAction(card).draw;
  if (draw) {
    for (const candidate of state.deck) {
      if (drawn.length === draw.count || hand.length >= MAX_HAND) break;
      if (!isKind(candidate, draw.from)) continue;
      drawn.push(candidate);
      hand = [...hand, candidate];
      deck = deck.filter((held) => held !== candidate);
    }
  }
  while (hand.length < HAND_SIZE && deck.length > 0) {
    drawn.push(deck[0]);
    hand = [...hand, deck[0]];
    deck = deck.slice(1);
  }
  const [value, seed] = random(state.seed);
  const at = Math.floor(value * (deck.length + 1));
  deck = [...deck.slice(0, at), card, ...deck.slice(at)];
  return { hand, deck, seed, drawn };
}

/** A played card: its effect on the fight, and one of the turn's actions spent. */
function applyCard(combat: Combat, card: CardId): [Combat, number] {
  if (combat.outcome || combat.boss !== "waiting") return [combat, 0];
  const action = cardAction(card);
  const damage = Math.min(combat.bugHp, cardDamage(card, combat.strength));
  const bugHp = combat.bugHp - damage;
  const actionsLeft = combat.actionsLeft - 1 + (action.energy ?? 0);
  return [
    {
      ...combat,
      bugHp,
      block: combat.block + (action.block ?? 0),
      strength: combat.strength + (action.strength ?? 0),
      dodge: combat.dodge || !!action.dodge,
      heroHp: Math.min(HERO.maxHp, combat.heroHp + (action.heal ?? 0)),
      actionsLeft,
      boss: bugHp > 0 && actionsLeft <= 0 ? "pending" : "waiting",
      outcome: bugHp === 0 ? "won" : null,
    },
    damage,
  ];
}

function bossAct(state: BoardState): BoardState {
  const { combat } = state;
  const move = bossMove(combat);
  const count = (state.lastHit?.count ?? 0) + 1;
  if (move === "charge")
    return {
      ...state,
      combat: { ...combat, charged: true, boss: "acting" },
      lastHit: { by: "bug", move, amount: 0, blocked: 0, dodged: false, count },
    };
  if (move === "heal") {
    const healed = Math.min(BOSS_HEAL, BUG.maxHp - combat.bugHp);
    return {
      ...state,
      combat: { ...combat, bugHp: combat.bugHp + healed, boss: "acting" },
      lastHit: {
        by: "bug",
        move,
        amount: healed,
        blocked: 0,
        dodged: false,
        count,
      },
    };
  }
  const raw = combat.charged ? BOSS_ATTACK * 2 : BOSS_ATTACK;
  const dodged = combat.dodge;
  const blocked = dodged ? 0 : Math.min(combat.block, raw);
  const amount = dodged ? 0 : raw - blocked;
  const heroHp = Math.max(0, combat.heroHp - amount);
  return {
    ...state,
    combat: {
      ...combat,
      heroHp,
      block: dodged ? combat.block : combat.block - blocked,
      dodge: false,
      charged: false,
      boss: "acting",
      outcome: heroHp === 0 ? "lost" : null,
    },
    lastHit: { by: "bug", move, amount, blocked, dodged, count },
  };
}

/**
 * The card machine plus the deck and the fight. A card played from the hand (PLAY, or a drop on
 * the battlefield) is an action and cycles through the deck; opening a section directly (URL hash,
 * back/forward, header links) only marks it read.
 */
export function boardReducer(state: BoardState, event: BoardEvent): BoardState {
  switch (event.type) {
    case "BOSS_ACT":
      return state.combat.boss === "pending" && !state.combat.outcome
        ? bossAct(state)
        : state;
    case "BOSS_DONE":
      if (state.combat.boss !== "acting") return state;
      return {
        ...state,
        combat: {
          ...state.combat,
          boss: "waiting",
          turn: state.combat.turn + 1,
          actionsLeft: ACTIONS_PER_TURN,
        },
      };
    case "RESET_BATTLE":
      return {
        ...state,
        combat: initialCombat,
        lastHit: null,
        ...deal(state.seed),
      };
  }

  const card = cardReducer(state.card, event);
  if (card === state.card) return state;
  const entering =
    (card.status === "playing" || card.status === "expanded") &&
    !(state.card.status === "playing" && state.card.card === card.card) &&
    !(
      (state.card.status === "expanded" || state.card.status === "closing") &&
      state.card.card === card.card
    )
      ? card.card
      : null;
  if (!entering) return { ...state, card };

  const section = sectionOf(entering);
  const played = state.played.includes(section)
    ? state.played
    : [...state.played, section];
  const fromHand =
    (event.type === "PLAY" || event.type === "DROP") &&
    state.hand.includes(entering);
  if (!fromHand) return { ...state, card, played };

  const { drawn, ...cycled } = cycle(state, entering);
  const [combat, damage] = applyCard(state.combat, entering);
  return {
    ...state,
    ...cycled,
    card,
    played,
    combat,
    lastHit:
      combat === state.combat && drawn.length === 0
        ? state.lastHit
        : {
            by: "card",
            card: entering,
            damage,
            drawn,
            count: (state.lastHit?.count ?? 0) + 1,
          },
  };
}
