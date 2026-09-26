"use client";

import {
  DndContext,
  DragOverlay,
  MouseSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useCallback, useEffect, useReducer, useRef } from "react";
import {
  contactLinks,
  cv,
  education,
  experience,
  profile,
  projects,
  skills,
} from "@/content";
import { sections } from "@/domain/sections";
import type { SectionId } from "@/domain/types";
import {
  consumePendingModeFocus,
  selectSection,
  usePortfolioStore,
} from "@/state/portfolio-store";
import { parseSectionHash } from "@/state/section-hash";
import { CardDialog } from "./CardDialog";
import { cardReducer, initialCardState } from "./card-machine";
import {
  DRAG_ACTIVATION_DISTANCE,
  dragAnnouncements,
} from "./drag/drag-config";
import { PLAY_ZONE_ID, PlayZone } from "./drag/PlayZone";
import { CardFace, SectionCard } from "./SectionCard";
import { useReducedMotion } from "./use-reduced-motion";
import "./rogue.css";

/** One-line summary per card, derived from the content (never a second copy of it). */
const cardStats: Record<SectionId, string> = {
  about: profile.location.split(",")[0],
  skills: `${skills.length} skills`,
  experience: `${experience.length} roles`,
  projects: `${projects.length} projects`,
  education: `${education.length} entries`,
  contact: `${contactLinks.length} channels`,
  cv: cv ? "PDF ready" : "PDF coming soon",
};

/** Center-out index of each card in the desktop fan (-3 … 3). */
function fanStyle(index: number) {
  const offset = index - (sections.length - 1) / 2;
  return {
    "--fan-rotate": `${offset * 5}deg`,
    "--fan-drop": `${offset * offset * 6}px`,
  } as React.CSSProperties;
}

export function RogueBoard() {
  const activeSection = usePortfolioStore((state) => state.activeSection);
  const reducedMotion = useReducedMotion();
  const [state, dispatch] = useReducer(cardReducer, initialCardState);
  const cards = useRef(new Map<SectionId, HTMLButtonElement>());
  const mounted = useRef(false);
  const lastOpen = useRef<SectionId | null>(null);
  // Mouse only: touch keeps tap-to-open and native scrolling (P6, ADR-006).
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: DRAG_ACTIVATION_DISTANCE },
    }),
  );
  const dragged =
    state.status === "dragging"
      ? sections.find((section) => section.id === state.card)
      : undefined;

  // Entering Card Mode: a user switch focuses the selected card; a page load with a section hash
  // (shared deep link, reload) opens that card directly.
  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;
    const active = usePortfolioStore.getState().activeSection;
    if (consumePendingModeFocus()) {
      cards.current.get(active)?.focus();
    } else if (parseSectionHash(window.location.hash)) {
      dispatch({ type: "OPEN", card: active });
    }
  }, []);

  // The open card always shows the active section (back/forward, links inside a card).
  useEffect(() => {
    if (state.status !== "idle" && state.card !== activeSection) {
      dispatch({ type: "OPEN", card: activeSection });
    }
  }, [activeSection, state]);

  // Restoring: once the dialog is fully closed, focus returns to the card it came from.
  useEffect(() => {
    if (state.status === "idle") {
      if (lastOpen.current) cards.current.get(lastOpen.current)?.focus();
      lastOpen.current = null;
    } else {
      lastOpen.current = state.card;
    }
  }, [state]);

  const close = useCallback(
    () => dispatch({ type: "CLOSE", reducedMotion }),
    [reducedMotion],
  );
  const closed = useCallback(() => dispatch({ type: "CLOSED" }), []);

  return (
    <section
      aria-labelledby="card-board-heading"
      className="rogue-board rogue-stage py-12"
    >
      <h1 id="card-board-heading" className="text-3xl font-bold">
        {profile.name}{" "}
        <span className="font-mono text-lg font-normal text-muted">
          · Card Mode
        </span>
      </h1>
      <p className="mt-2 font-mono text-sm text-muted">
        &gt; choose a card to open it_
      </p>
      {/* dnd-kit only dispatches machine events; the machine decides what a drop means. */}
      <DndContext
        sensors={sensors}
        accessibility={{ announcements: dragAnnouncements }}
        onDragStart={({ active }) =>
          dispatch({ type: "DRAG_START", card: active.id as SectionId })
        }
        onDragOver={({ over }) =>
          dispatch({ type: "DRAG_OVER", overZone: over?.id === PLAY_ZONE_ID })
        }
        onDragEnd={({ active, over }) => {
          const onZone = over?.id === PLAY_ZONE_ID;
          dispatch({ type: "DRAG_OVER", overZone: onZone });
          if (onZone) selectSection(active.id as SectionId, "push");
          dispatch({ type: "DROP" });
        }}
        onDragCancel={() => dispatch({ type: "DRAG_CANCEL" })}
      >
        <PlayZone
          dragging={state.status === "dragging"}
          candidate={state.status === "dragging" && state.overZone}
        />
        <ul aria-label="Sections" className="card-hand">
          {sections.map((section, index) => (
            <li key={section.id} className="card-slot" style={fanStyle(index)}>
              <SectionCard
                ref={(element) => {
                  if (element) cards.current.set(section.id, element);
                  else cards.current.delete(section.id);
                }}
                section={section}
                stat={cardStats[section.id]}
                selected={section.id === activeSection}
                onOpen={() => {
                  selectSection(section.id, "push");
                  dispatch({ type: "OPEN", card: section.id });
                }}
              />
            </li>
          ))}
        </ul>
        {/* A successful drop opens the dialog in place of a snap-back; reduced motion never animates. */}
        <DragOverlay
          dropAnimation={
            reducedMotion || (state.status === "dragging" && state.overZone)
              ? null
              : undefined
          }
        >
          {dragged && (
            <div className="section-card card-overlay">
              <CardFace
                section={dragged}
                stat={cardStats[dragged.id]}
                selected={dragged.id === activeSection}
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>
      <CardDialog state={state} onClose={close} onClosed={closed} />
    </section>
  );
}
