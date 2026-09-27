import { describe, expect, it } from "vitest";
import { contactLinks, education, experience, projects } from "@/content";
import { SECTION_IDS, type SectionId } from "@/domain/types";
import {
  ACTIONS_PER_TURN,
  BOSS_ATTACK,
  BOSS_HEAL,
  BOSS_PATTERN,
  BUG,
  HERO,
  boardReducer,
  bossIntent,
  cardActions,
  cardDamage,
  initialBoardState,
  initialCombat,
  type BoardEvent,
  type BoardState,
} from "@/features/rogue/battle";

const run = (events: BoardEvent[], from: BoardState = initialBoardState) =>
  events.reduce(boardReducer, from);
/** Play a card from the hand and close its dialog. */
const play = (card: SectionId): BoardEvent[] => [
  { type: "PLAY", card, reducedMotion: false },
  { type: "EFFECT_DONE" },
  { type: "CLOSE", reducedMotion: true },
];
const bossTurn: BoardEvent[] = [{ type: "BOSS_ACT" }, { type: "BOSS_DONE" }];
const withCombat = (combat: Partial<BoardState["combat"]>): BoardState => ({
  ...initialBoardState,
  combat: { ...initialCombat, ...combat },
});

describe("card actions", () => {
  it("attacks hit the bug; skills and powers act on the hero", () => {
    for (const id of SECTION_IDS) {
      const action = cardActions[id];
      expect(action.target).toBe(action.type === "attack" ? "bug" : "hero");
      expect(!!action.attack).toBe(action.type === "attack");
      expect(action.tokens.length).toBeGreaterThan(0);
    }
  });

  it("draws its numbers from the content, and Strength adds to every hit", () => {
    expect(cardDamage("experience", 0)).toBe(experience.length * 4);
    expect(cardDamage("experience", 2)).toBe(experience.length * 6);
    expect(cardDamage("projects", 0)).toBe(projects.length * 2);
    expect(cardDamage("education", 5)).toBe(0);
    expect(cardActions.education.block).toBe(education.length);
    expect(cardActions.contact.heal).toBe(contactLinks.length * 3);
  });
});

describe("turns", () => {
  it(`the bug's turn comes after ${ACTIONS_PER_TURN} cards played from the hand`, () => {
    const one = run(play("experience"));
    expect(one.combat.actionsLeft).toBe(ACTIONS_PER_TURN - 1);
    expect(one.combat.boss).toBe("waiting");
    const two = run(play("cv"), one);
    expect(two.combat.boss).toBe("pending");

    const acted = run([{ type: "BOSS_ACT" }], two);
    expect(acted.combat.boss).toBe("acting");
    expect(acted.combat.heroHp).toBe(HERO.maxHp - BOSS_ATTACK);
    const next = run([{ type: "BOSS_DONE" }], acted);
    expect(next.combat).toMatchObject({
      boss: "waiting",
      turn: 2,
      actionsLeft: ACTIONS_PER_TURN,
    });
  });

  it("the bug follows its announced pattern: attack, charge, double attack, heal", () => {
    expect(BOSS_PATTERN).toEqual(["attack", "charge", "attack", "heal"]);
    let state = withCombat({ bugHp: 50 });
    const moves: string[] = [];
    for (let turn = 0; turn < 4; turn++) {
      const intent = bossIntent(state.combat);
      state = run([...play("skills"), ...play("skills")], state);
      state = run([{ type: "BOSS_ACT" }], state);
      const hit = state.lastHit!;
      expect(hit.by).toBe("bug");
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
    expect(state.combat.bugHp).toBe(50 + BOSS_HEAL);
  });

  it("Block absorbs an attack, Dodge avoids one, a potion heals", () => {
    const blocked = run(
      [...play("education"), ...play("contact"), ...bossTurn],
      withCombat({ heroHp: 40 }),
    );
    const blockedBy = Math.min(education.length, BOSS_ATTACK);
    expect(blocked.combat.heroHp).toBe(
      Math.min(HERO.maxHp, 40 + contactLinks.length * 3) -
        (BOSS_ATTACK - blockedBy),
    );
    expect(blocked.combat.block).toBe(education.length - blockedBy);

    const dodged = run([...play("about"), ...play("skills"), ...bossTurn]);
    expect(dodged.combat.heroHp).toBe(HERO.maxHp);
    expect(dodged.combat.dodge).toBe(false);
    expect(dodged.lastHit).toMatchObject({ by: "bug", dodged: true });
  });

  it("direct opens (URL hash, back/forward) never touch the fight", () => {
    const opened = run([{ type: "OPEN", card: "projects" }]);
    expect(opened.played).toEqual(["projects"]);
    expect(opened.combat).toBe(initialCombat);
    expect(opened.lastHit).toBeNull();
  });

  it("an effect ending does not count a second time", () => {
    const playing = run([
      { type: "PLAY", card: "experience", reducedMotion: false },
    ]);
    expect(run([{ type: "EFFECT_DONE" }], playing).combat).toBe(playing.combat);
  });
});

describe("outcome", () => {
  it("bringing the bug to 0 wins, and the bug stops acting", () => {
    const won = run(play("projects"), withCombat({ bugHp: 5, actionsLeft: 1 }));
    expect(won.combat).toMatchObject({ bugHp: 0, outcome: "won" });
    expect(won.combat.boss).toBe("waiting");
    expect(run([{ type: "BOSS_ACT" }], won)).toBe(won);
  });

  it("the hero at 0 loses; cards still open but no longer fight", () => {
    const lost = run(
      bossTurn,
      withCombat({ heroHp: 3, actionsLeft: 0, boss: "pending" }),
    );
    expect(lost.combat).toMatchObject({ heroHp: 0, outcome: "lost" });
    const after = run(play("cv"), run([{ type: "BOSS_DONE" }], lost));
    expect(after.card).toEqual({ status: "idle" });
    expect(after.combat.bugHp).toBe(BUG.maxHp);
  });

  it("Play again resets the fight, not what has been read", () => {
    const state = run(play("experience"));
    const reset = run([{ type: "RESET_BATTLE" }], state);
    expect(reset.combat).toBe(initialCombat);
    expect(reset.played).toEqual(["experience"]);
  });
});
