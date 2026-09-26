import { SECTION_IDS, type SectionId } from "@/domain/types";

export function isSectionId(value: string): value is SectionId {
  return (SECTION_IDS as readonly string[]).includes(value);
}

/** Section id from a URL hash ("#projects"), or null when it isn't a known section. */
export function parseSectionHash(hash: string): SectionId | null {
  let id: string;
  try {
    id = decodeURIComponent(hash.replace(/^#/, ""));
  } catch {
    return null;
  }
  return isSectionId(id) ? id : null;
}

/** First visible section in document order. */
export function firstVisibleSection(
  visible: ReadonlySet<SectionId>,
): SectionId | null {
  return SECTION_IDS.find((id) => visible.has(id)) ?? null;
}

/**
 * History policy (ADR-004): `push` for explicit navigation, `replace` for scroll-driven changes.
 * pushState/replaceState never fire `hashchange`, so writes don't loop back into the store.
 */
export function writeSectionHash(id: SectionId, method: "push" | "replace") {
  const hash = `#${id}`;
  if (window.location.hash === hash) return;
  if (method === "push") window.history.pushState(null, "", hash);
  else window.history.replaceState(null, "", hash);
}

const SUPPRESS_FALLBACK_MS = 1000;
let scrollSpySuppressed = false;
let releaseSuppression: (() => void) | null = null;

/** Ignore scroll-spy updates until the current (programmatic or anchor) scroll settles. */
export function suppressScrollSpy() {
  releaseSuppression?.();
  scrollSpySuppressed = true;
  const timer = window.setTimeout(release, SUPPRESS_FALLBACK_MS);
  function release() {
    scrollSpySuppressed = false;
    window.clearTimeout(timer);
    window.removeEventListener("scrollend", release);
    releaseSuppression = null;
  }
  window.addEventListener("scrollend", release, { once: true });
  releaseSuppression = release;
}

export function isScrollSpySuppressed(): boolean {
  return scrollSpySuppressed;
}
