import { useDndMonitor, type ClientRect } from "@dnd-kit/core";
import { useEffect, useState } from "react";
import type { CardId, Target } from "./cards";

interface Point {
  x: number;
  y: number;
}

interface Aim {
  /** What the arrow starts from: the dragged card, or the card lifted by a tap. */
  source: "drag" | CardId;
  from: Point;
  to: Point;
}

/** A lifted card settles after its CSS lift (var(--duration-fast)); measure once it has. */
const LIFT_SETTLE_MS = 180;

const topCenter = (rect: ClientRect | DOMRect): Point => ({
  x: rect.left + rect.width / 2,
  y: rect.top,
});

function targetCenter(target: Target): Point | null {
  const art = document.querySelector(
    `[data-combatant="${target}"] .combatant-art`,
  );
  if (!art) return null;
  const rect = art.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

interface TargetArrowProps {
  /** Who the aimed card acts on; null hides the arrow. */
  target: Target | null;
  /** The card lifted by a tap (touch aiming); dragging is followed through dnd-kit. */
  lifted: CardId | null;
  /** Looks up a card's element in the hand. */
  cardElement: (card: CardId) => HTMLElement | undefined;
  dragging: boolean;
}

/**
 * Targeting arrow (Roadmap P9.2): while a card is dragged over the battlefield or lifted by a tap,
 * a curve runs from the card to the combatant it will act on. Decorative: the card's accessible
 * name already states its target. Pointer moves re-render only this component.
 */
export function TargetArrow({
  target,
  lifted,
  cardElement,
  dragging,
}: TargetArrowProps) {
  const [aim, setAim] = useState<Aim | null>(null);

  useDndMonitor({
    onDragMove: ({ active }) => {
      const rect = active.rect.current.translated;
      const to = target && targetCenter(target);
      if (rect && to) setAim({ source: "drag", from: topCenter(rect), to });
    },
  });

  useEffect(() => {
    if (!lifted || !target) return;
    const measure = () => {
      const card = cardElement(lifted);
      const to = targetCenter(target);
      if (card && to)
        setAim({
          source: lifted,
          from: topCenter(card.getBoundingClientRect()),
          to,
        });
    };
    const timer = window.setTimeout(measure, LIFT_SETTLE_MS);
    window.addEventListener("resize", measure);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", measure);
    };
  }, [lifted, target, cardElement]);

  const current =
    target && aim && (aim.source === "drag" ? dragging : aim.source === lifted)
      ? aim
      : null;
  if (!current) return null;

  const { from, to } = current;
  const bend = Math.min(from.y, to.y) - 60;
  return (
    <svg aria-hidden="true" className="target-arrow" data-target={target}>
      <defs>
        <marker
          id="target-arrowhead"
          viewBox="0 0 10 10"
          refX="7"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L10,5 L0,10 z" fill="currentColor" />
        </marker>
      </defs>
      <path
        d={`M${from.x},${from.y} Q${(from.x + to.x) / 2},${bend} ${to.x},${to.y}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeDasharray="8 6"
        strokeLinecap="round"
        markerEnd="url(#target-arrowhead)"
      />
    </svg>
  );
}
