// @vitest-environment jsdom
import { act, cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { projects } from "@/content";
import { renderAscii } from "@/features/rogue/ascii/renderer";
import { shownAscii } from "@/test/ascii-text";
import {
  INSPECTOR_POSE,
  INSPECTOR_SIZE,
  RELIC_MODELS,
} from "@/features/rogue/ascii/scenes";
import { RelicInspector } from "@/features/rogue/inspector/RelicInspector";
import { CardMotion } from "@/features/rogue/motion-config";
import { ProjectsPanel } from "@/features/rogue/sections/ProjectsPanel";
import { installMatchMedia, setReducedMotion } from "@/test/browser-polyfills";

beforeAll(installMatchMedia);

beforeEach(() => {
  window.history.replaceState(null, "", "/");
  setReducedMotion(true);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const STEP = Math.PI / 12;
const potato = RELIC_MODELS.sopa!;
const artAt = (yaw: number, pitch: number) =>
  renderAscii({ shape: potato.shape, ...INSPECTOR_SIZE, yaw, pitch }).chars;
const shownArt = () =>
  shownAscii(document.querySelector(".relic-inspector-art")!);

describe("relic models", () => {
  it("only name real projects", () => {
    for (const id of Object.keys(RELIC_MODELS))
      expect(projects.some((project) => project.id === id)).toBe(true);
  });

  it("render a full, non-empty grid", () => {
    const rows = artAt(INSPECTOR_POSE.yaw, INSPECTOR_POSE.pitch).split("\n");
    expect(rows).toHaveLength(INSPECTOR_SIZE.rows);
    for (const row of rows) expect(row).toHaveLength(INSPECTOR_SIZE.cols);
    expect(rows.join("").trim().length).toBeGreaterThan(100);
  });
});

describe("relic inspector", () => {
  const renderInspector = () =>
    render(
      <RelicInspector shape={potato.shape} description={potato.description} />,
    );

  it("describes the model and hides the ASCII art", () => {
    renderInspector();
    expect(screen.getByRole("figure").textContent).toContain(
      potato.description,
    );
    expect(
      document
        .querySelector(".relic-inspector-art")
        ?.getAttribute("aria-hidden"),
    ).toBe("true");
  });

  it("turns with buttons and arrow keys, clamps the tilt and resets", async () => {
    const user = userEvent.setup();
    renderInspector();
    const { yaw, pitch } = INSPECTOR_POSE;
    expect(shownArt()).toBe(artAt(yaw, pitch));

    await user.click(screen.getByRole("button", { name: "Turn right" }));
    expect(shownArt()).toBe(artAt(yaw + STEP, pitch));

    await user.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(shownArt()).toBe(artAt(yaw - STEP, pitch));

    const tiltDown = screen.getByRole("button", { name: "Tilt down" });
    for (let press = 0; press < 12; press++) await user.click(tiltDown);
    expect(shownArt()).toBe(artAt(yaw - STEP, 1.2));

    await user.click(screen.getByRole("button", { name: "Reset view" }));
    expect(shownArt()).toBe(artAt(yaw, pitch));
  });

  it("the intro coast stops by itself and nothing runs while idle", () => {
    setReducedMotion(false);
    const queue: FrameRequestCallback[] = [];
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      queue.push(callback);
      return queue.length;
    });
    renderInspector();
    let now = performance.now();
    let frames = 0;
    while (queue.length > 0 && frames < 1000) {
      const callback = queue.shift()!;
      now += 16;
      act(() => callback(now));
      frames++;
    }
    expect(queue).toHaveLength(0);
    expect(frames).toBeGreaterThan(10);
    expect(frames).toBeLessThan(200);
    expect(shownArt()).not.toBe(
      artAt(INSPECTOR_POSE.yaw, INSPECTOR_POSE.pitch),
    );
  });

  it("reduced motion skips the intro coast", () => {
    const raf = vi.spyOn(window, "requestAnimationFrame");
    renderInspector();
    expect(raf).not.toHaveBeenCalled();
  });

  it("unmounting cancels pending frames", () => {
    setReducedMotion(false);
    vi.spyOn(window, "requestAnimationFrame").mockImplementation(() => 7);
    const cancel = vi.spyOn(window, "cancelAnimationFrame");
    const { unmount } = renderInspector();
    unmount();
    expect(cancel).toHaveBeenCalledWith(7);
  });
});

describe("relic model trigger", () => {
  it("only relics with a model offer the 3D view, and it loads on demand", async () => {
    const user = userEvent.setup();
    render(
      <CardMotion>
        <ProjectsPanel />
      </CardMotion>,
    );
    const toggles = screen.queryAllByRole("button", {
      name: /view relic in 3d/i,
      hidden: true,
    });
    expect(toggles).toHaveLength(Object.keys(RELIC_MODELS).length);
    expect(document.querySelector(".relic-inspector")).toBeNull();

    const sopa = projects.find((project) => project.id === "sopa")!;
    await user.click(
      screen.getByRole("button", { name: new RegExp(sopa.name) }),
    );
    const toggle = screen.getByRole("button", { name: /view relic in 3d/i });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    await user.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    const group = await screen.findByRole("group", { name: "Turn the model" });
    expect(within(group).getAllByRole("button")).toHaveLength(5);
  });
});
