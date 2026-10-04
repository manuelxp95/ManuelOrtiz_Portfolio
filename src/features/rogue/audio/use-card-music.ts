import { useEffect } from "react";

type Engine = typeof import("./music-engine");

let engine: Promise<Engine> | null = null;
let loaded: Engine | null = null;

/** The audio engine and its beat map are their own chunk, fetched when the board mounts. */
function loadMusicEngine(): Promise<Engine> {
  engine ??= import("./music-engine").then(
    (module) => (loaded = module),
    (error: unknown) => {
      engine = null; // a later mount retries after a network failure
      throw error;
    },
  );
  return engine;
}

/**
 * The engine if it has loaded. A click handler calls it synchronously: some browsers only let
 * audio start inside the gesture's own task, not after an awaited import.
 */
export function musicEngine(): Engine | null {
  return loaded;
}

/** Runs `use` once the engine is loaded; without it Card Mode simply stays silent. */
function withEngine(use: (engine: Engine) => void) {
  loadMusicEngine().then(use, () => {});
}

/** The intro's alarm (P9.13), on the effects bus once the engine has loaded. */
export function playAlarm() {
  withEngine((music) => music.playAlarm());
}

interface CardMusicOptions {
  /** The element that bounces on the beat, or null (reduced motion, a card open) for none. */
  beatTarget: HTMLElement | null;
  /** An upgrade is on offer: the music steps back while the visitor decides. */
  ducked: boolean;
}

/** Card Mode's background music (Roadmap P9.11): on while the board is mounted. */
export function useCardMusic({ beatTarget, ducked }: CardMusicOptions) {
  useEffect(() => {
    withEngine((music) => music.enterCardMode());
    return () => withEngine((music) => music.leaveCardMode());
  }, []);

  useEffect(() => {
    withEngine((music) => music.setDucked(ducked));
  }, [ducked]);

  useEffect(() => {
    withEngine((music) => music.setBeatTarget(beatTarget));
    return () => withEngine((music) => music.setBeatTarget(null));
  }, [beatTarget]);
}
