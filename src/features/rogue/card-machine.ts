import type { CardId } from "./cards";

/**
 * Card Mode board state (docs/architecture.md → Card interaction states).
 * - hovered/focused: pure CSS pseudo-states (:hover, :focus-visible); no state needed.
 * - inspecting: a touch tap lifted the card out of the fanned hand so it can be read; a second tap
 *   (or a swipe up, or a tap on the battlefield) plays it. Mouse and keyboard play at once.
 * - selected: derived — the section card matching `activeSection` in the store.
 * - playing: the played card's effect runs on the battlefield (P9.1); it ends in the dialog, and
 *   any tap, Enter or Escape skips it. Reduced motion skips it entirely.
 * - expanded / closing: the open card. "restoring" is the focus return that happens on reaching idle.
 * - dragging / drop candidate (`dragging` with `overZone`): the desktop drag enhancement (P6). Drag
 *   is never required: every card also plays by click, keyboard and tap.
 */
export type CardState =
  | { status: "idle" }
  | { status: "inspecting"; card: CardId }
  | { status: "dragging"; card: CardId; overZone: boolean }
  | { status: "playing"; card: CardId }
  | { status: "expanded"; card: CardId }
  | { status: "closing"; card: CardId };

export type CardEvent =
  /** Touch tap on a card that isn't lifted yet. */
  | { type: "INSPECT"; card: CardId }
  /** Tap outside the hand: the lifted card drops back. */
  | { type: "RELEASE" }
  /** Click, Enter/Space, second tap, swipe up, or a tap on the battlefield while inspecting. */
  | { type: "PLAY"; card: CardId; reducedMotion: boolean }
  /** The effect finished (or was skipped). */
  | { type: "EFFECT_DONE" }
  /** A direct hash load, or the active section changing while open: no effect. */
  | { type: "OPEN"; card: CardId }
  /** Close button, Escape, backdrop click. Reduced motion skips the closing animation. */
  | { type: "CLOSE"; reducedMotion: boolean }
  /** Closing animation finished (or timed out). */
  | { type: "CLOSED" }
  /** dnd-kit activated a drag (pointer moved past the activation distance). */
  | { type: "DRAG_START"; card: CardId }
  /** The dragged card entered or left the battlefield. */
  | { type: "DRAG_OVER"; overZone: boolean }
  /** Released: over the battlefield the card plays, anywhere else it returns to the hand. */
  | { type: "DROP"; reducedMotion: boolean }
  /** Escape, window resize, hidden tab or a browser-cancelled pointer: back to the hand. */
  | { type: "DRAG_CANCEL" };

export const initialCardState: CardState = { status: "idle" };

/** The card whose effect runs, or the open card when motion is reduced. */
function play(card: CardId, reducedMotion: boolean): CardState {
  return reducedMotion
    ? { status: "expanded", card }
    : { status: "playing", card };
}

export function cardReducer(state: CardState, event: CardEvent): CardState {
  switch (event.type) {
    case "INSPECT":
      if (state.status !== "idle" && state.status !== "inspecting")
        return state;
      if (state.status === "inspecting" && state.card === event.card)
        return state;
      return { status: "inspecting", card: event.card };
    case "RELEASE":
      return state.status === "inspecting" ? initialCardState : state;
    case "PLAY":
      if (state.status !== "idle" && state.status !== "inspecting")
        return state;
      return play(event.card, event.reducedMotion);
    case "EFFECT_DONE":
      return state.status === "playing"
        ? { status: "expanded", card: state.card }
        : state;
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
      if (state.status !== "idle" && state.status !== "inspecting")
        return state;
      return { status: "dragging", card: event.card, overZone: false };
    case "DRAG_OVER":
      if (state.status !== "dragging" || state.overZone === event.overZone)
        return state;
      return { ...state, overZone: event.overZone };
    case "DROP":
      if (state.status !== "dragging") return state;
      return state.overZone
        ? play(state.card, event.reducedMotion)
        : initialCardState;
    case "DRAG_CANCEL":
      return state.status === "dragging" ? initialCardState : state;
  }
}
