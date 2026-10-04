import { SECTION_IDS, type SectionId } from "@/domain/types";
import { initialCombat, type BoardState, type Combat } from "./battle";
import { initialCardState } from "./card-machine";
import { allCards, baseOf, type CardId } from "./cards";
import { modifierIds } from "./modifiers";

/**
 * The fight survives leaving Card Mode and reloading the page (Roadmap P9.13, ADR-018): a
 * per-visitor convenience on this device, like the music's mute. Only the game is kept — deck,
 * hand, read sections, combat and the PRNG seed; the card machine and the last hit are transient,
 * so a restored board is idle and replays nothing. Bump `VERSION` whenever `BoardState` changes
 * shape: a game saved by another version, or naming cards the content no longer has, is dropped
 * and a new one dealt.
 */
const BOARD_KEY = "card-mode-board";
const INTRO_KEY = "card-mode-intro-seen";
const VERSION = 1;

/** The part of the board that is the game itself. */
type Game = Pick<BoardState, "deck" | "hand" | "played" | "combat" | "seed">;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const BASE_CARDS = new Set<string>(allCards);
const SECTIONS = new Set<string>(SECTION_IDS);
const MODIFIERS = new Set<string>(modifierIds);

/** Every card exactly once across hand and deck, plus golden copies of known cards. */
function validCards(hand: unknown, deck: unknown): boolean {
  if (!Array.isArray(hand) || !Array.isArray(deck)) return false;
  const cards = [...hand, ...deck];
  if (!cards.every((card) => typeof card === "string")) return false;
  if (new Set(cards).size !== cards.length) return false;
  const plain = cards.filter((card) => BASE_CARDS.has(card));
  return (
    plain.length === BASE_CARDS.size &&
    cards.every((card) => BASE_CARDS.has(baseOf(card as CardId)))
  );
}

/** Same fields with the same types as a fresh fight. */
function validCombat(combat: unknown): combat is Combat {
  if (!isRecord(combat)) return false;
  const { modifiers, reward, boss, outcome } = combat;
  return (
    Object.entries(initialCombat).every(
      ([key, value]) =>
        value === null ||
        isRecord(value) ||
        typeof combat[key] === typeof value,
    ) &&
    ["waiting", "pending", "acting"].includes(boss as string) &&
    [null, "won", "lost"].includes(outcome as string | null) &&
    isRecord(modifiers) &&
    Object.entries(modifiers).every(
      ([id, stacks]) => MODIFIERS.has(id) && typeof stacks === "number",
    ) &&
    (reward === null ||
      (Array.isArray(reward) && reward.every((id) => MODIFIERS.has(id))))
  );
}

/** A saved game as a board ready to play, or null when it is missing or unusable. */
export function restoreBoard(saved: unknown): BoardState | null {
  if (!isRecord(saved) || saved.v !== VERSION) return null;
  const { deck, hand, played, combat, seed } = saved;
  if (
    !validCards(hand, deck) ||
    !Array.isArray(played) ||
    !played.every((id) => SECTIONS.has(id)) ||
    !validCombat(combat) ||
    typeof seed !== "number"
  )
    return null;
  return {
    card: initialCardState,
    lastHit: null,
    deck: deck as CardId[],
    hand: hand as CardId[],
    played: played as SectionId[],
    combat,
    seed,
  };
}

export function loadBoard(): BoardState | null {
  try {
    const saved = window.localStorage.getItem(BOARD_KEY);
    return saved ? restoreBoard(JSON.parse(saved)) : null;
  } catch {
    return null;
  }
}

export function saveBoard(game: Game) {
  try {
    window.localStorage.setItem(
      BOARD_KEY,
      JSON.stringify({ v: VERSION, ...game }),
    );
  } catch {
    // Storage unavailable (private mode): the fight lasts while Card Mode is on screen.
  }
}

export function introSeen(): boolean {
  try {
    return window.localStorage.getItem(INTRO_KEY) === "1";
  } catch {
    return false;
  }
}

export function markIntroSeen() {
  try {
    window.localStorage.setItem(INTRO_KEY, "1");
  } catch {
    // Storage unavailable: the intro may play again on the next visit.
  }
}
