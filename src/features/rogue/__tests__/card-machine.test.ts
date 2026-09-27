import { describe, expect, it } from "vitest";
import type { SectionId } from "@/domain/types";
import {
  cardReducer,
  initialCardState,
  type CardState,
} from "@/features/rogue/card-machine";

const expanded = (card: SectionId): CardState => ({
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

  describe("playing a card (P9.1)", () => {
    it("click or keyboard plays at once; the effect ends in the dialog", () => {
      const playing = cardReducer(initialCardState, {
        type: "PLAY",
        card: "skills",
        reducedMotion: false,
      });
      expect(playing).toEqual({ status: "playing", card: "skills" });
      expect(cardReducer(playing, { type: "EFFECT_DONE" })).toEqual(
        expanded("skills"),
      );
    });

    it("reduced motion skips the effect", () => {
      expect(
        cardReducer(initialCardState, {
          type: "PLAY",
          card: "skills",
          reducedMotion: true,
        }),
      ).toEqual(expanded("skills"));
    });

    it("a tap lifts a card, another card replaces it, and a tap outside drops it", () => {
      const lifted = cardReducer(initialCardState, {
        type: "INSPECT",
        card: "skills",
      });
      expect(lifted).toEqual({ status: "inspecting", card: "skills" });
      expect(cardReducer(lifted, { type: "INSPECT", card: "skills" })).toBe(
        lifted,
      );
      expect(
        cardReducer(lifted, { type: "INSPECT", card: "projects" }),
      ).toEqual({ status: "inspecting", card: "projects" });
      expect(cardReducer(lifted, { type: "RELEASE" })).toEqual(
        initialCardState,
      );
    });

    it("a lifted card plays and can still be dragged", () => {
      const lifted: CardState = { status: "inspecting", card: "skills" };
      expect(
        cardReducer(lifted, {
          type: "PLAY",
          card: "skills",
          reducedMotion: false,
        }),
      ).toEqual({ status: "playing", card: "skills" });
      expect(
        cardReducer(lifted, { type: "DRAG_START", card: "skills" }),
      ).toEqual({ status: "dragging", card: "skills", overZone: false });
    });

    it("ignores plays and lifts while a card is playing or open", () => {
      const playing: CardState = { status: "playing", card: "skills" };
      const open = expanded("projects");
      for (const state of [playing, open]) {
        expect(
          cardReducer(state, {
            type: "PLAY",
            card: "cv",
            reducedMotion: false,
          }),
        ).toBe(state);
        expect(cardReducer(state, { type: "INSPECT", card: "cv" })).toBe(state);
      }
      expect(cardReducer(open, { type: "EFFECT_DONE" })).toBe(open);
    });

    it("a direct open (hash, back/forward) interrupts an effect", () => {
      expect(
        cardReducer(
          { status: "playing", card: "skills" },
          { type: "OPEN", card: "cv" },
        ),
      ).toEqual(expanded("cv"));
    });
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

    it("becomes a drop candidate over the battlefield and back", () => {
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

    it("dropping on the battlefield plays the card; elsewhere returns it", () => {
      expect(
        cardReducer(dragging(true), { type: "DROP", reducedMotion: false }),
      ).toEqual({ status: "playing", card: "projects" });
      expect(
        cardReducer(dragging(true), { type: "DROP", reducedMotion: true }),
      ).toEqual(expanded("projects"));
      expect(
        cardReducer(dragging(false), { type: "DROP", reducedMotion: false }),
      ).toEqual(initialCardState);
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
      expect(
        cardReducer(initialCardState, { type: "DROP", reducedMotion: false }),
      ).toBe(initialCardState);
      expect(cardReducer(initialCardState, { type: "DRAG_CANCEL" })).toBe(
        initialCardState,
      );
    });
  });
});
