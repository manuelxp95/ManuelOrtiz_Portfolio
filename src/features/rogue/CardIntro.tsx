import { BUG, HERO } from "./battle";

/**
 * Card Mode's intro (Roadmap P9.13, ADR-018), on one clock that rogue.css shares: a bug alert
 * with its alarm (0–1.2 s), the alert bursting open (to 1.6 s), then the bug, the hero, the deck,
 * the first hand dealt from it, and last the HP bars and statuses. Played on the first visit on a
 * device and after "Restart"; a press anywhere, Escape or "Skip intro" ends it at once.
 */
export const ALERT_MS = 1600;
export const ALARM_AT_MS = 150;
/** The opening hand starts flying from the deck here. */
export const INTRO_DEAL_S = 2.6;
export const INTRO_MS = 3900;

export type IntroPhase = "alert" | "assemble";

interface CardIntroProps {
  phase: IntroPhase;
  onSkip: () => void;
}

export function CardIntro({ phase, onSkip }: CardIntroProps) {
  return (
    <>
      {phase === "alert" && (
        <div className="bug-alert">
          <div role="alert" className="bug-alert-box font-mono">
            <p className="bug-alert-title">⚠ BUG DETECTED ⚠</p>
            <p>&gt; {BUG.name} breached production_</p>
            <p>&gt; deploying {HERO.name} to debug it_</p>
          </div>
        </div>
      )}
      <button type="button" className="intro-skip font-mono" onClick={onSkip}>
        Skip intro
      </button>
    </>
  );
}
