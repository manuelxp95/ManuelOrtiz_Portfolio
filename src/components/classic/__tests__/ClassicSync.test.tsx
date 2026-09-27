// @vitest-environment jsdom
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { ClassicSync } from "@/components/classic/ClassicSync";
import type { SectionId } from "@/domain/types";
import { usePortfolioStore } from "@/state/portfolio-store";

let notify: IntersectionObserverCallback = () => {};

/** Records the observer callback so a test can report which sections are in the band. */
class FakeIntersectionObserver {
  constructor(callback: IntersectionObserverCallback) {
    notify = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

function inBand(...ids: SectionId[]) {
  const entries = ["education", "contact", "cv"].map(
    (id) =>
      ({
        target: document.getElementById(id)!,
        isIntersecting: ids.includes(id as SectionId),
      }) as unknown as IntersectionObserverEntry,
  );
  act(() => notify(entries, {} as IntersectionObserver));
}

const Page = () => (
  <>
    <section id="education" />
    <section id="contact" />
    <section id="cv" />
    <ClassicSync />
  </>
);

beforeAll(() => {
  window.IntersectionObserver =
    FakeIntersectionObserver as unknown as typeof IntersectionObserver;
});

beforeEach(() => {
  window.history.replaceState(null, "", "/");
  usePortfolioStore.setState({ mode: "classic", activeSection: "about" });
});

afterEach(() => {
  // Release any suppression left by a test, like a finished scroll would.
  window.dispatchEvent(new Event("scrollend"));
  cleanup();
});

describe("Classic scroll-spy", () => {
  it("follows scrolling: the first section in the reading band is active", () => {
    render(<Page />);
    inBand("education", "contact");
    expect(usePortfolioStore.getState().activeSection).toBe("education");
    expect(window.location.hash).toBe("#education");
  });

  it("a deep link survives the browser's anchor scroll on load", () => {
    window.history.replaceState(null, "", "/#contact");
    usePortfolioStore.setState({ activeSection: "contact" });
    render(<Page />);

    // Landing near the bottom: the end of Education shares the band with Contact.
    inBand("education", "contact");
    expect(usePortfolioStore.getState().activeSection).toBe("contact");
    expect(window.location.hash).toBe("#contact");

    // Once that scroll has settled, the user's own scrolling is followed again.
    window.dispatchEvent(new Event("scrollend"));
    inBand("cv");
    expect(usePortfolioStore.getState().activeSection).toBe("cv");
  });
});
