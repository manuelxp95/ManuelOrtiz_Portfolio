import { useDraggable } from "@dnd-kit/core";
import { useRef, type PointerEvent } from "react";
import type { SectionMeta } from "@/domain/types";
import { cardGlyphs } from "./ascii/glyphs.generated";
import { buildCardFace } from "./card-face";

/** A touch that travels this far upwards before lifting plays the card (swipe up). */
const SWIPE_UP_PX = 40;

interface CardFaceProps {
  section: SectionMeta;
  stat: string;
  selected: boolean;
}

/** The decorative ASCII face, shared by the card in the hand, its drag overlay and its flight. */
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
  played: boolean;
  /** Click, Enter/Space or tap; `touch` is true for a finger tap. */
  onActivate: (touch: boolean) => void;
  /** A finger swiped the card up: play it straight away. */
  onSwipeUp: () => void;
  /** Hover or focus: a likely play, so its panel chunk can start loading. */
  onIntent: () => void;
  ref: (element: HTMLButtonElement | null) => void;
}

/**
 * A real button: click, Enter and Space play the card; a finger tap lifts it first (the fanned hand
 * overlaps on phones) and a second tap or a swipe up plays it. With a mouse it can also be dragged
 * onto the battlefield (P6). Only the mouse listeners are wired — dnd-kit's draggable ARIA
 * attributes would rename the button, and drag is never the keyboard path.
 */
export function SectionCard({
  section,
  stat,
  selected,
  played,
  onActivate,
  onSwipeUp,
  onIntent,
  ref,
}: SectionCardProps) {
  const { listeners, setNodeRef, isDragging } = useDraggable({
    id: section.id,
  });
  const press = useRef<{ touch: boolean; y: number } | null>(null);
  const swiped = useRef(false);

  function onPointerDown(event: PointerEvent<HTMLButtonElement>) {
    press.current = { touch: event.pointerType === "touch", y: event.clientY };
    swiped.current = false;
  }

  function onPointerUp(event: PointerEvent<HTMLButtonElement>) {
    const start = press.current;
    if (start?.touch && start.y - event.clientY > SWIPE_UP_PX) {
      swiped.current = true;
      onSwipeUp();
    }
  }

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
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onClick={(event) => {
        if (swiped.current) {
          swiped.current = false;
          return;
        }
        // Keyboard activation has no pointer (detail 0) and plays like a click.
        const touch = event.detail > 0 && press.current?.touch === true;
        press.current = null;
        onActivate(touch);
      }}
      onPointerEnter={onIntent}
      onFocus={onIntent}
      {...listeners}
      data-dragging={isDragging || undefined}
      className="section-card"
    >
      <span className="sr-only">
        {section.classicLabel} — {section.cardLabel}. {stat}.
        {played ? " Played." : ""}
      </span>
      <CardFace section={section} stat={stat} selected={selected} />
    </button>
  );
}
