"use client";

import { useEffect, useRef } from "react";
import { profile } from "@/content";
import { sections } from "@/domain/sections";
import type { SectionId } from "@/domain/types";
import {
  consumePendingModeFocus,
  selectSection,
  usePortfolioStore,
} from "@/state/portfolio-store";

/**
 * Roadmap P3 stand-in for the Card Mode board: enough to exercise mode switching, section
 * preservation and hash sync. Replaced by the real board in Roadmap P4.
 */
export function RoguePlaceholder() {
  const activeSection = usePortfolioStore((state) => state.activeSection);
  const board = useRef<HTMLElement>(null);
  const cards = useRef(new Map<SectionId, HTMLButtonElement>());

  useEffect(() => {
    if (consumePendingModeFocus()) {
      board.current?.scrollIntoView({ block: "start" });
      cards.current.get(usePortfolioStore.getState().activeSection)?.focus();
    }
  }, []);

  return (
    <section
      ref={board}
      aria-labelledby="card-board-heading"
      className="scroll-mt-(--header-height) py-12"
    >
      <h1 id="card-board-heading" className="text-3xl font-bold">
        {profile.name} <span className="text-muted">· Card Mode</span>
      </h1>
      <p className="mt-2 text-sm text-muted">
        Preview board: pick a card to select a section. The full card experience
        is coming soon.
      </p>
      <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {sections.map((section) => {
          const selected = section.id === activeSection;
          return (
            <li key={section.id}>
              <button
                type="button"
                id={`card-${section.id}`}
                ref={(element) => {
                  if (element) cards.current.set(section.id, element);
                  else cards.current.delete(section.id);
                }}
                aria-current={selected ? "true" : undefined}
                onClick={() => selectSection(section.id, "push")}
                className="flex aspect-[5/7] w-full flex-col justify-between rounded-card border-2 border-border bg-surface p-4 text-left transition-colors duration-(--duration-fast) hover:border-accent aria-[current=true]:border-accent"
              >
                <span className="font-semibold">{section.cardLabel}</span>
                <span className="text-sm text-muted">
                  {section.classicLabel}
                </span>
                {selected && (
                  <span className="text-xs font-semibold text-accent">
                    Selected
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
