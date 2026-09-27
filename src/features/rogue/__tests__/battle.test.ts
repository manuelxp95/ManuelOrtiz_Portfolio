import { describe, expect, it } from "vitest";
import { contactLinks, education, experience, skills } from "@/content";
import { SECTION_IDS, type SectionId } from "@/domain/types";
import {
  BUG,
  boardReducer,
  bugHp,
  cardActions,
  heroStatuses,
  initialBoardState,
  type BoardState,
} from "@/features/rogue/battle";
import type { CardEvent } from "@/features/rogue/card-machine";

const run = (events: CardEvent[], from: BoardState = initialBoardState) =>
  events.reduce(boardReducer, from);
const play = (card: SectionId): CardEvent[] => [
  { type: "PLAY", card, reducedMotion: false },
  { type: "EFFECT_DONE" },
  { type: "CLOSE", reducedMotion: true },
];
const attacks = SECTION_IDS.filter((id) => cardActions[id].type === "attack");

describe("battle data", () => {
  it("attack cards hit the bug and together deal exactly its HP", () => {
    const total = attacks.reduce(
      (sum, id) => sum + (cardActions[id].damage ?? 0),
      0,
    );
    expect(total).toBe(BUG.maxHp);
    for (const id of attacks) expect(cardActions[id].target).toBe("bug");
  });

  it("skill and power cards act on the hero with a status and no damage", () => {
    for (const id of SECTION_IDS.filter((id) => !attacks.includes(id))) {
      expect(cardActions[id].target).toBe("hero");
      expect(cardActions[id].status).toBeTruthy();
      expect(cardActions[id].damage).toBeUndefined();
    }
  });

  it("every effect is drawn from the content", () => {
    for (const id of SECTION_IDS) {
      expect(cardActions[id].tokens.length).toBeGreaterThan(0);
      expect(cardActions[id].verb.trim()).not.toBe("");
    }
    expect(cardActions.experience.tokens).toHaveLength(experience.length);
    expect(skills.map((skill) => skill.name)).toEqual(
      expect.arrayContaining(cardActions.skills.tokens),
    );
    expect(cardActions.education.status).toBe(`Block ${education.length}`);
    expect(cardActions.contact.status).toBe(`Gold ${contactLinks.length}`);
  });
});

describe("boardReducer", () => {
  it("an attack lands once: hit on PLAY, none when its effect ends", () => {
    const playing = run([
      { type: "PLAY", card: "experience", reducedMotion: false },
    ]);
    expect(playing.played).toEqual(["experience"]);
    expect(playing.lastHit).toEqual({
      card: "experience",
      damage: 40,
      count: 1,
    });
    const open = run([{ type: "EFFECT_DONE" }], playing);
    expect(open.card).toEqual({ status: "expanded", card: "experience" });
    expect(open.lastHit).toBe(playing.lastHit);
  });

  it("a hero card lands without damage and grants its status", () => {
    const state = run(play("education"));
    expect(state.lastHit?.damage).toBe(0);
    expect(bugHp(state.played)).toBe(BUG.maxHp);
    expect(heroStatuses(state.played)).toEqual([`Block ${education.length}`]);
  });

  it("replaying an attack replays its effect without damage", () => {
    const again = run([...play("projects"), ...play("projects")]);
    expect(again.played).toEqual(["projects"]);
    expect(again.lastHit).toEqual({ card: "projects", damage: 0, count: 2 });
    expect(bugHp(again.played)).toBe(BUG.maxHp - 40);
  });

  it("a direct open (deep link) counts as played", () => {
    const opened = run([{ type: "OPEN", card: "cv" }]);
    expect(opened.played).toEqual(["cv"]);
    expect(opened.lastHit?.damage).toBe(cardActions.cv.damage);
  });

  it("playing the three attacks defeats the bug", () => {
    const done = run(attacks.flatMap(play));
    expect(bugHp(done.played)).toBe(0);
    expect(done.card).toEqual({ status: "idle" });
  });

  it("unchanged machine state returns the same board", () => {
    expect(run([{ type: "EFFECT_DONE" }])).toBe(initialBoardState);
  });
});
