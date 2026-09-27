import {
  domMax,
  LazyMotion,
  MotionConfig,
  type Transition,
} from "motion/react";
import type { ReactNode } from "react";
import { useReducedMotion } from "./use-reduced-motion";

/**
 * Motion for Card Mode (ADR-006): only this chunk loads it. `strict` makes a stray full `motion.*`
 * component throw, so everything uses the tree-shakable `m.*`; `domMax` adds layout animations.
 * `reducedMotion="user"` drops transform and layout animations under prefers-reduced-motion and
 * keeps opacity; one-shot entrances also skip their initial state there (see `useEntrance`).
 */
export function CardMotion({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domMax} strict>
      <MotionConfig reducedMotion="user" transition={enter}>
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}

/** Entrances and reveals: ~220ms ease-out. */
export const enter: Transition = { duration: 0.22, ease: [0.22, 1, 0.36, 1] };

/** Siblings sliding to their new place when a detail opens or closes. */
export const layoutSpring: Transition = {
  type: "spring",
  stiffness: 520,
  damping: 40,
  mass: 0.8,
};

/**
 * Initial state of a one-shot entrance, or `false` (render in place) under reduced motion, so
 * nothing ever fades in when the user asked for less motion.
 */
export function useEntrance<Initial>(from: Initial): Initial | false {
  return useReducedMotion() ? false : from;
}

/** Delay of the `index`-th item of a one-shot staggered entrance. */
export function stagger(index: number, step = 0.035): Transition {
  return { ...enter, delay: index * step };
}
