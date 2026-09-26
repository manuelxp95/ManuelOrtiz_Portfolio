// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  firstVisibleSection,
  isScrollSpySuppressed,
  parseSectionHash,
  suppressScrollSpy,
  writeSectionHash,
} from "@/state/section-hash";

beforeEach(() => window.history.replaceState(null, "", "/"));
afterEach(() => vi.useRealTimers());

describe("parseSectionHash", () => {
  it.each([
    ["#projects", "projects"],
    ["projects", "projects"],
    ["#cv", "cv"],
    ["#project-sopa", "projects"],
  ])("accepts %s", (hash, expected) => {
    expect(parseSectionHash(hash)).toBe(expected);
  });

  it.each(["", "#", "#nope", "#Projects", "#%E0%A4%A"])(
    "rejects %j",
    (hash) => {
      expect(parseSectionHash(hash)).toBeNull();
    },
  );
});

describe("firstVisibleSection", () => {
  it("returns the first visible section in document order", () => {
    expect(firstVisibleSection(new Set(["cv", "skills", "projects"]))).toBe(
      "skills",
    );
  });

  it("returns null when nothing is visible", () => {
    expect(firstVisibleSection(new Set())).toBeNull();
  });
});

describe("writeSectionHash", () => {
  it("push adds a history entry, replace does not", () => {
    const start = window.history.length;
    writeSectionHash("skills", "push");
    expect(window.location.hash).toBe("#skills");
    expect(window.history.length).toBe(start + 1);
    writeSectionHash("projects", "replace");
    expect(window.location.hash).toBe("#projects");
    expect(window.history.length).toBe(start + 1);
  });

  it("does nothing when the hash is already current", () => {
    writeSectionHash("cv", "push");
    const length = window.history.length;
    writeSectionHash("cv", "push");
    expect(window.history.length).toBe(length);
  });
});

describe("suppressScrollSpy", () => {
  it("lifts on scrollend", () => {
    suppressScrollSpy();
    expect(isScrollSpySuppressed()).toBe(true);
    window.dispatchEvent(new Event("scrollend"));
    expect(isScrollSpySuppressed()).toBe(false);
  });

  it("lifts after a fallback delay when no scroll happens", () => {
    vi.useFakeTimers();
    suppressScrollSpy();
    vi.advanceTimersByTime(1000);
    expect(isScrollSpySuppressed()).toBe(false);
  });
});
