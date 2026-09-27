// @vitest-environment jsdom
import {
  act,
  cleanup,
  configure,
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
  // A played card runs its effect (EFFECT_MS) before its dialog opens.
  configure({ asyncUtilTimeout: 3000 });
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
    await waitFor(() => expect(openDialog()).not.toBeNull());
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

  it("keeps drag ARIA off the card buttons", () => {
    render(<RogueBoard />);
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

describe("playing cards on the battlefield (P9.1)", () => {
  const slot = (id: string) => card(id).closest("li")!;
  const tap = (id: string) => {
    fireEvent.pointerDown(card(id), { pointerType: "touch", clientY: 300 });
    fireEvent.pointerUp(card(id), { pointerType: "touch", clientY: 300 });
    fireEvent.click(card(id), { detail: 1 });
  };
  const hp = () => document.querySelector(".bug-hp-text")?.textContent;

  it("a click runs the card's effect on the bug, then opens its dialog", async () => {
    const user = userEvent.setup();
    render(<RogueBoard />);
    expect(hp()).toContain("HP 100/100");

    await user.click(card("skills"));
    expect(openDialog()).toBeNull();
    expect(
      document.querySelector(".battlefield")?.getAttribute("data-playing"),
    ).toBe("skills");
    expect(hp()).toContain("HP 80/100");
    expect(document.querySelector("[aria-live]")?.textContent).toMatch(
      /takes 20 damage, 80 HP left/,
    );

    expect(await screen.findByRole("dialog", { name: /skills/i })).toBeTruthy();
    expect(slot("skills").hasAttribute("data-played")).toBe(true);
  });

  it("a tap on the battlefield or Escape skips the effect", async () => {
    const user = userEvent.setup();
    render(<RogueBoard />);
    await user.click(card("projects"));
    fireEvent.click(document.querySelector(".battlefield")!);
    expect(openDialog()).not.toBeNull();

    await user.keyboard("{Escape}");
    await waitFor(() => expect(openDialog()).toBeNull());
    await user.click(card("cv"));
    await user.keyboard("{Escape}");
    expect(openDialog()).not.toBeNull();
  });

  it("a finger tap lifts the card; a second tap plays it", async () => {
    render(<RogueBoard />);
    tap("experience");
    expect(slot("experience").hasAttribute("data-inspecting")).toBe(true);
    expect(
      document.querySelector(".battlefield")?.hasAttribute("data-playing"),
    ).toBe(false);

    tap("contact");
    expect(slot("experience").hasAttribute("data-inspecting")).toBe(false);
    expect(slot("contact").hasAttribute("data-inspecting")).toBe(true);

    tap("contact");
    expect(
      await screen.findByRole("dialog", { name: /contact/i }),
    ).toBeTruthy();
  });

  it("a tap outside drops a lifted card; a tap on the battlefield plays it", async () => {
    render(<RogueBoard />);
    tap("skills");
    fireEvent.pointerDown(screen.getByRole("heading", { level: 1 }));
    expect(slot("skills").hasAttribute("data-inspecting")).toBe(false);

    tap("skills");
    fireEvent.click(document.querySelector(".battlefield")!);
    expect(await screen.findByRole("dialog", { name: /skills/i })).toBeTruthy();
  });

  it("a finger swipe up plays the card straight away", async () => {
    render(<RogueBoard />);
    fireEvent.pointerDown(card("education"), {
      pointerType: "touch",
      clientY: 300,
    });
    fireEvent.pointerUp(card("education"), {
      pointerType: "touch",
      clientY: 200,
    });
    fireEvent.click(card("education"), { detail: 1 });
    expect(
      document.querySelector(".battlefield")?.getAttribute("data-playing"),
    ).toBe("education");
    expect(
      await screen.findByRole("dialog", { name: /education/i }),
    ).toBeTruthy();
  });

  it("reduced motion opens the dialog at once and still scores the hit", () => {
    setReducedMotion(true);
    render(<RogueBoard />);
    fireEvent.click(card("about"));
    expect(openDialog()).not.toBeNull();
    expect(hp()).toContain("HP 90/100");
  });

  it("Left/Right arrows move along the hand", async () => {
    const user = userEvent.setup();
    render(<RogueBoard />);
    card("about").focus();
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(card("skills"));
    await user.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(document.activeElement).toBe(card("cv"));
  });

  it("a deep link counts as played", async () => {
    window.history.replaceState(null, "", "/#education");
    usePortfolioStore.setState({ activeSection: "education" });
    render(<RogueBoard />);
    await screen.findByRole("dialog", { name: /education/i });
    expect(hp()).toContain("HP 90/100");
  });
});
