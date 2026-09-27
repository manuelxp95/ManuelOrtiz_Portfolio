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
 * The battlefield of Card Mode (Roadmap P9.1–P9.2): a duel between the hero (the portfolio's
 * owner) and an original ASCII bug. Attack cards hit the bug, skill and power cards act on the
 * hero. Game data only — the professional content stays in the section panels, and every number
 * and token below is derived from it, never a second copy.
 */
export const BUG = { name: "The Legacy Bug", maxHp: 100 } as const;
export const HERO = { name: profile.name.split(" ")[0], maxHp: 100 } as const;

export type CardType = "attack" | "skill" | "power";
export type Target = "bug" | "hero";

export type EffectKind =
  "summon" | "buff" | "combo" | "burst" | "runes" | "coins" | "scroll";

export interface CardAction {
  type: CardType;
  target: Target;
  kind: EffectKind;
  /** What the card does, shown and announced when it lands. */
  verb: string;
  /** Glyphs or words the effect throws at its target. */
  tokens: string[];
  /** Attack cards: damage to the bug. The attacks add up to the bug's HP. */
  damage?: number;
  /** Skill and power cards: the status the hero gains. */
  status?: string;
}

export const cardActions: Record<SectionId, CardAction> = {
  about: {
    type: "power",
    target: "hero",
    kind: "summon",
    verb: `${HERO.name} steps in`,
    tokens: ["@"],
    status: "Ready",
  },
  skills: {
    type: "power",
    target: "hero",
    kind: "buff",
    verb: `Strength +${skills.length}`,
    tokens: skills.slice(0, 6).map((skill) => skill.name),
    status: `Str ${skills.length}`,
  },
  experience: {
    type: "attack",
    target: "bug",
    kind: "combo",
    verb: `${experience.length}-hit combo`,
    tokens: experience.map((entry) => String(entry.startYear)),
    damage: 40,
  },
  projects: {
    type: "attack",
    target: "bug",
    kind: "burst",
    verb: `Relic burst ×${projects.length}`,
    tokens: projects.slice(0, 8).map(() => "✦"),
    damage: 40,
  },
  education: {
    type: "skill",
    target: "hero",
    kind: "runes",
    verb: `Block +${education.length}`,
    tokens: education.map((_, index) => (index % 2 ? "◆" : "◇")),
    status: `Block ${education.length}`,
  },
  contact: {
    type: "skill",
    target: "hero",
    kind: "coins",
    verb: `Gold +${contactLinks.length}`,
    tokens: [...contactLinks, ...contactLinks].map(() => "$"),
    status: `Gold ${contactLinks.length}`,
  },
  cv: {
    type: "attack",
    target: "bug",
    kind: "scroll",
    verb: "Résumé scroll",
    tokens: ["≡", "≡", "≡"],
    damage: 20,
  },
};

export interface Hit {
  card: SectionId;
  /** Damage dealt; 0 for hero cards and for a card that had already been played. */
  damage: number;
  /** Increments per landed card, so each hit restarts its animation. */
  count: number;
}

export interface BoardState {
  card: CardState;
  /** Cards played (or opened) this session, in order. */
  played: SectionId[];
  lastHit: Hit | null;
}

export const initialBoardState: BoardState = {
  card: initialCardState,
  played: [],
  lastHit: null,
};

export function bugHp(played: readonly SectionId[]): number {
  return Math.max(
    0,
    played.reduce<number>(
      (hp, card) => hp - (cardActions[card].damage ?? 0),
      BUG.maxHp,
    ),
  );
}

/** Statuses the hero holds, in the order the cards were played. */
export function heroStatuses(played: readonly SectionId[]): string[] {
  return played.flatMap((card) => cardActions[card].status ?? []);
}

/** The card machine plus game progress: a card lands when it starts playing or opens directly. */
export function boardReducer(state: BoardState, event: CardEvent): BoardState {
  const card = cardReducer(state.card, event);
  if (card === state.card) return state;
  const landed =
    (card.status === "playing" || card.status === "expanded") &&
    !(state.card.status === "playing" && state.card.card === card.card) &&
    !(
      (state.card.status === "expanded" || state.card.status === "closing") &&
      state.card.card === card.card
    )
      ? card.card
      : null;
  if (!landed) return { ...state, card };
  const fresh = !state.played.includes(landed);
  return {
    card,
    played: fresh ? [...state.played, landed] : state.played,
    lastHit: {
      card: landed,
      damage: fresh ? (cardActions[landed].damage ?? 0) : 0,
      count: (state.lastHit?.count ?? 0) + 1,
    },
  };
}
