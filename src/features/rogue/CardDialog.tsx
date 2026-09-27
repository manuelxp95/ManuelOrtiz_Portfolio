import { useEffect, useRef } from "react";
import { sections } from "@/domain/sections";
import { AsciiAnimation } from "./AsciiAnimation";
import type { CardState } from "./card-machine";
import { SectionPanel } from "./sections/SectionPanel";

const CLOSE_FALLBACK_MS = 300;

interface CardDialogProps {
  state: CardState;
  onClose: () => void;
  onClosed: () => void;
}

/**
 * Expanded card as a native modal <dialog>: the browser traps focus and makes the page inert;
 * Escape (cancel), the close button and a backdrop click all request CLOSE. The closing
 * animation ends in CLOSED; the board then restores focus to the card.
 */
export function CardDialog({ state, onClose, onClosed }: CardDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const open = state.status === "expanded" || state.status === "closing";
  const card = open ? state.card : null;
  const section = sections.find((meta) => meta.id === card);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (!open) {
      if (element.open) element.close();
    } else if (!element.open) {
      element.showModal();
    }
  }, [open]);

  useEffect(() => {
    if (state.status !== "closing") return;
    const timer = window.setTimeout(onClosed, CLOSE_FALLBACK_MS);
    return () => window.clearTimeout(timer);
  }, [state.status, onClosed]);

  return (
    <dialog
      ref={dialog}
      aria-labelledby="card-dialog-title"
      data-state={state.status}
      className="card-dialog"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onAnimationEnd={(event) => {
        if (
          event.target === event.currentTarget &&
          state.status === "closing"
        ) {
          onClosed();
        }
      }}
    >
      {section && (
        <div className="card-dialog-body">
          <header className="flex items-start justify-between gap-4">
            <h2 id="card-dialog-title" className="text-2xl font-semibold">
              {section.classicLabel}{" "}
              <span className="font-mono text-base font-normal text-muted">
                · {section.cardLabel}
              </span>
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-control border border-border px-3 py-1 font-mono text-sm hover:border-accent"
            >
              <span aria-hidden="true">[x] </span>Close
            </button>
          </header>
          <AsciiAnimation section={section.id} />
          <SectionPanel section={section.id} />
        </div>
      )}
    </dialog>
  );
}
