import type { Announcements } from "@dnd-kit/core";
import { BATTLEFIELD_ID } from "../Battlefield";
import { cardFace, type CardId } from "../cards";

/** Pointer must travel this far before a press becomes a drag, so plain clicks still open cards. */
export const DRAG_ACTIVATION_DISTANCE = 8;

const cardName = (id: string | number) => cardFace(id as CardId).title;

/** dnd-kit live-region messages for the mouse drag enhancement. */
export const dragAnnouncements: Announcements = {
  onDragStart: ({ active }) => `Picked up the ${cardName(active.id)} card.`,
  onDragOver: ({ active, over }) =>
    over?.id === BATTLEFIELD_ID
      ? `${cardName(active.id)} is over the bug. Release to play it.`
      : `${cardName(active.id)} is away from the bug.`,
  onDragEnd: ({ active, over }) =>
    over?.id === BATTLEFIELD_ID
      ? `Played the ${cardName(active.id)} card.`
      : `Returned the ${cardName(active.id)} card to the hand.`,
  onDragCancel: ({ active }) =>
    `Cancelled. Returned the ${cardName(active.id)} card to the hand.`,
};
