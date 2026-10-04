import { describe, expect, it } from "vitest";
import {
  boardReducer,
  createBoardState,
  initialCombat,
} from "@/features/rogue/battle";
import { restoreBoard } from "@/features/rogue/board-storage";
import { initialCardState } from "@/features/rogue/card-machine";
import { goldenOf } from "@/features/rogue/cards";

/** What saveBoard writes, minus the storage. */
const saved = (seed = 7) => {
  const { deck, hand, played, combat } = createBoardState(seed);
  return JSON.parse(
    JSON.stringify({ v: 1, deck, hand, played, combat, seed }),
  ) as Record<string, unknown>;
};

describe("saved game (P9.13)", () => {
  it("restores the game as an idle board with no hit to replay", () => {
    const game = saved();
    const board = restoreBoard(game);
    expect(board).not.toBeNull();
    expect(board!.hand).toEqual(game.hand);
    expect(board!.deck).toEqual(game.deck);
    expect(board!.combat).toEqual(initialCombat);
    expect(board!.card).toBe(initialCardState);
    expect(board!.lastHit).toBeNull();
  });

  it("keeps golden copies of known cards", () => {
    const game = saved();
    const deck = game.deck as string[];
    game.deck = [...deck, goldenOf("about")];
    expect(restoreBoard(game)).not.toBeNull();
  });

  it.each<[string, (game: Record<string, unknown>) => void]>([
    ["another version", (game) => (game.v = 0)],
    [
      "a card the content no longer has",
      (game) => (game.deck = [...(game.deck as string[]), "project:gone"]),
    ],
    [
      "a missing card",
      (game) => (game.deck = (game.deck as string[]).slice(1)),
    ],
    [
      "a duplicated card",
      (game) => (game.deck = [...(game.deck as string[]), "about"]),
    ],
    ["an unknown section read", (game) => (game.played = ["blog"])],
    [
      "a combat field of the wrong type",
      (game) => (game.combat = { ...initialCombat, heroHp: "50" }),
    ],
    [
      "an unknown modifier",
      (game) => (game.combat = { ...initialCombat, modifiers: { nope: 1 } }),
    ],
    ["no seed", (game) => delete game.seed],
  ])("drops a game with %s", (_, spoil) => {
    const game = saved();
    spoil(game);
    expect(restoreBoard(game)).toBeNull();
  });

  it.each([null, "x", [], 42])("drops %j", (value) => {
    expect(restoreBoard(value)).toBeNull();
  });

  it("NEW_GAME deals afresh: full HP, no read sections", () => {
    const played = boardReducer(createBoardState(3), {
      type: "OPEN",
      card: "about",
    });
    expect(played.played).toEqual(["about"]);
    const fresh = boardReducer(played, { type: "NEW_GAME" });
    expect(fresh.played).toEqual([]);
    expect(fresh.combat).toEqual(initialCombat);
    expect(fresh.card).toBe(initialCardState);
  });
});
