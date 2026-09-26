import type { SectionId } from "@/domain/types";

/**
 * Card Mode board state (docs/architecture.md → Card interaction states).
 * - hovered/focused: pure CSS pseudo-states (:hover, :focus-visible); no state needed.
 * - selected: derived — the card matching `activeSection` in the store.
 * - expanded / closing: the open card. "restoring" is the focus return that happens on reaching idle.
 * - dragging / drop candidate (`dragging` with `overZone`): the desktop drag enhancement (P6). Drag
 *   is never required: every card also opens by click, keyboard and tap.
 */
export type CardState =
  | { status: "idle" }
  | { status: "dragging"; card: SectionId; overZone: boolean }
  | { status: "expanded"; card: SectionId }
  | { status: "closing"; card: SectionId };

export type CardEvent =
  /** Click/Enter/Space on a card, a direct hash load, or the active section changing while open. */
  | { type: "OPEN"; card: SectionId }
  /** Close button, Escape, backdrop click. Reduced motion skips the closing animation. */
  | { type: "CLOSE"; reducedMotion: boolean }
  /** Closing animation finished (or timed out). */
  | { type: "CLOSED" }
  /** dnd-kit activated a drag (pointer moved past the activation distance). */
  | { type: "DRAG_START"; card: SectionId }
  /** The dragged card entered or left the play zone. */
  | { type: "DRAG_OVER"; overZone: boolean }
  /** Released: over the play zone the card opens, anywhere else it returns to the hand. */
  | { type: "DROP" }
  /** Escape, window resize, hidden tab or a browser-cancelled pointer: back to the hand. */
  | { type: "DRAG_CANCEL" };

export const initialCardState: CardState = { status: "idle" };

export function cardReducer(state: CardState, event: CardEvent): CardState {
  switch (event.type) {
    case "OPEN":
      if (state.status === "dragging") return state;
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
    case "DRAG_START":
      if (state.status !== "idle") return state;
      return { status: "dragging", card: event.card, overZone: false };
    case "DRAG_OVER":
      if (state.status !== "dragging" || state.overZone === event.overZone)
        return state;
      return { ...state, overZone: event.overZone };
    case "DROP":
      if (state.status !== "dragging") return state;
      return state.overZone
        ? { status: "expanded", card: state.card }
        : initialCardState;
    case "DRAG_CANCEL":
      return state.status === "dragging" ? initialCardState : state;
  }
}
