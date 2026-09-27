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
import { profile } from "@/content";
import {
  consumePendingModeFocus,
  selectSection,
  usePortfolioStore,
} from "@/state/portfolio-store";
import { parseSectionHash } from "@/state/section-hash";
import { boardReducer, createBoardState } from "./battle";
import { BATTLEFIELD_ID, Battlefield, type Flight } from "./Battlefield";
import { CardDialog } from "./CardDialog";
import { cardAction, isSectionCard, sectionOf, type CardId } from "./cards";
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

/** The bug acts this long after the board is idle again, and its move shows for this long. */
const BOSS_DELAY_MS = 400;
const BOSS_MOVE_MS = 1200;

/** Center-out index of each card in the fan; CSS turns it into rotation, drop and overlap. */
const fanStyle = (index: number, count: number) =>
  ({ "--fan-offset": index - (count - 1) / 2 }) as CSSProperties;

/** Shows what a played card opens: its section, or for a project card that project's relic. */
function selectFor(card: CardId) {
  if (card.startsWith("project:")) {
    window.history.pushState(null, "", `#project-${card.slice(8)}`);
    usePortfolioStore.getState().setActiveSection("projects");
  } else {
    selectSection(sectionOf(card), "push");
  }
}

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
  // Each visit deals a new hand; the seed keeps every later shuffle a pure reducer step.
  const [board, dispatch] = useReducer(boardReducer, undefined, () =>
    createBoardState(Math.floor(Math.random() * 2 ** 32)),
  );
  const state = board.card;
  const [flight, setFlight] = useState<Flight | null>(null);
  const cards = useRef(new Map<CardId, HTMLButtonElement>());
  const field = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);
  const lastOpen = useRef<CardId | null>(null);
  // Mouse only: touch keeps tap-to-play and native scrolling (P6, ADR-006).
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: DRAG_ACTIVATION_DISTANCE },
    }),
  );
  const dragged = state.status === "dragging" ? state.card : null;
  const aiming =
    state.status === "dragging" || state.status === "inspecting"
      ? state.card
      : null;
  const aimed = aiming ? cardAction(aiming).target : null;
  const hand = board.hand;

  /** Where the last played card sat in the hand. */
  const playedSlot = useRef(0);

  /** Focus a card or, when it went back into the deck, the card now in its slot. */
  const focusCard = useCallback((card: CardId | null) => {
    const slots = document.querySelectorAll<HTMLElement>(
      ".card-hand .section-card",
    );
    const element =
      (card && cards.current.get(card)) ??
      slots[Math.min(playedSlot.current, slots.length - 1)];
    element?.focus({ preventScroll: true });
  }, []);

  // Entering Card Mode: a user switch focuses the selected card; a page load with a section hash
  // (shared deep link, reload) opens that card directly.
  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;
    const active = usePortfolioStore.getState().activeSection;
    if (consumePendingModeFocus()) {
      focusCard(active);
    } else if (parseSectionHash(window.location.hash)) {
      dispatch({ type: "OPEN", card: active });
    }
  }, [focusCard]);

  // The open card always shows the active section (back/forward, links inside a card).
  useEffect(() => {
    if (
      (state.status === "expanded" || state.status === "closing") &&
      sectionOf(state.card) !== activeSection
    ) {
      dispatch({ type: "OPEN", card: activeSection });
    }
  }, [activeSection, state]);

  // Restoring: once the dialog is fully closed, focus returns to the card it came from.
  useEffect(() => {
    if (state.status === "idle") {
      if (lastOpen.current) focusCard(lastOpen.current);
      lastOpen.current = null;
    } else if (state.status === "expanded" || state.status === "closing") {
      lastOpen.current = state.card;
    }
  }, [state, focusCard]);

  // The bug takes its turn once the board is back to idle (never over an open card), shows its
  // move, then hands the turn back. Playing a card meanwhile resolves it at once (see `play`).
  const boss = board.combat.boss;
  useEffect(() => {
    if (boss === "pending" && state.status === "idle") {
      const timer = window.setTimeout(
        () => dispatch({ type: "BOSS_ACT" }),
        BOSS_DELAY_MS,
      );
      return () => window.clearTimeout(timer);
    }
    if (boss === "acting") {
      const timer = window.setTimeout(
        () => dispatch({ type: "BOSS_DONE" }),
        BOSS_MOVE_MS,
      );
      return () => window.clearTimeout(timer);
    }
  }, [boss, state.status]);

  // Escape skips a running effect.
  useEffect(() => {
    if (state.status !== "playing") return;
    const skip = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") dispatch({ type: "EFFECT_DONE" });
    };
    window.addEventListener("keydown", skip);
    return () => window.removeEventListener("keydown", skip);
  }, [state.status]);

  /** A due or showing bug move resolves at once when the player acts again. */
  const settleBoss = useCallback(() => {
    if (boss === "pending") dispatch({ type: "BOSS_ACT" });
    if (boss === "pending" || boss === "acting")
      dispatch({ type: "BOSS_DONE" });
  }, [boss]);

  const play = useCallback(
    (card: CardId) => {
      settleBoss();
      playedSlot.current = Math.max(0, hand.indexOf(card));
      const element = cards.current.get(card);
      setFlight(
        element && field.current
          ? measureFlight(element.getBoundingClientRect(), field.current)
          : null,
      );
      selectFor(card);
      dispatch({ type: "PLAY", card, reducedMotion });
    },
    [reducedMotion, settleBoss, hand],
  );

  const close = useCallback(
    () => dispatch({ type: "CLOSE", reducedMotion }),
    [reducedMotion],
  );
  const closed = useCallback(() => dispatch({ type: "CLOSED" }), []);
  const effectDone = useCallback(() => dispatch({ type: "EFFECT_DONE" }), []);
  const cardElement = useCallback(
    (card: CardId) => cards.current.get(card),
    [],
  );

  function activate(card: CardId, touch: boolean) {
    if (state.status === "playing") dispatch({ type: "EFFECT_DONE" });
    else if (touch && !(state.status === "inspecting" && state.card === card))
      dispatch({ type: "INSPECT", card });
    else play(card);
  }

  /** Left/Right move along the hand, like the fan reads. */
  function onHandKeyDown(event: KeyboardEvent<HTMLUListElement>) {
    const step = { ArrowLeft: -1, ArrowRight: 1 }[event.key];
    if (!step) return;
    const current = hand.findIndex(
      (id) => cards.current.get(id) === document.activeElement,
    );
    if (current < 0) return;
    event.preventDefault();
    const next = hand[(current + step + hand.length) % hand.length];
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
          <p className="deck-count font-mono">
            Deck {board.deck.length} · Hand {hand.length}
          </p>
        </header>
        {/* dnd-kit only dispatches machine events; the machine decides what a drop means. */}
        <DndContext
          sensors={sensors}
          accessibility={{ announcements: dragAnnouncements }}
          onDragStart={({ active }) =>
            dispatch({ type: "DRAG_START", card: active.id as CardId })
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
              settleBoss();
              playedSlot.current = Math.max(
                0,
                hand.indexOf(active.id as CardId),
              );
              selectFor(active.id as CardId);
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
              onReset={() => dispatch({ type: "RESET_BATTLE" })}
              renderFace={(card) => (
                <CardFace card={card} selected={card === activeSection} />
              )}
            />
          </div>
          <ul
            aria-label="Hand"
            className="card-hand"
            style={{ "--hand-count": hand.length } as CSSProperties}
            onKeyDown={onHandKeyDown}
          >
            {hand.map((card, index) => (
              <li
                key={card}
                className="card-slot"
                style={fanStyle(index, hand.length)}
                data-inspecting={
                  (state.status === "inspecting" && state.card === card) ||
                  undefined
                }
                data-played={
                  (isSectionCard(card) && board.played.includes(card)) ||
                  undefined
                }
              >
                {/* Dealt into the hand once on entry; the fan transform stays on the slot. */}
                <m.div
                  initial={deal}
                  animate={{ opacity: 1, y: 0 }}
                  transition={stagger(index)}
                >
                  <SectionCard
                    ref={(element) => {
                      if (element) cards.current.set(card, element);
                      else cards.current.delete(card);
                    }}
                    card={card}
                    selected={card === activeSection}
                    played={isSectionCard(card) && board.played.includes(card)}
                    onActivate={(touch) => activate(card, touch)}
                    onSwipeUp={() => play(card)}
                    onIntent={() => preloadSectionPanel(sectionOf(card))}
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
                <CardFace card={dragged} selected={dragged === activeSection} />
              </div>
            )}
          </DragOverlay>
        </DndContext>
        <CardDialog state={state} onClose={close} onClosed={closed} />
      </section>
    </CardMotion>
  );
}
