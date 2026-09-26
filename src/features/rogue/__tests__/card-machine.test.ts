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

  describe("drag enhancement", () => {
    const dragging = (overZone: boolean): CardState => ({
      status: "dragging",
      card: "projects",
      overZone,
    });

    it("starts dragging only from idle", () => {
      expect(
        cardReducer(initialCardState, { type: "DRAG_START", card: "projects" }),
      ).toEqual(dragging(false));
      const open = expanded("skills");
      expect(cardReducer(open, { type: "DRAG_START", card: "projects" })).toBe(
        open,
      );
    });

    it("becomes a drop candidate over the play zone and back", () => {
      const over = cardReducer(dragging(false), {
        type: "DRAG_OVER",
        overZone: true,
      });
      expect(over).toEqual(dragging(true));
      expect(cardReducer(over, { type: "DRAG_OVER", overZone: false })).toEqual(
        dragging(false),
      );
      expect(cardReducer(over, { type: "DRAG_OVER", overZone: true })).toBe(
        over,
      );
    });

    it("dropping on the play zone opens the card; elsewhere returns it", () => {
      expect(cardReducer(dragging(true), { type: "DROP" })).toEqual(
        expanded("projects"),
      );
      expect(cardReducer(dragging(false), { type: "DROP" })).toEqual(
        initialCardState,
      );
    });

    it("cancelling (Escape, resize, hidden tab, pointer cancel) returns the card", () => {
      expect(cardReducer(dragging(true), { type: "DRAG_CANCEL" })).toEqual(
        initialCardState,
      );
    });

    it("ignores open/close requests mid-drag and drag events when not dragging", () => {
      const state = dragging(false);
      expect(cardReducer(state, { type: "OPEN", card: "skills" })).toBe(state);
      expect(cardReducer(state, { type: "CLOSE", reducedMotion: false })).toBe(
        state,
      );
      expect(cardReducer(initialCardState, { type: "DROP" })).toBe(
        initialCardState,
      );
      expect(cardReducer(initialCardState, { type: "DRAG_CANCEL" })).toBe(
        initialCardState,
      );
    });
  });
});
