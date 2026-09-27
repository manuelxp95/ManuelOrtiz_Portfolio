import { describe, expect, it } from "vitest";
import {
  ACTIONS_PER_TURN,
  BOSS_ATTACK,
  HERO,
  boardReducer,
  cardDamage,
  createBoardState,
  initialCombat,
  statsOf,
  type BoardEvent,
  type BoardState,
  type Combat,
} from "@/features/rogue/battle";
import type { CardId } from "@/features/rogue/cards";
import {
  OFFER_SIZE,
  REWARD_EVERY,
  drawOffer,
  heroStats,
  modifier,
  modifierIds,
  modifiers,
  type ModifierId,
} from "@/features/rogue/modifiers";

const SEED = 42;
const run = (events: BoardEvent[], from: BoardState) =>
  events.reduce(boardReducer, from);
const holding = (hand: CardId[], combat: Partial<Combat> = {}): BoardState => {
  const start = createBoardState(SEED);
  const pool = [...start.hand, ...start.deck];
  return {
    ...start,
    hand,
    deck: pool.filter((card) => !hand.includes(card)),
    combat: { ...initialCombat, ...combat },
  };
};
const play = (card: CardId): BoardEvent[] => [
  { type: "PLAY", card, reducedMotion: false },
  { type: "EFFECT_DONE" },
  { type: "CLOSE", reducedMotion: true },
];
/** The bug's turn, due now. */
const bossRound = (state: BoardState): BoardState =>
  run([{ type: "BOSS_ACT" }, { type: "BOSS_DONE" }], {
    ...state,
    combat: { ...state.combat, actionsLeft: 0, boss: "pending" },
  });
const offering = (reward: ModifierId[], combat: Partial<Combat> = {}) =>
  holding(["cv", "about"], { ...combat, reward });
/** Max out a chance: ten stacks of 10% are a certainty. */
const certain = (id: ModifierId) => ({ [id]: 10 });

describe("modifier offers (P9.7)", () => {
  it(`pauses the fight on an offer of ${OFFER_SIZE} distinct modifiers every ${REWARD_EVERY} rounds`, () => {
    const board = holding(["cv", "about"], { bugHp: 90 });
    const first = bossRound(board);
    expect(first.combat.turn).toBe(2);
    expect(first.combat.reward).toBeNull();
    const second = bossRound(first);
    const offer = second.combat.reward!;
    expect(offer).toHaveLength(OFFER_SIZE);
    expect(new Set(offer).size).toBe(OFFER_SIZE);
    for (const id of offer) expect(modifierIds).toContain(id);
    expect(bossRound(second).combat.reward).toBeNull();
  });

  it("while an offer is open a card still opens, but stays in the hand and does nothing", () => {
    const board = offering(["refactor", "linter", "rubber-duck"]);
    const opened = run(play("cv"), board);
    expect(opened.played).toContain("cv");
    expect(opened.hand).toEqual(board.hand);
    expect(opened.combat).toEqual(board.combat);
  });

  it("a pick stacks and resumes the fight; a skip only resumes it", () => {
    const board = offering(["refactor", "linter", "rubber-duck"], {
      modifiers: { refactor: 1 },
    });
    const picked = run([{ type: "PICK_MODIFIER", id: "refactor" }], board);
    expect(picked.combat.reward).toBeNull();
    expect(picked.combat.modifiers).toEqual({ refactor: 2 });
    expect(statsOf(picked.combat).damageMultiplier).toBe(2);
    const skipped = run([{ type: "SKIP_REWARD" }], board);
    expect(skipped.combat.reward).toBeNull();
    expect(skipped.combat.modifiers).toEqual({ refactor: 1 });
  });

  it("only an offered modifier can be picked", () => {
    const board = offering(["refactor", "linter", "rubber-duck"]);
    expect(run([{ type: "PICK_MODIFIER", id: "scalability" }], board)).toBe(
      board,
    );
  });

  it("offers never repeat a modifier and skip maxed ones", () => {
    const maxed = { "pair-programming": 1 };
    let value = 0;
    for (let draw = 0; draw < 50; draw++) {
      const offer = drawOffer(maxed, () => (value = (value + 0.37) % 1));
      expect(new Set(offer).size).toBe(offer.length);
      expect(offer).not.toContain("pair-programming");
    }
  });

  it("every modifier has a name, a text and a stat or a one-off effect", () => {
    for (const id of modifierIds) {
      const def = modifier(id);
      expect(def.name).toBeTruthy();
      expect(def.text).toBeTruthy();
      expect(def.stats ?? def.onPick).toBeDefined();
    }
    expect(Object.keys(modifiers).length).toBeGreaterThanOrEqual(4);
  });
});

describe("modifier effects", () => {
  it("stacks add up", () => {
    const stats = heroStats({ multithreading: 2, "edge-case": 3 }, 50);
    expect(stats.extraHitChance).toBeCloseTo(0.2);
    expect(stats.critChance).toBeCloseTo(0.3);
    expect(stats.maxHp).toBe(50);
  });

  it("Refactor multiplies damage by ×0.5 per stack", () => {
    const hit = run(
      play("cv"),
      holding(["cv", "about"], { modifiers: { refactor: 1 } }),
    );
    expect(hit.combat.bugHp).toBe(100 - Math.round(cardDamage("cv", 0) * 1.5));
  });

  it("a critical doubles the damage, an extra hit strikes once more", () => {
    const crit = run(
      play("cv"),
      holding(["cv", "about"], { modifiers: certain("edge-case") }),
    );
    expect(crit.lastHit).toMatchObject({ crit: true });
    expect(crit.combat.bugHp).toBe(100 - cardDamage("cv", 0) * 2);
    const twice = run(
      play("cv"),
      holding(["cv", "about"], { modifiers: certain("multithreading") }),
    );
    expect(twice.lastHit).toMatchObject({ extraHit: true });
    expect(twice.combat.bugHp).toBe(100 - cardDamage("cv", 0) * 2);
  });

  it("Coffee Break heals 25% of max HP; Scalability raises it", () => {
    const heal = run(
      [{ type: "PICK_MODIFIER", id: "coffee-break" }],
      offering(["coffee-break", "linter", "refactor"], { heroHp: 10 }),
    );
    expect(heal.combat.heroHp).toBe(10 + Math.round(HERO.maxHp * 0.25));
    const bigger = run(
      [{ type: "PICK_MODIFIER", id: "scalability" }],
      offering(["scalability", "linter", "refactor"], { heroHp: HERO.maxHp }),
    );
    expect(statsOf(bigger.combat).maxHp).toBe(HERO.maxHp + 10);
    expect(bigger.combat.heroHp).toBe(HERO.maxHp + 10);
  });

  it("Rubber Duck dodges, Linter hits the bug back", () => {
    const after = bossRound(
      holding(["cv"], {
        modifiers: { ...certain("rubber-duck"), linter: 1 },
      }),
    );
    expect(after.combat.heroHp).toBe(HERO.maxHp);
    expect(after.combat.bugHp).toBe(100 - 3);
    expect(after.lastHit).toMatchObject({ dodged: true, thorns: 3 });
  });

  it("thorns that finish the bug win the fight", () => {
    const after = bossRound(
      holding(["cv"], { bugHp: 2, heroHp: 1, modifiers: { linter: 1 } }),
    );
    expect(after.combat.outcome).toBe("won");
  });

  it("Unit Tests grant Block each turn; Pair Programming one more action", () => {
    const next = bossRound(
      holding(["cv"], {
        heroHp: HERO.maxHp,
        modifiers: { "unit-tests": 2, "pair-programming": 1 },
      }),
    );
    expect(next.combat.heroHp).toBe(HERO.maxHp - BOSS_ATTACK);
    expect(next.combat.block).toBe(6);
    expect(next.combat.actionsLeft).toBe(ACTIONS_PER_TURN + 1);
  });

  it("Garbage Collector heals part of the damage dealt", () => {
    const hit = run(
      play("cv"),
      holding(["cv", "about"], {
        heroHp: 20,
        modifiers: { "garbage-collector": 1 },
      }),
    );
    const damage = cardDamage("cv", 0);
    expect(hit.combat.heroHp).toBe(20 + Math.round(damage * 0.15));
    expect(hit.lastHit).toMatchObject({ healed: Math.round(damage * 0.15) });
  });
});
