import { useDraggable } from "@dnd-kit/core";
import type { SectionMeta } from "@/domain/types";
import { cardGlyphs } from "./ascii/glyphs.generated";
import { buildCardFace } from "./card-face";

interface CardFaceProps {
  section: SectionMeta;
  stat: string;
  selected: boolean;
}

/** The decorative ASCII face, shared by the card in the hand and its drag overlay. */
export function CardFace({ section, stat, selected }: CardFaceProps) {
  return (
    <span aria-hidden="true" className="card-face">
      {buildCardFace({
        title: section.cardLabel,
        glyph: cardGlyphs[section.id],
        label: section.classicLabel,
        stat,
        selected,
      })}
    </span>
  );
}

interface SectionCardProps extends CardFaceProps {
  onOpen: () => void;
  ref: (element: HTMLButtonElement | null) => void;
}

/**
 * A real button: click, Enter, Space and tap all open the card. With a mouse it can also be
 * dragged into the play zone (P6 enhancement). Only the mouse listeners are wired — dnd-kit's
 * draggable ARIA attributes would rename the button, and drag is never the keyboard path.
 */
export function SectionCard({
  section,
  stat,
  selected,
  onOpen,
  ref,
}: SectionCardProps) {
  const { listeners, setNodeRef, isDragging } = useDraggable({
    id: section.id,
  });

  return (
    <button
      ref={(element) => {
        setNodeRef(element);
        ref(element);
      }}
      type="button"
      id={`card-${section.id}`}
      aria-current={selected ? "true" : undefined}
      aria-haspopup="dialog"
      onClick={onOpen}
      {...listeners}
      data-dragging={isDragging || undefined}
      className="section-card"
    >
      <span className="sr-only">
        {section.classicLabel} — {section.cardLabel}. {stat}.
      </span>
      <CardFace section={section} stat={stat} selected={selected} />
    </button>
  );
}
