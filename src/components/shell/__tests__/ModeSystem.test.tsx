// @vitest-environment jsdom

vi.mock("@/features/rogue/battle", async (importOriginal) =>
  (await import("@/test/card-deal")).dealAllSections(importOriginal),
);
import { cleanup, render, screen, waitFor } from "@testing-library/react";
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
import { MODE_STORAGE_KEY } from "@/state/mode-storage";
import { installDialog, installMatchMedia } from "@/test/browser-polyfills";

const scrollIntoView = vi.fn();

beforeAll(() => {
  installMatchMedia();
  installDialog();
});

beforeEach(() => {
  window.localStorage.clear();
  delete document.documentElement.dataset.mode;
  window.history.replaceState(null, "", "/");
  scrollIntoView.mockClear();
  Element.prototype.scrollIntoView = scrollIntoView;
});

afterEach(cleanup);

/** Simulates a full page load: fresh modules read the URL and storage like a real visit. */
async function loadPage(url: string, storedMode?: "classic" | "rogue") {
  window.history.replaceState(null, "", url);
  if (storedMode) window.localStorage.setItem(MODE_STORAGE_KEY, storedMode);
  vi.resetModules();
  const [{ ModeRoot }, { SiteHeader }, { ClassicSections }, store] =
    await Promise.all([
      import("@/components/shell/ModeRoot"),
      import("@/components/shell/SiteHeader"),
      import("@/components/classic/ClassicSections"),
      import("@/state/portfolio-store"),
    ]);
  const utils = render(
    <>
      <SiteHeader />
      <main>
        <ModeRoot>
          <ClassicSections />
        </ModeRoot>
      </main>
    </>,
  );
  return { ...utils, store: store.usePortfolioStore };
}

const toggle = () => screen.getByRole("button", { name: /card mode/i });
const card = (id: string) => document.getElementById(`card-${id}`);
const classicMounted = () =>
  document.querySelector('[data-renderer="classic"]') !== null;
const boardMounted = () =>
  document.getElementById("card-board-heading") !== null;

function expectSingleRenderer() {
  expect(Number(classicMounted()) + Number(boardMounted())).toBe(1);
}

describe("mode system", () => {
  it("Classic Projects → Card Mode opens with Projects selected and focused", async () => {
    const user = userEvent.setup();
    await loadPage("/#projects");
    expect(classicMounted()).toBe(true);

    await user.click(toggle());

    await waitFor(() => expect(card("projects")).not.toBeNull());
    expect(card("projects")).toHaveProperty("ariaCurrent", "true");
    expect(document.activeElement).toBe(card("projects"));
    expect(document.getElementById("about")).toBeNull();
    expectSingleRenderer();
  });

  it("a card played in Card Mode → Classic scrolls to its section and focuses its heading", async () => {
    const user = userEvent.setup();
    const { store } = await loadPage("/", "rogue");
    // The opening hand is dealt at random from the section cards; play the first one.
    await waitFor(() =>
      expect(document.querySelector(".card-hand .section-card")).not.toBeNull(),
    );
    expect(classicMounted()).toBe(false);
    const first = document.querySelector<HTMLButtonElement>(
      ".card-hand .section-card",
    )!;
    const section = first.id.replace("card-", "");

    const historyLength = window.history.length;
    await user.click(first);
    await waitFor(() =>
      expect(document.querySelector("dialog[open]")).not.toBeNull(),
    );
    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(document.querySelector("dialog[open]")).toBeNull(),
    );
    expect(window.location.hash).toBe(`#${section}`);
    expect(window.history.length).toBe(historyLength + 1);
    expect(store.getState().activeSection).toBe(section);

    await user.click(toggle());

    const target = document.getElementById(section);
    expect(target).not.toBeNull();
    expect(scrollIntoView.mock.contexts).toContain(target);
    expect(document.activeElement).toBe(
      document.getElementById(`${section}-heading`),
    );
    expectSingleRenderer();
  });

  it.each(["classic", "rogue"] as const)(
    "direct load of #projects selects Projects in %s mode",
    async (mode) => {
      const { store } = await loadPage("/#projects", mode);
      expect(store.getState().activeSection).toBe("projects");
      if (mode === "rogue") {
        await waitFor(() =>
          expect(card("projects")).toHaveProperty("ariaCurrent", "true"),
        );
      } else {
        expect(document.getElementById("projects")).not.toBeNull();
      }
      expectSingleRenderer();
    },
  );

  it("stored Card Mode + #contact deep link mounts only the board, Contact selected", async () => {
    await loadPage("/#contact", "rogue");
    await waitFor(() =>
      expect(card("contact")).toHaveProperty("ariaCurrent", "true"),
    );
    expect(classicMounted()).toBe(false);
    expect(document.documentElement.dataset.mode).toBe("rogue");
    // A deep link in Card Mode opens that card directly.
    await waitFor(() =>
      expect(screen.getByRole("dialog", { name: /contact/i })).toBeTruthy(),
    );
    expect(toggle()).toHaveProperty("ariaPressed", "true");
  });

  it("ignores unknown hashes", async () => {
    const { store } = await loadPage("/#nope");
    expect(store.getState().activeSection).toBe("about");
  });

  it("follows hash navigation (anchor clicks, back/forward)", async () => {
    const { store } = await loadPage("/");
    window.location.hash = "#education";
    await waitFor(() =>
      expect(store.getState().activeSection).toBe("education"),
    );
  });

  it("toggle works from the keyboard and persists the choice", async () => {
    const user = userEvent.setup();
    await loadPage("/");
    toggle().focus();

    await user.keyboard("{Enter}");
    await waitFor(() => expect(boardMounted()).toBe(true));
    expect(toggle()).toHaveProperty("ariaPressed", "true");
    expect(window.localStorage.getItem(MODE_STORAGE_KEY)).toBe("rogue");
    expect(document.documentElement.dataset.mode).toBe("rogue");

    toggle().focus();
    await user.keyboard(" ");
    expect(classicMounted()).toBe(true);
    expect(toggle()).toHaveProperty("ariaPressed", "false");
    expect(window.localStorage.getItem(MODE_STORAGE_KEY)).toBe("classic");
  });

  it("round trip Classic → Card → Classic keeps the section and one renderer at a time", async () => {
    const user = userEvent.setup();
    const { store } = await loadPage("/#experience");

    await user.click(toggle());
    await waitFor(() => expect(boardMounted()).toBe(true));
    expectSingleRenderer();
    expect(store.getState().activeSection).toBe("experience");

    await user.click(toggle());
    expectSingleRenderer();
    expect(store.getState().activeSection).toBe("experience");
    expect(window.location.hash).toBe("#experience");
  });
});
