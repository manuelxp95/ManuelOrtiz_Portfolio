import type { PortfolioMode } from "@/domain/types";

export const MODE_STORAGE_KEY = "portfolio-mode";

export function isPortfolioMode(value: unknown): value is PortfolioMode {
  return value === "classic" || value === "rogue";
}

/** Stored preference, or null on the server, without storage, or for invalid values. */
export function readStoredMode(): PortfolioMode | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(MODE_STORAGE_KEY);
    return isPortfolioMode(value) ? value : null;
  } catch {
    return null;
  }
}

/** Reflects the mode on <html> (drives the pre-paint CSS) and persists it. */
export function applyMode(mode: PortfolioMode) {
  document.documentElement.dataset.mode = mode;
  try {
    window.localStorage.setItem(MODE_STORAGE_KEY, mode);
  } catch {
    // Storage unavailable (private mode, blocked): the choice lasts for this page only.
  }
}

/** Runs in <head> before first paint (ADR-003); must stay dependency-free. */
export const modeInitScript = `(function(){try{var m=localStorage.getItem(${JSON.stringify(
  MODE_STORAGE_KEY,
)});if(m==="classic"||m==="rogue")document.documentElement.setAttribute("data-mode",m)}catch(e){}})()`;
