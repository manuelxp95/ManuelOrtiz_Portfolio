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
 * The battlefield of Card Mode (Roadmap P9.1): playing a card hits an original ASCII bug. Game
 * data only — the professional content stays in the section panels, and every effect token below
 * is derived from it, never a second copy.
 */
export const BUG = { name: "The Legacy Bug", maxHp: 100 } as const;

/** Damage per card; the seven add up to the bug's HP, so reading every section defeats it. */
export const cardDamage: Record<SectionId, number> = {
  about: 10,
  skills: 20,
  experience: 20,
  projects: 20,
  education: 10,
  contact: 10,
  cv: 10,
};

export type EffectKind =
  "summon" | "buff" | "combo" | "burst" | "runes" | "coins" | "scroll";

export interface CardEffect {
  kind: EffectKind;
  /** What the card does, shown and announced when it lands. */
  verb: string;
  /** Glyphs or words the effect throws at the bug. */
  tokens: string[];
}

const firstName = profile.name.split(" ")[0];

export const cardEffects: Record<SectionId, CardEffect> = {
  about: {
    kind: "summon",
    verb: `${firstName} joins the fight`,
    tokens: ["@"],
  },
  skills: {
    kind: "buff",
    verb: `Buff: ${skills.length} skills`,
    tokens: skills.slice(0, 6).map((skill) => skill.name),
  },
  experience: {
    kind: "combo",
    verb: `${experience.length}-hit combo`,
    tokens: experience.map((entry) => String(entry.startYear)),
  },
  projects: {
    kind: "burst",
    verb: `Relic burst ×${projects.length}`,
    tokens: projects.slice(0, 8).map(() => "✦"),
  },
  education: {
    kind: "runes",
    verb: `Codex ward ×${education.length}`,
    tokens: education.map((_, index) => (index % 2 ? "◆" : "◇")),
  },
  contact: {
    kind: "coins",
    verb: `Merchant deal ×${contactLinks.length}`,
    tokens: [...contactLinks, ...contactLinks].map(() => "$"),
  },
  cv: { kind: "scroll", verb: "Résumé scroll", tokens: ["≡", "≡", "≡"] },
};

export interface Hit {
  card: SectionId;
  /** 0 when the card had already been played: effects replay, damage doesn't. */
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
    played.reduce<number>((hp, card) => hp - cardDamage[card], BUG.maxHp),
  );
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
      damage: fresh ? cardDamage[landed] : 0,
      count: (state.lastHit?.count ?? 0) + 1,
    },
  };
}
