import { useEffect } from "react";
import { usePortfolioStore } from "./portfolio-store";
import { parseSectionHash, suppressScrollSpy } from "./section-hash";

/** URL → store: anchor clicks, back/forward and manual hash edits update the active section. */
export function useHashSync() {
  useEffect(() => {
    function syncFromUrl() {
      const id = parseSectionHash(window.location.hash);
      if (id === null) return;
      suppressScrollSpy();
      usePortfolioStore.getState().setActiveSection(id);
    }
    window.addEventListener("hashchange", syncFromUrl);
    window.addEventListener("popstate", syncFromUrl);
    return () => {
      window.removeEventListener("hashchange", syncFromUrl);
      window.removeEventListener("popstate", syncFromUrl);
    };
  }, []);
}
