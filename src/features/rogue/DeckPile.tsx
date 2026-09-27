import { m, useAnimateMini } from "motion/react";
import { useLayoutEffect, useRef, type ReactNode, type Ref } from "react";
import { useReducedMotion } from "./use-reduced-motion";

interface DeckPileProps {
  count: number;
  ref: Ref<HTMLDivElement>;
}

/**
 * The deck, beside the hand (Roadmap P9.5): a pile of card backs with its size. It settles with a
 * small pulse whenever its size changes (a card drawn, a card shuffled back in).
 */
export function DeckPile({ count, ref }: DeckPileProps) {
  return (
    <div
      ref={ref}
      className="deck-pile"
      role="img"
      aria-label={`Deck: ${count} cards`}
    >
      <span aria-hidden="true" className="deck-back" data-depth="2" />
      <span aria-hidden="true" className="deck-back" data-depth="1" />
      <m.span
        key={count}
        aria-hidden="true"
        className="deck-back"
        data-depth="0"
        initial={{ scale: 1.06 }}
        animate={{ scale: 1 }}
      >
        <span className="deck-count">{count}</span>
      </m.span>
    </div>
  );
}

/** How a card travels from the deck into its slot in the hand. */
const DRAW_MS = 450;

interface DrawnCardProps {
  /** Where the deck sits, measured when this card arrives. */
  pile: () => DOMRect | undefined;
  /** Seconds to wait: the opening hand is dealt one card after another. */
  delay: number;
  children: ReactNode;
}

/**
 * A card arriving in the hand flies from the deck to its slot, turning and growing into place,
 * while the other cards slide over to make room (their slots animate their layout). WAAPI through
 * Motion's mini animate: transform and opacity only. Reduced motion: the card is simply there.
 */
export function DrawnCard({ pile, delay, children }: DrawnCardProps) {
  const reducedMotion = useReducedMotion();
  const [, animate] = useAnimateMini();
  const box = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const element = box.current;
    const from = pile();
    // No Web Animations API (old browsers, test environments): the card is simply placed.
    if (reducedMotion || !element || !from || !("animate" in element)) return;
    const to = element.getBoundingClientRect();
    const dx = from.left + from.width / 2 - (to.left + to.width / 2);
    const dy = from.top + from.height / 2 - (to.top + to.height / 2);
    // Hidden until its (possibly delayed) flight starts; whatever happens, it ends up visible.
    element.style.opacity = "0";
    const reveal = () => {
      element.style.opacity = "";
      element.style.transform = "";
    };
    const controls = animate(
      element,
      {
        transform: [
          `translate(${dx}px, ${dy}px) rotate(-14deg) scale(0.6)`,
          "none",
        ],
        opacity: [0, 1],
      },
      { duration: DRAW_MS / 1000, delay, ease: [0.22, 1, 0.36, 1] },
    );
    controls.then(reveal, reveal);
    return () => {
      controls.stop();
      reveal();
    };
    // Arrival only: a card animates once, when it enters the hand.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={box}>{children}</div>;
}
