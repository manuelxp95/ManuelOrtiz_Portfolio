import { describe, expect, it } from "vitest";
import {
  cardReducer,
  initialCardState,
  type CardState,
} from "@/features/rogue/card-machine";

const expanded = (card: "skills" | "projects"): CardState => ({
  status: "expanded",
  card,
});

describe("cardReducer", () => {
  it("opens a card from idle", () => {
    expect(
      cardReducer(initialCardState, { type: "OPEN", card: "skills" }),
    ).toEqual(expanded("skills"));
  });

  it("switches the open card when another opens (active section changed)", () => {
    expect(
      cardReducer(expanded("skills"), { type: "OPEN", card: "projects" }),
    ).toEqual(expanded("projects"));
  });

  it("keeps the same state object when the open card opens again", () => {
    const state = expanded("skills");
    expect(cardReducer(state, { type: "OPEN", card: "skills" })).toBe(state);
  });

  it("closes through an animated closing phase", () => {
    const closing = cardReducer(expanded("skills"), {
      type: "CLOSE",
      reducedMotion: false,
    });
    expect(closing).toEqual({ status: "closing", card: "skills" });
    expect(cardReducer(closing, { type: "CLOSED" })).toEqual(initialCardState);
  });

  it("closes immediately under reduced motion", () => {
    expect(
      cardReducer(expanded("skills"), { type: "CLOSE", reducedMotion: true }),
    ).toEqual(initialCardState);
  });

  it("reopens a card interrupted mid-close", () => {
    const closing: CardState = { status: "closing", card: "skills" };
    expect(cardReducer(closing, { type: "OPEN", card: "projects" })).toEqual(
      expanded("projects"),
    );
  });

  it("ignores CLOSE when nothing is open and CLOSED when not closing", () => {
    expect(
      cardReducer(initialCardState, { type: "CLOSE", reducedMotion: false }),
    ).toBe(initialCardState);
    const state = expanded("skills");
    expect(cardReducer(state, { type: "CLOSED" })).toBe(state);
  });
});
