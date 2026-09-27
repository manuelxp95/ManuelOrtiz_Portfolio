import { useDraggable } from "@dnd-kit/core";
import { useRef, type PointerEvent } from "react";
import { cardGlyphs } from "./ascii/glyphs.generated";
import { BUG, HERO } from "./battle";
import { buildCardFace } from "./card-face";
import {
  baseOf,
  cardAction,
  cardElementId,
  cardFace,
  isGolden,
  isSectionCard,
  sectionOf,
  type CardId,
} from "./cards";

/** A touch that travels this far upwards before lifting plays the card (swipe up). */
const SWIPE_UP_PX = 40;

interface CardFaceProps {
  card: CardId;
  selected: boolean;
}

/** The decorative ASCII face, shared by the card in the hand, its drag overlay and its flight. */
export function CardFace({ card, selected }: CardFaceProps) {
  const face = cardFace(card);
  return (
    <span
      aria-hidden="true"
      className="card-face"
      data-golden={isGolden(card) || undefined}
    >
      {buildCardFace({
        title: face.title,
        glyph: cardGlyphs[face.glyph],
        label: face.label,
        stat: face.stat,
        selected,
        type: cardAction(card).type,
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
 * A card in the hand, as a real button: click, Enter and Space play it; a finger tap lifts it
 * first (the fanned hand overlaps on phones) and a second tap or a swipe up plays it. With a mouse
 * it can also be dragged onto the battlefield (P6). Only the mouse listeners are wired — dnd-kit's
 * draggable ARIA attributes would rename the button, and drag is never the keyboard path.
 */
export function SectionCard({
  card,
  selected,
  played,
  onActivate,
  onSwipeUp,
  onIntent,
  ref,
}: SectionCardProps) {
  const { listeners, setNodeRef, isDragging } = useDraggable({ id: card });
  const press = useRef<{ touch: boolean; y: number } | null>(null);
  const swiped = useRef(false);
  const face = cardFace(card);
  const action = cardAction(card);
  const aim =
    action.target === "bug" ? `hits ${BUG.name}` : `acts on ${HERO.name}`;
  const base = baseOf(card);
  const golden = isGolden(card) ? "Golden " : "";
  const kind = isSectionCard(base)
    ? `${golden}${face.label} — ${face.title}`
    : `${golden}${face.title} — ${base.startsWith("project:") ? "project" : "skill"} card, opens ${sectionOf(card)}`;

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
      id={cardElementId(card)}
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
        {kind}. {face.stat}. {action.type} card, {aim}.
        {played ? " Played." : ""}
      </span>
      <CardFace card={card} selected={selected} />
    </button>
  );
}
