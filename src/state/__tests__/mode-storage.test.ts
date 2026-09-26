// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import {
  applyMode,
  MODE_STORAGE_KEY,
  modeInitScript,
  readStoredMode,
} from "@/state/mode-storage";

beforeEach(() => {
  window.localStorage.clear();
  delete document.documentElement.dataset.mode;
});

describe("mode storage", () => {
  it("reads only valid stored modes", () => {
    expect(readStoredMode()).toBeNull();
    window.localStorage.setItem(MODE_STORAGE_KEY, "rogue");
    expect(readStoredMode()).toBe("rogue");
    window.localStorage.setItem(MODE_STORAGE_KEY, "legacy");
    expect(readStoredMode()).toBeNull();
  });

  it("applyMode persists and reflects the mode on <html>", () => {
    applyMode("rogue");
    expect(window.localStorage.getItem(MODE_STORAGE_KEY)).toBe("rogue");
    expect(document.documentElement.dataset.mode).toBe("rogue");
  });
});

describe("pre-paint script", () => {
  const run = () => new Function(modeInitScript)();

  it("sets data-mode from a stored preference", () => {
    window.localStorage.setItem(MODE_STORAGE_KEY, "rogue");
    run();
    expect(document.documentElement.dataset.mode).toBe("rogue");
  });

  it("ignores missing or invalid values", () => {
    run();
    expect(document.documentElement.dataset.mode).toBeUndefined();
    window.localStorage.setItem(MODE_STORAGE_KEY, "<script>");
    run();
    expect(document.documentElement.dataset.mode).toBeUndefined();
  });
});
