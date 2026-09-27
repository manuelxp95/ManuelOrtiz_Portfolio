"use client";

import { useEffect } from "react";
import { SECTION_IDS, type SectionId } from "@/domain/types";
import {
  consumePendingModeFocus,
  selectSection,
  usePortfolioStore,
} from "@/state/portfolio-store";
import {
  firstVisibleSection,
  isScrollSpySuppressed,
  parseSectionHash,
  suppressScrollSpy,
} from "@/state/section-hash";

/**
 * Band where a section counts as the one being read. Its top edge sits just below where anchor
 * navigation lands a section (header 3.5rem + 1rem scroll-margin = 72px), so the previous
 * section's last pixels never win over the section that was navigated to.
 */
const SPY_ROOT_MARGIN = "-80px 0px -55% 0px";

/**
 * Classic-only behavior, mounted with the Classic renderer: returns to the active section after a
 * mode switch, and keeps the active section (and hash, via replaceState) in step with scrolling.
 */
export function ClassicSync() {
  useEffect(() => {
    if (consumePendingModeFocus()) {
      const section = document.getElementById(
        usePortfolioStore.getState().activeSection,
      );
      if (section) {
        suppressScrollSpy();
        section.scrollIntoView();
        section
          .querySelector<HTMLElement>("h1, h2")
          ?.focus({ preventScroll: true });
      }
    } else if (parseSectionHash(window.location.hash)) {
      // A page load with a section hash: the browser's anchor scroll must not be read as the user
      // scrolling, or it rewrites the hash on the way (and a short last section never wins).
      suppressScrollSpy();
    }

    if (typeof IntersectionObserver === "undefined") return;
    const visible = new Set<SectionId>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id as SectionId;
          if (entry.isIntersecting) visible.add(id);
          else visible.delete(id);
        }
        if (isScrollSpySuppressed()) return;
        const current = firstVisibleSection(visible);
        if (current && current !== usePortfolioStore.getState().activeSection) {
          selectSection(current, "replace");
        }
      },
      { rootMargin: SPY_ROOT_MARGIN },
    );
    for (const id of SECTION_IDS) {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, []);

  return null;
}
