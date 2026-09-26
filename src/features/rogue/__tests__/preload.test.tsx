// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { installDialog, installMatchMedia } from "@/test/browser-polyfills";

beforeAll(() => {
  installMatchMedia();
  installDialog();
});

beforeEach(() => {
  vi.resetModules();
  Object.defineProperty(navigator, "connection", {
    configurable: true,
    value: undefined,
  });
});

afterEach(cleanup);

describe("Card Mode preload", () => {
  it("shares one import between the intent preload and the real load", async () => {
    const preload = await import("@/features/rogue/preload");
    preload.preloadRogueBoard();
    preload.preloadRogueBoard();
    const first = preload.loadRogueBoard();
    expect(preload.loadRogueBoard()).toBe(first);
    const Board = await first;
    expect(Board.name).toBe("RogueBoard");
  });

  it("skips the intent preload when the user asked to save data", async () => {
    Object.defineProperty(navigator, "connection", {
      configurable: true,
      value: { saveData: true },
    });
    const preload = await import("@/features/rogue/preload");
    preload.preloadRogueBoard();
    render(<preload.RogueBoardSlot fallback={<p>loading</p>} />);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    expect(screen.getByText("loading")).toBeTruthy();
  });

  it("renders the fallback until the chunk loads, then the board directly", async () => {
    const preload = await import("@/features/rogue/preload");
    render(<preload.RogueBoardSlot fallback={<p>loading</p>} />);
    expect(screen.getByText("loading")).toBeTruthy();
    await act(async () => {
      await preload.loadRogueBoard();
    });
    expect(document.getElementById("card-board-heading")).not.toBeNull();
    expect(screen.queryByText("loading")).toBeNull();
  });
});
