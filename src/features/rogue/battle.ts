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
import {
  REWARD_EVERY,
  drawOffer,
  heroStats,
  modifier,
  type HeroStats,
  type ModifierId,
  type Stacks,
} from "./modifiers";

/**
 * The battlefield of Card Mode (Roadmap P9.1–P9.7): a turn-based duel between the hero (the
 * portfolio's owner) and an original ASCII bug, played from a deck. Every two cards the hero plays,
 * the bug takes a turn; every two rounds the hero picks a stacking modifier. The game never gates content: a card always opens its dialog, whatever
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
  /** Modifiers picked this fight, with their stack counts. */
  modifiers: Stacks;
  /** Modifiers on offer: the fight is paused until one is picked or the offer is skipped. */
  reward: ModifierId[] | null;
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
  modifiers: {},
  reward: null,
};

/** The hero's stats with every held modifier. */
export const statsOf = (combat: Pick<Combat, "modifiers">): HeroStats =>
  heroStats(combat.modifiers, HERO.maxHp);

/** What the last card or bug move did, for the effect animation and the live region. */
export type Hit =
  | {
      by: "card";
      card: CardId;
      damage: number;
      /** Modifier rolls: an extra strike, doubled damage, HP healed from the damage. */
      extraHit: boolean;
      crit: boolean;
      healed: number;
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
      /** Damage the bug took back from the hero's thorns. */
      thorns: number;
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
  | { type: "RESET_BATTLE" }
  /** The hero takes one of the offered modifiers; the fight resumes. */
  | { type: "PICK_MODIFIER"; id: ModifierId }
  /** The hero declines the offer; the fight resumes. */
  | { type: "SKIP_REWARD" };

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

/** True with the given chance; rolls (and advances the seed) only when the chance is above 0. */
function chance(probability: number, seed: number): [boolean, number] {
  if (probability <= 0) return [false, seed];
  const [value, next] = random(seed);
  return [value < probability, next];
}

interface Strike {
  damage: number;
  extraHit: boolean;
  crit: boolean;
  seed: number;
}

/** A card's damage with the hero's modifiers: an extra strike, a critical, the multiplier. */
function strike(combat: Combat, card: CardId, seed: number): Strike {
  const attack = cardAction(card).attack;
  if (!attack) return { damage: 0, extraHit: false, crit: false, seed };
  const stats = statsOf(combat);
  const [extraHit, afterHit] = chance(stats.extraHitChance, seed);
  const [crit, afterCrit] = chance(stats.critChance, afterHit);
  const raw =
    (attack.hits + (extraHit ? 1 : 0)) * (attack.perHit + combat.strength);
  return {
    damage: Math.round(raw * stats.damageMultiplier * (crit ? 2 : 1)),
    extraHit,
    crit,
    seed: afterCrit,
  };
}

/** A played card: its effect on the fight, and one of the turn's actions spent. */
function applyCard(
  combat: Combat,
  card: CardId,
  seed: number,
): [Combat, Strike & { healed: number }] {
  if (combat.outcome || combat.boss !== "waiting")
    return [
      combat,
      { damage: 0, extraHit: false, crit: false, healed: 0, seed },
    ];
  const action = cardAction(card);
  const stats = statsOf(combat);
  const hit = strike(combat, card, seed);
  const damage = Math.min(combat.bugHp, hit.damage);
  const bugHp = combat.bugHp - damage;
  const actionsLeft = combat.actionsLeft - 1 + (action.energy ?? 0);
  const heroHp = Math.min(
    stats.maxHp,
    combat.heroHp + (action.heal ?? 0) + Math.round(damage * stats.lifesteal),
  );
  return [
    {
      ...combat,
      bugHp,
      block: combat.block + (action.block ?? 0),
      strength: combat.strength + (action.strength ?? 0),
      dodge: combat.dodge || !!action.dodge,
      heroHp,
      actionsLeft,
      boss: bugHp > 0 && actionsLeft <= 0 ? "pending" : "waiting",
      outcome: bugHp === 0 ? "won" : null,
    },
    { ...hit, damage, healed: heroHp - combat.heroHp },
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
      lastHit: {
        by: "bug",
        move,
        amount: 0,
        blocked: 0,
        dodged: false,
        thorns: 0,
        count,
      },
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
        thorns: 0,
        count,
      },
    };
  }
  const stats = statsOf(combat);
  const raw = combat.charged ? BOSS_ATTACK * 2 : BOSS_ATTACK;
  const [evaded, seed] = combat.dodge
    ? [false, state.seed]
    : chance(stats.dodgeChance, state.seed);
  const dodged = combat.dodge || evaded;
  const blocked = dodged ? 0 : Math.min(combat.block, raw);
  const amount = dodged ? 0 : raw - blocked;
  const heroHp = Math.max(0, combat.heroHp - amount);
  const thorns = Math.min(combat.bugHp, stats.thorns);
  const bugHp = combat.bugHp - thorns;
  return {
    ...state,
    seed,
    combat: {
      ...combat,
      heroHp,
      bugHp,
      block: dodged ? combat.block : combat.block - blocked,
      dodge: false,
      charged: false,
      boss: "acting",
      // Thorns that finish the bug win the fight, even on the blow that downs the hero.
      outcome: bugHp === 0 ? "won" : heroHp === 0 ? "lost" : null,
    },
    lastHit: { by: "bug", move, amount, blocked, dodged, thorns, count },
  };
}

/** The hero's next turn; every `REWARD_EVERY` rounds the fight pauses on a modifier offer. */
function nextTurn(state: BoardState): BoardState {
  const { combat } = state;
  const stats = statsOf(combat);
  const rewardDue = !combat.outcome && combat.turn % REWARD_EVERY === 0;
  let seed = state.seed;
  const reward = rewardDue
    ? drawOffer(combat.modifiers, () => {
        const [value, next] = random(seed);
        seed = next;
        return value;
      })
    : [];
  return {
    ...state,
    seed,
    combat: {
      ...combat,
      boss: "waiting",
      turn: combat.turn + 1,
      actionsLeft: ACTIONS_PER_TURN + stats.actions,
      block: combat.block + stats.turnBlock,
      reward: reward.length ? reward : null,
    },
  };
}

/** A picked modifier stacks and applies its one-off effect; the fight resumes. */
function pickModifier(combat: Combat, id: ModifierId): Combat {
  if (!combat.reward?.includes(id)) return combat;
  const picked: Combat = {
    ...combat,
    modifiers: { ...combat.modifiers, [id]: (combat.modifiers[id] ?? 0) + 1 },
    reward: null,
  };
  const { onPick } = modifier(id);
  if (!onPick) return picked;
  const { heroHp, block } = picked;
  return { ...picked, ...onPick({ heroHp, block }, statsOf(picked)) };
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
      return state.combat.boss === "acting" ? nextTurn(state) : state;
    case "PICK_MODIFIER": {
      const combat = pickModifier(state.combat, event.id);
      return combat === state.combat ? state : { ...state, combat };
    }
    case "SKIP_REWARD":
      return state.combat.reward
        ? { ...state, combat: { ...state.combat, reward: null } }
        : state;
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
  // While a modifier is on offer the fight is paused: a card still opens, but stays in the hand.
  const fromHand =
    (event.type === "PLAY" || event.type === "DROP") &&
    state.hand.includes(entering) &&
    !state.combat.reward;
  if (!fromHand) return { ...state, card, played };

  const { drawn, ...cycled } = cycle(state, entering);
  const [combat, { damage, extraHit, crit, healed, seed }] = applyCard(
    state.combat,
    entering,
    cycled.seed,
  );
  return {
    ...state,
    ...cycled,
    seed,
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
            extraHit,
            crit,
            healed,
            drawn,
            count: (state.lastHit?.count ?? 0) + 1,
          },
  };
}
