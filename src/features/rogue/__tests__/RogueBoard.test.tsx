// @vitest-environment jsdom
import { vi } from "vitest";

vi.mock("@/features/rogue/battle", async (importOriginal) =>
  (await import("@/test/card-deal")).dealAllSections(importOriginal),
);
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
import { HERO } from "@/features/rogue/battle";
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
  Element.prototype.scrollIntoView = () => {};
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
  it("renders the dealt hand as card buttons", () => {
    render(<RogueBoard />);
    const hand = screen.getByRole("list", { name: "Hand" });
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

  it("Escape closes the card; focus goes to the card now in its slot", async () => {
    const user = userEvent.setup();
    render(<RogueBoard />);
    await user.click(card("skills"));
    await waitFor(() => expect(openDialog()).not.toBeNull());

    await user.keyboard("{Escape}");
    await waitFor(() => expect(openDialog()).toBeNull());
    // The played card went back into the deck; its neighbour slid into its slot.
    expect(card("skills")).toBeNull();
    expect(document.activeElement).toBe(card("experience"));
  });

  it("the close button and a backdrop click both close", async () => {
    const user = userEvent.setup();
    render(<RogueBoard />);
    await user.click(card("contact"));
    await user.click(await screen.findByRole("button", { name: /close/i }));
    await waitFor(() => expect(openDialog()).toBeNull());

    await user.click(card("education"));
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
  const hp = () =>
    document.querySelector('[data-combatant="bug"] .combatant-hp-text')
      ?.textContent;

  it("a click runs an attack's effect on the bug, then opens its dialog", async () => {
    const user = userEvent.setup();
    render(<RogueBoard />);
    expect(hp()).toContain("HP 100/100");

    await user.click(card("experience"));
    expect(openDialog()).toBeNull();
    expect(
      document.querySelector(".battlefield")?.getAttribute("data-playing"),
    ).toBe("experience");
    expect(hp()).toContain("HP 80/100");
    expect(document.querySelector("[aria-live]")?.textContent).toMatch(
      /takes 20 damage, 80 HP left/,
    );

    expect(
      await screen.findByRole("dialog", { name: /experience/i }),
    ).toBeTruthy();
    // Played: back into the deck, replaced in the hand.
    expect(card("experience")).toBeNull();
  });

  it("each combatant keeps a single art once an effect has played", async () => {
    const user = userEvent.setup();
    render(<RogueBoard />);
    await user.click(card("projects"));
    await screen.findByRole("dialog", { name: /projects/i });
    for (const side of ["hero", "bug"])
      expect(
        document.querySelectorAll(`[data-combatant="${side}"] .combatant-art`),
      ).toHaveLength(1);
  });

  it("skill and power cards act on the hero instead of the bug", async () => {
    const user = userEvent.setup();
    render(<RogueBoard />);
    await user.click(card("education"));
    expect(hp()).toContain("HP 100/100");
    const statuses = screen.getByRole("list", {
      name: `${HERO.name}'s statuses`,
    });
    expect(statuses.textContent).toMatch(/Block \d+/);
    expect(document.querySelector("[aria-live]")?.textContent).toMatch(
      /Block \+\d+\. \w+ has 50 HP/,
    );
    await screen.findByRole("dialog", { name: /education/i });
  });

  it("every card names its type and target", () => {
    render(<RogueBoard />);
    expect(card("cv").textContent).toMatch(/attack card, hits/);
    expect(card("projects").textContent).toMatch(/skill card, acts on/);
    expect(card("contact").textContent).toMatch(/skill card, acts on/);
    expect(card("about").textContent).toMatch(/power card, acts on/);
  });

  it("a lifted card aims at its target", async () => {
    render(<RogueBoard />);
    tap("cv");
    expect(
      document
        .querySelector('[data-combatant="bug"]')
        ?.hasAttribute("data-aimed"),
    ).toBe(true);
    tap("skills");
    expect(
      document
        .querySelector('[data-combatant="hero"]')
        ?.hasAttribute("data-aimed"),
    ).toBe(true);
    expect(
      document
        .querySelector('[data-combatant="bug"]')
        ?.hasAttribute("data-aimed"),
    ).toBe(false);
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
    fireEvent.click(card("cv"));
    expect(openDialog()).not.toBeNull();
    expect(hp()).toContain("HP 85/100");
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

  it("a deep link marks the card read without touching the fight", async () => {
    window.history.replaceState(null, "", "/#projects");
    usePortfolioStore.setState({ activeSection: "projects" });
    render(<RogueBoard />);
    await screen.findByRole("dialog", { name: /projects/i });
    expect(hp()).toContain("HP 100/100");
    expect(slot("projects").hasAttribute("data-played")).toBe(true);
  });
});

describe("turns (P9.3)", () => {
  const turnBar = () => document.querySelector(".turn-bar")?.textContent;
  const heroHp = () =>
    document.querySelector('[data-combatant="hero"] .combatant-hp-text')
      ?.textContent;
  const playAndClose = (id: string) => {
    fireEvent.click(card(id));
    fireEvent.click(screen.getByRole("button", { name: /close/i }));
  };

  beforeEach(() => setReducedMotion(true));

  it("announces the bug's intent and counts down the hero's actions", () => {
    render(<RogueBoard />);
    expect(turnBar()).toMatch(/Turn 1 · 2 actions/);
    expect(
      document.querySelector('[data-combatant="bug"] .combatant-intent')
        ?.textContent,
    ).toMatch(/attack 8/);
    playAndClose("skills");
    expect(turnBar()).toMatch(/Turn 1 · 1 action /);
  });

  it("after two cards the bug acts once the dialog is closed, then turn 2 starts", async () => {
    render(<RogueBoard />);
    playAndClose("skills");
    fireEvent.click(card("cv"));
    expect(heroHp()).toContain("HP 50/50");
    fireEvent.click(screen.getByRole("button", { name: /close/i }));

    await waitFor(() => expect(heroHp()).toContain("HP 42/50"));
    expect(document.querySelector("[aria-live]")?.textContent).toMatch(
      /attacks: 8 damage/,
    );
    await waitFor(() => expect(turnBar()).toMatch(/Turn 2 · 2 actions/));
    expect(
      document.querySelector('[data-combatant="bug"] .combatant-intent')
        ?.textContent,
    ).toMatch(/charge/);
  });

  it("playing a card while the bug's turn is due settles it first", () => {
    render(<RogueBoard />);
    playAndClose("skills");
    playAndClose("about");
    fireEvent.click(card("experience"));
    expect(turnBar()).toMatch(/Turn 2 · 1 action /);
    expect(heroHp()).toContain("HP 50/50");
    expect(
      document.querySelector('[data-combatant="hero"] .combatant-statuses')
        ?.textContent,
    ).not.toContain("Dodge");
  });
});

describe("the deck (P9.4)", () => {
  const handIds = () =>
    [
      ...screen.getByRole("list", { name: "Hand" }).querySelectorAll("button"),
    ].map((button) => button.id);
  const deckCount = () =>
    Number(
      screen
        .getByRole("img", { name: /^Deck:/ })
        .getAttribute("aria-label")!
        .match(/\d+/)![0],
    );

  beforeEach(() => setReducedMotion(true));

  it("Projects pulls project cards into the hand, and one opens its relic", async () => {
    render(<RogueBoard />);
    const before = deckCount();
    fireEvent.click(card("projects"));
    fireEvent.click(screen.getByRole("button", { name: /close/i }));

    const projectIds = handIds().filter((id) => id.startsWith("card-project-"));
    expect(projectIds).toHaveLength(1);
    // Projects went back into the deck, one project card came out (hand capped at 7).
    expect(deckCount()).toBe(before);

    const id = projectIds[0].replace("card-project-", "");
    fireEvent.click(document.getElementById(projectIds[0])!);
    expect(window.location.hash).toBe(`#project-${id}`);
    const dialog = await screen.findByRole("dialog", { name: /projects/i });
    await waitFor(() =>
      expect(
        dialog
          .querySelector(`#relic-${id} button`)
          ?.getAttribute("aria-expanded"),
      ).toBe("true"),
    );
  });

  it("the deck is shown beside the hand with its size", () => {
    render(<RogueBoard />);
    const pile = screen.getByRole("img", { name: /^Deck: \d+ cards$/ });
    expect(pile.textContent).toBe(String(deckCount()));
    expect(pile.nextElementSibling).toBe(
      screen.getByRole("list", { name: "Hand" }),
    );
  });

  it("drawn cards join the hand visible, even without an animation API", async () => {
    setReducedMotion(false);
    render(<RogueBoard />);
    // Seven in hand: three plays bring it under five, so it draws from the deck.
    for (const id of ["cv", "experience", "about"]) {
      fireEvent.click(card(id));
      // Skip the effect (tap on the battlefield), then close the card.
      fireEvent.click(document.querySelector(".battlefield")!);
      fireEvent.click(await screen.findByRole("button", { name: /close/i }));
      await waitFor(() => expect(openDialog()).toBeNull());
    }
    // Down to four, one card was drawn back to five (maybe a section just shuffled back in).
    const hand = handIds();
    expect(hand).toHaveLength(5);
    for (const id of hand)
      expect(
        document.getElementById(id)!.closest<HTMLElement>(".card-fan > div")!
          .style.opacity,
      ).not.toBe("0");
  });
});
