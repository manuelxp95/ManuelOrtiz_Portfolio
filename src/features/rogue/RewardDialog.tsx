import { useEffect, useRef, type CSSProperties } from "react";
import { modifier, type ModifierId, type Stacks } from "./modifiers";

interface RewardDialogProps {
  /** The modifiers on offer; null closes the dialog. */
  offer: ModifierId[] | null;
  held: Stacks;
  onPick: (id: ModifierId) => void;
  onSkip: () => void;
}

/**
 * The upgrade pick (Roadmap P9.7) as a native modal <dialog>: the fight is paused while it is open.
 * The offers are cards floating at the top of the screen that rise one after another from below
 * it. Every offer is a button; Escape or "Skip" declines, so the pause never traps the visitor.
 */
export function RewardDialog({
  offer,
  held,
  onPick,
  onSkip,
}: RewardDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const open = offer !== null;

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (!open) {
      if (element.open) element.close();
    } else if (!element.open) {
      element.showModal();
    }
  }, [open]);

  return (
    <dialog
      ref={dialog}
      aria-labelledby="reward-title"
      aria-describedby="reward-hint"
      className="reward-dialog"
      onCancel={(event) => {
        event.preventDefault();
        onSkip();
      }}
    >
      {offer && (
        <div className="reward-body">
          <h2 id="reward-title" className="text-xl font-semibold">
            Choose an upgrade
          </h2>
          <p id="reward-hint" className="font-mono text-xs text-muted">
            &gt; it stacks for the rest of the fight_
          </p>
          <ul className="reward-offers">
            {offer.map((id, index) => {
              const { name, glyph, text, rarity } = modifier(id);
              const stacks = held[id] ?? 0;
              return (
                <li
                  key={id}
                  className="reward-slot"
                  style={{ "--rise-index": index } as CSSProperties}
                >
                  <button
                    type="button"
                    className="reward-card"
                    data-rarity={rarity}
                    onClick={() => onPick(id)}
                  >
                    <span className="reward-rarity">{rarity}</span>
                    <span aria-hidden="true" className="reward-glyph">
                      {glyph}
                    </span>
                    <span className="reward-name">{name}</span>
                    <span className="reward-text">{text}</span>
                    {stacks > 0 && (
                      <span className="reward-held">held ×{stacks}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
          <button type="button" className="reward-skip" onClick={onSkip}>
            Skip
          </button>
        </div>
      )}
    </dialog>
  );
}
