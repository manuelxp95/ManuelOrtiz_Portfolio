// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { experience, projects } from "@/content";
import { SECTION_IDS } from "@/domain/types";
import { RogueBoard } from "@/features/rogue/RogueBoard";
import {
  consumePendingModeFocus,
  switchMode,
  usePortfolioStore,
} from "@/state/portfolio-store";
import {
  installDialog,
  installMatchMedia,
  setReducedMotion,
} from "@/test/browser-polyfills";

beforeAll(() => {
  installMatchMedia();
  installDialog();
});

beforeEach(() => {
  window.history.replaceState(null, "", "/");
  usePortfolioStore.setState({ mode: "rogue", activeSection: "about" });
  consumePendingModeFocus();
  setReducedMotion(false);
});

afterEach(cleanup);

const card = (id: string) =>
  document.getElementById(`card-${id}`) as HTMLButtonElement;
const openDialog = () =>
  document.querySelector<HTMLDialogElement>("dialog[open]");

describe("Card Mode board", () => {
  it("renders every section as a card button, in registry order", () => {
    render(<RogueBoard />);
    const hand = screen.getByRole("list", { name: "Sections" });
    const ids = [...hand.querySelectorAll("button")].map((button) => button.id);
    expect(ids).toEqual(SECTION_IDS.map((id) => `card-${id}`));
    expect(card("about").getAttribute("aria-current")).toBe("true");
    expect(card("about").textContent).toContain("SELECTED");
    expect(card("skills").getAttribute("aria-current")).toBeNull();
  });

  it.each([
    ["Enter", "{Enter}"],
    ["Space", " "],
  ])(
    "%s opens the focused card and selects its section",
    async (_key, keys) => {
      const user = userEvent.setup();
      render(<RogueBoard />);
      card("experience").focus();
      await user.keyboard(keys);

      const dialog = await screen.findByRole("dialog", { name: /experience/i });
      expect(dialog.hasAttribute("open")).toBe(true);
      expect(usePortfolioStore.getState().activeSection).toBe("experience");
      expect(window.location.hash).toBe("#experience");
    },
  );

  it("Escape closes the card and focus returns to it", async () => {
    const user = userEvent.setup();
    render(<RogueBoard />);
    await user.click(card("skills"));
    await waitFor(() => expect(openDialog()).not.toBeNull());

    await user.keyboard("{Escape}");
    await waitFor(() => expect(openDialog()).toBeNull());
    expect(document.activeElement).toBe(card("skills"));
    expect(card("skills").getAttribute("aria-current")).toBe("true");
  });

  it("the close button and a backdrop click both close", async () => {
    const user = userEvent.setup();
    render(<RogueBoard />);
    await user.click(card("contact"));
    await user.click(await screen.findByRole("button", { name: /close/i }));
    await waitFor(() => expect(openDialog()).toBeNull());

    await user.click(card("contact"));
    await waitFor(() => expect(openDialog()).not.toBeNull());
    fireEvent.click(openDialog()!);
    await waitFor(() => expect(openDialog()).toBeNull());
  });

  it("animates closing, but closes at once under reduced motion", async () => {
    const user = userEvent.setup();
    render(<RogueBoard />);
    await user.click(card("cv"));
    await user.keyboard("{Escape}");
    expect(document.querySelector("dialog")?.dataset.state).toBe("closing");
    await waitFor(() => expect(openDialog()).toBeNull());

    setReducedMotion(true);
    cleanup();
    render(<RogueBoard />);
    await user.click(card("cv"));
    await user.keyboard("{Escape}");
    expect(document.querySelector("dialog")?.dataset.state).toBe("idle");
    expect(openDialog()).toBeNull();
  });

  it("shows the same content Classic renders", async () => {
    const user = userEvent.setup();
    render(<RogueBoard />);
    await user.click(card("experience"));
    const dialog = await screen.findByRole("dialog", { name: /experience/i });
    for (const entry of experience)
      expect(dialog.textContent).toContain(entry.summary);

    await user.keyboard("{Escape}");
    await waitFor(() => expect(openDialog()).toBeNull());
    await user.click(card("projects"));
    const projectsDialog = await screen.findByRole("dialog", {
      name: /projects/i,
    });
    for (const project of projects) {
      expect(projectsDialog.textContent).toContain(project.name);
    }
  });

  it("opens the card from a deep link on page load", async () => {
    window.history.replaceState(null, "", "/#cv");
    usePortfolioStore.setState({ activeSection: "cv" });
    render(<RogueBoard />);
    expect(await screen.findByRole("dialog", { name: /cv/i })).toBeTruthy();
  });

  it("after a user mode switch, focuses the selected card instead of opening it", () => {
    window.history.replaceState(null, "", "/#projects");
    usePortfolioStore.setState({ activeSection: "projects" });
    switchMode("rogue");
    render(<RogueBoard />);
    expect(openDialog()).toBeNull();
    expect(document.activeElement).toBe(card("projects"));
  });

  it("with drag wired, a press that moves less than the threshold still opens the card", async () => {
    render(<RogueBoard />);
    const target = card("education");
    fireEvent.mouseDown(target, { button: 0, clientX: 10, clientY: 10 });
    fireEvent.mouseMove(document, { clientX: 14, clientY: 12 });
    fireEvent.mouseUp(document, { clientX: 14, clientY: 12 });
    fireEvent.click(target);
    expect(
      await screen.findByRole("dialog", { name: /education/i }),
    ).toBeTruthy();
  });

  it("keeps the play zone out of the accessibility tree", () => {
    render(<RogueBoard />);
    const zone = document.querySelector(".play-zone");
    expect(zone?.getAttribute("aria-hidden")).toBe("true");
    expect(card("skills").getAttribute("aria-roledescription")).toBeNull();
  });

  it("the open card follows back/forward navigation", async () => {
    const user = userEvent.setup();
    render(<RogueBoard />);
    await user.click(card("skills"));
    await screen.findByRole("dialog", { name: /skills/i });

    act(() => usePortfolioStore.setState({ activeSection: "education" }));
    expect(
      await screen.findByRole("dialog", { name: /education/i }),
    ).toBeTruthy();
  });
});
