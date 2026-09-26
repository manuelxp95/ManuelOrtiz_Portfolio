import type { Announcements } from "@dnd-kit/core";
import { sections } from "@/domain/sections";
import { PLAY_ZONE_ID } from "./PlayZone";

/** Pointer must travel this far before a press becomes a drag, so plain clicks still open cards. */
export const DRAG_ACTIVATION_DISTANCE = 8;

const cardName = (id: string | number) =>
  sections.find((section) => section.id === id)?.cardLabel ?? String(id);

/** dnd-kit live-region messages for the mouse drag enhancement. */
export const dragAnnouncements: Announcements = {
  onDragStart: ({ active }) => `Picked up the ${cardName(active.id)} card.`,
  onDragOver: ({ active, over }) =>
    over?.id === PLAY_ZONE_ID
      ? `${cardName(active.id)} is over the play zone. Release to open it.`
      : `${cardName(active.id)} is outside the play zone.`,
  onDragEnd: ({ active, over }) =>
    over?.id === PLAY_ZONE_ID
      ? `Opened the ${cardName(active.id)} card.`
      : `Returned the ${cardName(active.id)} card to the hand.`,
  onDragCancel: ({ active }) =>
    `Cancelled. Returned the ${cardName(active.id)} card to the hand.`,
};
