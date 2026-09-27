import { describe, expect, it } from "vitest";
import { experience, skills } from "@/content";
import { SECTION_IDS } from "@/domain/types";
import {
  BUG,
  boardReducer,
  bugHp,
  cardDamage,
  cardEffects,
  initialBoardState,
  type BoardState,
} from "@/features/rogue/battle";
import type { CardEvent } from "@/features/rogue/card-machine";

const run = (events: CardEvent[], from: BoardState = initialBoardState) =>
  events.reduce(boardReducer, from);
const play = (card: (typeof SECTION_IDS)[number]): CardEvent[] => [
  { type: "PLAY", card, reducedMotion: false },
  { type: "EFFECT_DONE" },
  { type: "CLOSE", reducedMotion: true },
];

describe("battle data", () => {
  it("the seven cards together deal exactly the bug's HP", () => {
    const total = SECTION_IDS.reduce((sum, id) => sum + cardDamage[id], 0);
    expect(total).toBe(BUG.maxHp);
  });

  it("every card has an effect with tokens drawn from the content", () => {
    for (const id of SECTION_IDS) {
      expect(cardEffects[id].tokens.length).toBeGreaterThan(0);
      expect(cardEffects[id].verb.trim()).not.toBe("");
    }
    expect(cardEffects.experience.tokens).toHaveLength(experience.length);
    expect(skills.map((skill) => skill.name)).toEqual(
      expect.arrayContaining(cardEffects.skills.tokens),
    );
  });
});

describe("boardReducer", () => {
  it("a played card lands once: hit on PLAY, none when its effect ends", () => {
    const playing = run([
      { type: "PLAY", card: "skills", reducedMotion: false },
    ]);
    expect(playing.played).toEqual(["skills"]);
    expect(playing.lastHit).toEqual({ card: "skills", damage: 20, count: 1 });
    const open = run([{ type: "EFFECT_DONE" }], playing);
    expect(open.card).toEqual({ status: "expanded", card: "skills" });
    expect(open.lastHit).toBe(playing.lastHit);
  });

  it("replaying a card replays its effect without damage", () => {
    const again = run([...play("skills"), ...play("skills")]);
    expect(again.played).toEqual(["skills"]);
    expect(again.lastHit).toEqual({ card: "skills", damage: 0, count: 2 });
    expect(bugHp(again.played)).toBe(BUG.maxHp - cardDamage.skills);
  });

  it("a direct open (deep link) counts as played", () => {
    const opened = run([{ type: "OPEN", card: "cv" }]);
    expect(opened.played).toEqual(["cv"]);
    expect(opened.lastHit?.damage).toBe(cardDamage.cv);
  });

  it("playing every card defeats the bug", () => {
    const done = run(SECTION_IDS.flatMap(play));
    expect(bugHp(done.played)).toBe(0);
    expect(done.card).toEqual({ status: "idle" });
  });

  it("unchanged machine state returns the same board", () => {
    expect(run([{ type: "EFFECT_DONE" }])).toBe(initialBoardState);
  });
});
