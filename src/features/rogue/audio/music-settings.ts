import { useSyncExternalStore } from "react";

/**
 * What the music toggle shows (ADR-016), outside the lazily loaded audio engine so the toggle
 * renders at once. `muted` is the visitor's choice, remembered on this device; `blocked` is set by
 * the engine while the browser holds the music until the visitor's first interaction.
 */
export interface MusicSettings {
  muted: boolean;
  blocked: boolean;
}

const KEY = "card-mode-music-muted";

function readMuted(): boolean {
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

let settings: MusicSettings | null = null;
const listeners = new Set<() => void>();

export function musicSettings(): MusicSettings {
  settings ??= { muted: readMuted(), blocked: false };
  return settings;
}

function update(next: Partial<MusicSettings>) {
  settings = { ...musicSettings(), ...next };
  listeners.forEach((notify) => notify());
}

export function setMuted(muted: boolean) {
  try {
    window.localStorage.setItem(KEY, muted ? "1" : "0");
  } catch {
    // Storage unavailable (private mode): the choice lasts for this visit only.
  }
  update({ muted });
}

export function setBlocked(blocked: boolean) {
  if (musicSettings().blocked !== blocked) update({ blocked });
}

export function subscribeMusicSettings(notify: () => void) {
  listeners.add(notify);
  return () => listeners.delete(notify);
}

const SERVER: MusicSettings = { muted: true, blocked: false };

export function useMusicSettings(): MusicSettings {
  return useSyncExternalStore(
    subscribeMusicSettings,
    musicSettings,
    () => SERVER,
  );
}
