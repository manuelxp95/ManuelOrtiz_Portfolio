import {
  contactLinks,
  education,
  experience,
  profile,
  projects,
  skills,
} from "@/content";
import type { SectionId } from "@/domain/types";
import {
  cardReducer,
  initialCardState,
  type CardEvent,
  type CardState,
} from "./card-machine";

/**
 * The battlefield of Card Mode (Roadmap P9.1–P9.3): a turn-based duel between the hero (the
 * portfolio's owner) and an original ASCII bug. Every two cards the hero plays, the bug takes a
 * turn. Game data only — the professional content stays in the section panels, and card effects
 * draw their numbers and tokens from it, never a second copy. The game never gates content: a card
 * always opens its dialog, whatever the state of the fight.
 */
export const BUG = { name: "The Legacy Bug", maxHp: 100 } as const;
export const HERO = { name: profile.name.split(" ")[0], maxHp: 50 } as const;

/** Cards the hero plays before the bug acts. */
export const ACTIONS_PER_TURN = 2;

export type CardType = "attack" | "skill" | "power";
export type Target = "bug" | "hero";

export type EffectKind =
  "summon" | "buff" | "combo" | "burst" | "runes" | "coins" | "scroll";

export interface CardAction {
  type: CardType;
  target: Target;
  kind: EffectKind;
  /** What the card does, shown on the battlefield. */
  verb: string;
  /** Glyphs or words the effect throws at its target. */
  tokens: string[];
  /** Attacks: hits × (damage per hit + Strength). */
  attack?: { hits: number; perHit: number };
  block?: number;
  heal?: number;
  strength?: number;
  dodge?: boolean;
}

export const cardActions: Record<SectionId, CardAction> = {
  about: {
    type: "power",
    target: "hero",
    kind: "summon",
    verb: "Dodge the next attack",
    tokens: ["@"],
    dodge: true,
  },
  skills: {
    type: "power",
    target: "hero",
    kind: "buff",
    verb: "Strength +2",
    tokens: skills.slice(0, 6).map((skill) => skill.name),
    strength: 2,
  },
  experience: {
    type: "attack",
    target: "bug",
    kind: "combo",
    verb: `${experience.length}-hit combo`,
    tokens: experience.map((entry) => String(entry.startYear)),
    attack: { hits: experience.length, perHit: 4 },
  },
  projects: {
    type: "attack",
    target: "bug",
    kind: "burst",
    verb: `Relic burst ×${projects.length}`,
    tokens: projects.slice(0, 8).map(() => "✦"),
    attack: { hits: 1, perHit: projects.length * 2 },
  },
  education: {
    type: "skill",
    target: "hero",
    kind: "runes",
    verb: `Block +${education.length}`,
    tokens: education.map((_, index) => (index % 2 ? "◆" : "◇")),
    block: education.length,
  },
  contact: {
    type: "skill",
    target: "hero",
    kind: "coins",
    verb: `Merchant potion: heal ${contactLinks.length * 3}`,
    tokens: [...contactLinks, ...contactLinks].map(() => "$"),
    heal: contactLinks.length * 3,
  },
  cv: {
    type: "attack",
    target: "bug",
    kind: "scroll",
    verb: "Résumé scroll",
    tokens: ["≡", "≡", "≡"],
    attack: { hits: 1, perHit: 15 },
  },
};

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
      card: SectionId;
      damage: number;
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
  /** Cards opened this session (read), in order. */
  played: SectionId[];
  combat: Combat;
  lastHit: Hit | null;
}

export const initialBoardState: BoardState = {
  card: initialCardState,
  played: [],
  combat: initialCombat,
  lastHit: null,
};

export type BoardEvent =
  | CardEvent
  /** The board is idle and the bug's turn is due: it makes its move. */
  | { type: "BOSS_ACT" }
  /** The bug's move has shown (or was skipped): the hero's next turn starts. */
  | { type: "BOSS_DONE" }
  /** "Play again" after a win or a loss. */
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

export function cardDamage(card: SectionId, strength: number): number {
  const attack = cardActions[card].attack;
  return attack ? attack.hits * (attack.perHit + strength) : 0;
}

/** A played card: its effect on the fight, and one of the turn's actions spent. */
function applyCard(combat: Combat, card: SectionId): [Combat, number] {
  if (combat.outcome || combat.boss !== "waiting") return [combat, 0];
  const action = cardActions[card];
  const damage = Math.min(combat.bugHp, cardDamage(card, combat.strength));
  const bugHp = combat.bugHp - damage;
  const actionsLeft = combat.actionsLeft - 1;
  return [
    {
      ...combat,
      bugHp,
      block: combat.block + (action.block ?? 0),
      strength: combat.strength + (action.strength ?? 0),
      dodge: combat.dodge || !!action.dodge,
      heroHp: Math.min(HERO.maxHp, combat.heroHp + (action.heal ?? 0)),
      actionsLeft,
      boss: bugHp > 0 && actionsLeft === 0 ? "pending" : "waiting",
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
 * The card machine plus the fight. A card played from the hand (PLAY, or a drop on the
 * battlefield) is an action; opening a card directly (URL hash, back/forward) only marks it read.
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
      return { ...state, combat: initialCombat, lastHit: null };
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

  const played = state.played.includes(entering)
    ? state.played
    : [...state.played, entering];
  const fromHand = event.type === "PLAY" || event.type === "DROP";
  if (!fromHand) return { ...state, card, played };

  const [combat, damage] = applyCard(state.combat, entering);
  if (combat === state.combat) return { ...state, card, played };
  return {
    card,
    played,
    combat,
    lastHit: {
      by: "card",
      card: entering,
      damage,
      count: (state.lastHit?.count ?? 0) + 1,
    },
  };
}
