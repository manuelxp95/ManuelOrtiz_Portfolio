import { create } from "zustand";
import {
  SECTION_IDS,
  type PortfolioMode,
  type SectionId,
} from "@/domain/types";
import { applyMode, readStoredMode } from "./mode-storage";
import { parseSectionHash, writeSectionHash } from "./section-hash";

/** Only state shared by distant components lives here: mode (UI) and active section (domain). */
interface PortfolioState {
  mode: PortfolioMode;
  activeSection: SectionId;
  setMode: (mode: PortfolioMode) => void;
  setActiveSection: (id: SectionId) => void;
}

function initialActiveSection(): SectionId {
  if (typeof window === "undefined") return SECTION_IDS[0];
  return parseSectionHash(window.location.hash) ?? SECTION_IDS[0];
}

// Client initial values come from storage and the URL; renderers stay gated behind hydration
// (useHydrated) so the first client render still matches the server's classic HTML.
export const usePortfolioStore = create<PortfolioState>()((set) => ({
  mode: readStoredMode() ?? "classic",
  activeSection: initialActiveSection(),
  setMode: (mode) => set({ mode }),
  setActiveSection: (activeSection) => set({ activeSection }),
}));

/** Selects a section and mirrors it in the URL hash. */
export function selectSection(id: SectionId, method: "push" | "replace") {
  usePortfolioStore.getState().setActiveSection(id);
  writeSectionHash(id, method);
}

let pendingModeFocus = false;

/** User-initiated mode switch: persists it and asks the incoming renderer to take focus. */
export function switchMode(mode: PortfolioMode) {
  applyMode(mode);
  pendingModeFocus = true;
  usePortfolioStore.getState().setMode(mode);
}

/** True once after a user switch; the renderer that mounts next moves focus to the active section. */
export function consumePendingModeFocus(): boolean {
  const pending = pendingModeFocus;
  pendingModeFocus = false;
  return pending;
}
