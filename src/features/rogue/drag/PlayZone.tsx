import { useDroppable } from "@dnd-kit/core";

export const PLAY_ZONE_ID = "play-zone";

interface PlayZoneProps {
  dragging: boolean;
  candidate: boolean;
}

/**
 * Drop target for the desktop drag enhancement. Decorative for assistive tech (dnd-kit's live
 * region announces drag progress) and hidden on coarse pointers, where drag isn't offered.
 */
export function PlayZone({ dragging, candidate }: PlayZoneProps) {
  const { setNodeRef } = useDroppable({ id: PLAY_ZONE_ID });
  const label = candidate
    ? "[ release to open ]"
    : dragging
      ? "[ drop the card here ]"
      : "[ or drag a card here to play it ]";

  return (
    <div
      ref={setNodeRef}
      aria-hidden="true"
      data-dragging={dragging || undefined}
      data-candidate={candidate || undefined}
      className="play-zone"
    >
      {label}
    </div>
  );
}
