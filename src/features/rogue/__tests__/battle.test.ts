import { describe, expect, it } from "vitest";
import { education, experience } from "@/content";
import { SECTION_IDS } from "@/domain/types";
import {
  ACTIONS_PER_TURN,
  BOSS_ATTACK,
  BOSS_HEAL,
  BOSS_PATTERN,
  BUG,
  HAND_SIZE,
  HERO,
  MAX_HAND,
  boardReducer,
  bossIntent,
  cardDamage,
  createBoardState,
  initialCombat,
  random,
  type BoardEvent,
  type BoardState,
} from "@/features/rogue/battle";
import { allCards, cardAction, type CardId } from "@/features/rogue/cards";

const SEED = 42;
const run = (events: BoardEvent[], from: BoardState) =>
  events.reduce(boardReducer, from);
/** A board whose hand holds the given cards (the rest of the deck unchanged). */
const holding = (
  hand: CardId[],
  combat: Partial<BoardState["combat"]> = {},
): BoardState => {
  const start = createBoardState(SEED);
  const pool = [...start.hand, ...start.deck];
  return {
    ...start,
    hand,
    deck: pool.filter((card) => !hand.includes(card)),
    combat: { ...initialCombat, ...combat },
  };
};
/** Play a card from the hand and close its dialog. */
const play = (card: CardId): BoardEvent[] => [
  { type: "PLAY", card, reducedMotion: false },
  { type: "EFFECT_DONE" },
  { type: "CLOSE", reducedMotion: true },
];
const bossTurn: BoardEvent[] = [{ type: "BOSS_ACT" }, { type: "BOSS_DONE" }];

describe("the deck", () => {
  it("deals an opening hand of sections and shuffles every other card into the deck", () => {
    const board = createBoardState(SEED);
    expect(board.hand).toHaveLength(HAND_SIZE);
    for (const card of board.hand) expect(SECTION_IDS).toContain(card);
    expect([...board.hand, ...board.deck].sort()).toEqual([...allCards].sort());
    expect(createBoardState(SEED)).toEqual(board);
    expect(createBoardState(SEED + 1).deck).not.toEqual(board.deck);
  });

  it("a played card goes back into the deck and the hand refills", () => {
    const board = createBoardState(SEED);
    const card = board.hand.find((held) => !cardAction(held).draw)!;
    const after = run(play(card), board);
    expect(after.hand).toHaveLength(HAND_SIZE);
    expect(after.hand).not.toContain(card);
    expect(after.hand).toContain(board.deck[0]);
    expect(after.deck).toContain(card);
    expect([...after.hand, ...after.deck].sort()).toEqual([...allCards].sort());
  });

  it("Projects pulls project cards from the deck, and Skills skill cards", () => {
    const projects = run(play("projects"), holding(["projects", "about"]));
    const pulled = projects.hand.filter((card) => card.startsWith("project:"));
    expect(pulled).toHaveLength(2);
    expect(projects.lastHit).toMatchObject({ by: "card", card: "projects" });

    const skills = run(play("skills"), holding(["skills", "about"]));
    expect(
      skills.hand.filter((card) => card.startsWith("skill:")),
    ).toHaveLength(2);
  });

  it("never holds more than the maximum hand", () => {
    const full = holding([
      "projects",
      "about",
      "cv",
      "contact",
      "education",
      "experience",
      "skills",
    ]);
    const after = run(play("projects"), full);
    expect(after.hand.length).toBeLessThanOrEqual(MAX_HAND);
  });

  it("the random generator is deterministic", () => {
    expect(random(7)).toEqual(random(7));
    const [value] = random(7);
    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThan(1);
  });
});

describe("turns", () => {
  it(`the bug's turn comes after ${ACTIONS_PER_TURN} cards played from the hand`, () => {
    const one = run(play("experience"), holding(["experience", "cv", "about"]));
    expect(one.combat.actionsLeft).toBe(ACTIONS_PER_TURN - 1);
    const two = run(play("cv"), one);
    expect(two.combat.boss).toBe("pending");
    const acted = run([{ type: "BOSS_ACT" }], two);
    expect(acted.combat.heroHp).toBe(HERO.maxHp - BOSS_ATTACK);
    const next = run([{ type: "BOSS_DONE" }], acted);
    expect(next.combat).toMatchObject({
      boss: "waiting",
      turn: 2,
      actionsLeft: ACTIONS_PER_TURN,
    });
  });

  it("an energy card lets the hero play one more card this turn", () => {
    const energy = "skill:practice" as const;
    const state = run(
      [...play(energy), ...play("cv")],
      holding([energy, "cv", "about"]),
    );
    expect(state.combat.actionsLeft).toBe(1);
    expect(state.combat.boss).toBe("waiting");
  });

  it("Strength from a skill card adds to every hit", () => {
    const strong = run(
      play("skill:backend"),
      holding(["skill:backend", "experience"]),
    );
    expect(strong.combat.strength).toBe(2);
    expect(cardDamage("experience", strong.combat.strength)).toBe(
      experience.length * 6,
    );
  });

  it("the bug follows its announced pattern: attack, charge, double attack, heal", () => {
    expect(BOSS_PATTERN).toEqual(["attack", "charge", "attack", "heal"]);
    let state = holding(["about", "contact"], { bugHp: 50 });
    const moves: string[] = [];
    for (let turn = 0; turn < 4; turn++) {
      const intent = bossIntent(state.combat);
      state = {
        ...state,
        combat: {
          ...state.combat,
          actionsLeft: 0,
          boss: "pending",
          dodge: false,
        },
      };
      state = run([{ type: "BOSS_ACT" }], state);
      const hit = state.lastHit!;
      if (hit.by === "bug") {
        moves.push(`${hit.move}:${hit.amount}`);
        if (intent.move === "attack") expect(hit.amount).toBe(intent.amount);
      }
      state = run([{ type: "BOSS_DONE" }], state);
    }
    expect(moves).toEqual([
      `attack:${BOSS_ATTACK}`,
      "charge:0",
      `attack:${BOSS_ATTACK * 2}`,
      `heal:${BOSS_HEAL}`,
    ]);
  });

  it("Block absorbs an attack and Dodge avoids one", () => {
    const blocked = run(
      [...play("education"), ...play("about"), ...bossTurn],
      holding(["education", "about", "cv"]),
    );
    expect(blocked.combat.heroHp).toBe(HERO.maxHp);
    expect(blocked.lastHit).toMatchObject({ by: "bug", dodged: true });
    expect(blocked.combat.block).toBe(education.length);
  });

  it("direct opens (URL hash, back/forward) never touch the fight or the deck", () => {
    const board = createBoardState(SEED);
    const opened = run([{ type: "OPEN", card: "cv" }], board);
    expect(opened.played).toEqual(["cv"]);
    expect(opened.combat).toBe(board.combat);
    expect(opened.hand).toBe(board.hand);
    expect(opened.deck).toBe(board.deck);
  });
});

describe("outcome", () => {
  it("bringing the bug to 0 wins, and the bug stops acting", () => {
    const won = run(play("cv"), holding(["cv"], { bugHp: 5, actionsLeft: 1 }));
    expect(won.combat).toMatchObject({ bugHp: 0, outcome: "won" });
    expect(run([{ type: "BOSS_ACT" }], won)).toBe(won);
  });

  it("the hero at 0 loses; Play again deals a fresh fight and hand", () => {
    const lost = run(
      bossTurn,
      holding(["cv"], { heroHp: 3, actionsLeft: 0, boss: "pending" }),
    );
    expect(lost.combat).toMatchObject({ heroHp: 0, outcome: "lost" });
    const reset = run([{ type: "RESET_BATTLE" }], lost);
    expect(reset.combat).toBe(initialCombat);
    expect(reset.hand).toHaveLength(HAND_SIZE);
    expect(BUG.maxHp).toBe(reset.combat.bugHp);
  });
});
