/**
 * The single entry point into the Card Mode chunk (ADR-005). `ModeRoot` renders through it and the
 * mode toggle warms it on intent, so both share one request. The only module outside
 * `src/features/rogue` allowed to import from it (see eslint.config.mjs).
 */
import {
  createElement,
  useSyncExternalStore,
  type ComponentType,
  type ReactNode,
} from "react";

type Board = ComponentType;

let board: Promise<Board> | null = null;
let loaded: Board | null = null;
const listeners = new Set<() => void>();

export function loadRogueBoard(): Promise<Board> {
  board ??= import("./RogueBoard").then(
    (module) => {
      loaded = module.RogueBoard;
      listeners.forEach((notify) => notify());
      return loaded;
    },
    (error: unknown) => {
      board = null; // let a later attempt retry after a network failure
      throw error;
    },
  );
  return board;
}

interface NetworkInformationLike {
  saveData?: boolean;
}

function prefersLessData(): boolean {
  const connection = (
    navigator as Navigator & { connection?: NetworkInformationLike }
  ).connection;
  if (connection?.saveData) return true;
  return window.matchMedia?.("(prefers-reduced-data: reduce)").matches ?? false;
}

/** Intent tier: hover/focus/touch on the toggle. Skipped when the user asked to save data. */
export function preloadRogueBoard() {
  if (board || prefersLessData()) return;
  void loadRogueBoard().catch(() => {
    // A failed warm-up is not an error; the real switch retries and shows its own fallback.
  });
}

function subscribe(notify: () => void) {
  listeners.add(notify);
  return () => listeners.delete(notify);
}

/**
 * Renders the Card Mode board once its chunk has loaded, else `fallback`. The board component is a
 * module-level reference that never changes after loading, so it keeps a stable identity; rendering
 * it directly (instead of React.lazy/Suspense) makes a switch after the intent preload instant.
 */
export function RogueBoardSlot({
  fallback,
}: {
  fallback: ReactNode;
}): ReactNode {
  const ready = useRogueBoardLoaded();
  return ready && loaded ? createElement(loaded) : fallback;
}

/** Whether the Card Mode chunk has loaded (drives the load-on-demand effect in ModeRoot). */
export function useRogueBoardLoaded(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => loaded !== null,
    () => false,
  );
}
