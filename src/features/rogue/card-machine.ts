import type { SectionId } from "@/domain/types";

/**
 * Card Mode board state (docs/architecture.md → Card interaction states).
 * - hovered/focused: pure CSS pseudo-states (:hover, :focus-visible); no state needed.
 * - selected: derived — the card matching `activeSection` in the store.
 * - expanded / closing: owned here. "restoring" is the focus return that happens on reaching idle.
 * - grabbed/dragging/drop candidate: reserved for the drag enhancement (Roadmap P6).
 */
export type CardState =
  | { status: "idle" }
  | { status: "expanded"; card: SectionId }
  | { status: "closing"; card: SectionId };

export type CardEvent =
  /** Click/Enter/Space on a card, a direct hash load, or the active section changing while open. */
  | { type: "OPEN"; card: SectionId }
  /** Close button, Escape, backdrop click. Reduced motion skips the closing animation. */
  | { type: "CLOSE"; reducedMotion: boolean }
  /** Closing animation finished (or timed out). */
  | { type: "CLOSED" };

export const initialCardState: CardState = { status: "idle" };

export function cardReducer(state: CardState, event: CardEvent): CardState {
  switch (event.type) {
    case "OPEN":
      if (state.status === "expanded" && state.card === event.card)
        return state;
      return { status: "expanded", card: event.card };
    case "CLOSE":
      if (state.status !== "expanded") return state;
      return event.reducedMotion
        ? initialCardState
        : { status: "closing", card: state.card };
    case "CLOSED":
      return state.status === "closing" ? initialCardState : state;
  }
}
