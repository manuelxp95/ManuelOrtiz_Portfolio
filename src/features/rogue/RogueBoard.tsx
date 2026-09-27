"use client";

import {
  DndContext,
  DragOverlay,
  MouseSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { m } from "motion/react";
import {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
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
import { boardReducer, cardActions, initialBoardState } from "./battle";
import { BATTLEFIELD_ID, Battlefield, type Flight } from "./Battlefield";
import { CardDialog } from "./CardDialog";
import {
  DRAG_ACTIVATION_DISTANCE,
  dragAnnouncements,
} from "./drag/drag-config";
import { CardMotion, stagger, useEntrance } from "./motion-config";
import { preloadSectionPanel } from "./sections/SectionPanel";
import { CardFace, SectionCard } from "./SectionCard";
import { TargetArrow } from "./TargetArrow";
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

const sectionMeta = (id: SectionId) =>
  sections.find((section) => section.id === id)!;

/** Center-out index of each card in the fan (-3 … 3); CSS turns it into rotation and drop. */
const fanStyle = (index: number) =>
  ({ "--fan-offset": index - (sections.length - 1) / 2 }) as CSSProperties;

/** Where a played card lands: the lower middle of the battlefield. */
function measureFlight(
  from: { left: number; top: number; width: number; height: number },
  field: HTMLElement,
): Flight {
  const to = field.getBoundingClientRect();
  return {
    dx: from.left + from.width / 2 - (to.left + to.width / 2),
    dy: from.top + from.height / 2 - (to.top + to.height * 0.7),
    width: from.width,
  };
}

export function RogueBoard() {
  const activeSection = usePortfolioStore((state) => state.activeSection);
  const reducedMotion = useReducedMotion();
  const deal = useEntrance({ opacity: 0, y: 24 });
  const [board, dispatch] = useReducer(boardReducer, initialBoardState);
  const state = board.card;
  const [flight, setFlight] = useState<Flight | null>(null);
  const cards = useRef(new Map<SectionId, HTMLButtonElement>());
  const field = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);
  const lastOpen = useRef<SectionId | null>(null);
  // Mouse only: touch keeps tap-to-play and native scrolling (P6, ADR-006).
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: DRAG_ACTIVATION_DISTANCE },
    }),
  );
  const dragged = state.status === "dragging" ? sectionMeta(state.card) : null;
  const aiming =
    state.status === "dragging" || state.status === "inspecting"
      ? state.card
      : null;
  const aimed = aiming ? cardActions[aiming].target : null;

  // Entering Card Mode: a user switch focuses the selected card; a page load with a section hash
  // (shared deep link, reload) opens that card directly.
  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;
    const active = usePortfolioStore.getState().activeSection;
    if (consumePendingModeFocus()) {
      cards.current.get(active)?.focus({ preventScroll: true });
    } else if (parseSectionHash(window.location.hash)) {
      dispatch({ type: "OPEN", card: active });
    }
  }, []);

  // The open card always shows the active section (back/forward, links inside a card).
  useEffect(() => {
    if (
      (state.status === "expanded" || state.status === "closing") &&
      state.card !== activeSection
    ) {
      dispatch({ type: "OPEN", card: activeSection });
    }
  }, [activeSection, state]);

  // Restoring: once the dialog is fully closed, focus returns to the card it came from.
  useEffect(() => {
    if (state.status === "idle") {
      if (lastOpen.current)
        cards.current.get(lastOpen.current)?.focus({ preventScroll: true });
      lastOpen.current = null;
    } else if (state.status === "expanded" || state.status === "closing") {
      lastOpen.current = state.card;
    }
  }, [state]);

  // Escape skips a running effect.
  useEffect(() => {
    if (state.status !== "playing") return;
    const skip = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") dispatch({ type: "EFFECT_DONE" });
    };
    window.addEventListener("keydown", skip);
    return () => window.removeEventListener("keydown", skip);
  }, [state.status]);

  const play = useCallback(
    (card: SectionId) => {
      const element = cards.current.get(card);
      setFlight(
        element && field.current
          ? measureFlight(element.getBoundingClientRect(), field.current)
          : null,
      );
      selectSection(card, "push");
      dispatch({ type: "PLAY", card, reducedMotion });
    },
    [reducedMotion],
  );

  const close = useCallback(
    () => dispatch({ type: "CLOSE", reducedMotion }),
    [reducedMotion],
  );
  const closed = useCallback(() => dispatch({ type: "CLOSED" }), []);
  const effectDone = useCallback(() => dispatch({ type: "EFFECT_DONE" }), []);
  const cardElement = useCallback(
    (card: SectionId) => cards.current.get(card),
    [],
  );

  function activate(card: SectionId, touch: boolean) {
    if (state.status === "playing") dispatch({ type: "EFFECT_DONE" });
    else if (touch && !(state.status === "inspecting" && state.card === card))
      dispatch({ type: "INSPECT", card });
    else play(card);
  }

  /** Left/Right move along the hand, like the fan reads. */
  function onHandKeyDown(event: KeyboardEvent<HTMLUListElement>) {
    const step = { ArrowLeft: -1, ArrowRight: 1 }[event.key];
    if (!step) return;
    const ids = sections.map((section) => section.id);
    const current = ids.findIndex(
      (id) => cards.current.get(id) === document.activeElement,
    );
    if (current < 0) return;
    event.preventDefault();
    const next = ids[(current + step + ids.length) % ids.length];
    cards.current.get(next)?.focus();
  }

  return (
    <CardMotion>
      <section
        aria-labelledby="card-board-heading"
        className="rogue-board rogue-stage"
        onPointerDown={(event) => {
          // A tap anywhere but a card or the battlefield drops a lifted card back into the hand.
          const target = event.target as Element;
          if (
            state.status === "inspecting" &&
            !target.closest(".section-card, .battlefield")
          )
            dispatch({ type: "RELEASE" });
        }}
      >
        <header className="board-header">
          <h1 id="card-board-heading" className="text-xl font-bold sm:text-2xl">
            {profile.name}{" "}
            <span className="font-mono text-sm font-normal text-muted sm:text-base">
              · Card Mode
            </span>
          </h1>
          <p className="font-mono text-xs text-muted sm:text-sm">
            <span className="hint-touch">
              &gt; tap a card to lift it, tap again or swipe up to play_
            </span>
            <span className="hint-pointer">
              &gt; click a card to play it, or drag it onto the bug_
            </span>
          </p>
        </header>
        {/* dnd-kit only dispatches machine events; the machine decides what a drop means. */}
        <DndContext
          sensors={sensors}
          accessibility={{ announcements: dragAnnouncements }}
          onDragStart={({ active }) =>
            dispatch({ type: "DRAG_START", card: active.id as SectionId })
          }
          onDragOver={({ over }) =>
            dispatch({
              type: "DRAG_OVER",
              overZone: over?.id === BATTLEFIELD_ID,
            })
          }
          onDragEnd={({ active, over }) => {
            const onField = over?.id === BATTLEFIELD_ID;
            dispatch({ type: "DRAG_OVER", overZone: onField });
            if (onField) {
              // The card flies on from where it was released.
              const released = active.rect.current.translated;
              setFlight(
                released && field.current
                  ? measureFlight(released, field.current)
                  : null,
              );
              selectSection(active.id as SectionId, "push");
            }
            dispatch({ type: "DROP", reducedMotion });
          }}
          onDragCancel={() => dispatch({ type: "DRAG_CANCEL" })}
        >
          <div ref={field} className="battlefield-slot">
            <Battlefield
              board={board}
              dragging={state.status === "dragging"}
              candidate={state.status === "dragging" && state.overZone}
              aimed={aimed}
              flight={flight}
              reducedMotion={reducedMotion}
              onActivate={() => {
                if (state.status === "playing") effectDone();
                else if (state.status === "inspecting") play(state.card);
              }}
              onEffectDone={effectDone}
              renderFace={(card) => (
                <CardFace
                  section={sectionMeta(card)}
                  stat={cardStats[card]}
                  selected={card === activeSection}
                />
              )}
            />
          </div>
          <ul
            aria-label="Sections"
            className="card-hand"
            onKeyDown={onHandKeyDown}
          >
            {sections.map((section, index) => (
              <li
                key={section.id}
                className="card-slot"
                style={fanStyle(index)}
                data-inspecting={
                  (state.status === "inspecting" &&
                    state.card === section.id) ||
                  undefined
                }
                data-played={board.played.includes(section.id) || undefined}
              >
                {/* Dealt into the hand once on entry; the fan transform stays on the slot. */}
                <m.div
                  initial={deal}
                  animate={{ opacity: 1, y: 0 }}
                  transition={stagger(index)}
                >
                  <SectionCard
                    ref={(element) => {
                      if (element) cards.current.set(section.id, element);
                      else cards.current.delete(section.id);
                    }}
                    section={section}
                    stat={cardStats[section.id]}
                    selected={section.id === activeSection}
                    played={board.played.includes(section.id)}
                    onActivate={(touch) => activate(section.id, touch)}
                    onSwipeUp={() => play(section.id)}
                    onIntent={() => preloadSectionPanel(section.id)}
                  />
                </m.div>
              </li>
            ))}
          </ul>
          <TargetArrow
            target={aimed}
            dragging={state.status === "dragging"}
            lifted={state.status === "inspecting" ? state.card : null}
            cardElement={cardElement}
          />
          {/* A successful drop plays the card in place of a snap-back; reduced motion never animates. */}
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
    </CardMotion>
  );
}
