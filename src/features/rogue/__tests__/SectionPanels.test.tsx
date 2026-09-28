// @vitest-environment jsdom
import { vi } from "vitest";

vi.mock("@/features/rogue/battle", async (importOriginal) =>
  (await import("@/test/card-deal")).dealAllSections(importOriginal),
);
vi.mock("@/features/rogue/ascii/frames/boss.generated", async () =>
  (await import("@/test/boss-frames")).stillBoss(),
);
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { contactLinks, cv, experience, projects } from "@/content";
import { RogueBoard } from "@/features/rogue/RogueBoard";
import { CardMotion } from "@/features/rogue/motion-config";
import { ContactPanel } from "@/features/rogue/sections/ContactPanel";
import { ExperiencePanel } from "@/features/rogue/sections/ExperiencePanel";
import { ProjectsPanel } from "@/features/rogue/sections/ProjectsPanel";
import { usePortfolioStore } from "@/state/portfolio-store";
import {
  installDialog,
  installMatchMedia,
  setReducedMotion,
} from "@/test/browser-polyfills";

beforeAll(() => {
  installMatchMedia();
  installDialog();
  Element.prototype.scrollIntoView = () => {};
});

beforeEach(() => {
  window.history.replaceState(null, "", "/");
  usePortfolioStore.setState({ mode: "rogue", activeSection: "about" });
  setReducedMotion(false);
});

afterEach(cleanup);

const withMotion = (panel: ReactNode) =>
  render(<CardMotion>{panel}</CardMotion>);
const toggle = (name: string) =>
  screen.getByRole("button", { name: new RegExp(escape(name)) });
const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const detailOf = (button: HTMLElement) =>
  document.getElementById(button.getAttribute("aria-controls")!)!;

describe("Projects panel (relic collection)", () => {
  it("lists every project as a collapsed relic under a heading", () => {
    withMotion(<ProjectsPanel />);
    const relics = within(screen.getByRole("list", { name: "Projects" }))
      .getAllByRole("heading", { level: 3 })
      .map((heading) => within(heading).getByRole("button"));
    expect(relics).toHaveLength(projects.length);
    for (const relic of relics) {
      expect(relic.getAttribute("aria-expanded")).toBe("false");
      expect(detailOf(relic).hidden).toBe(true);
    }
  });

  it("states rarity as text, not only color", () => {
    withMotion(<ProjectsPanel />);
    expect(toggle(projects[0].name).textContent).toMatch(
      /Legendary|Rare|Common/,
    );
  });

  it("keyboard opens one relic at a time with its full record", async () => {
    const user = userEvent.setup();
    withMotion(<ProjectsPanel />);
    const [first, second] = projects;

    toggle(first.name).focus();
    await user.keyboard("{Enter}");
    expect(toggle(first.name).getAttribute("aria-expanded")).toBe("true");
    const detail = detailOf(toggle(first.name));
    expect(detail.hidden).toBe(false);
    expect(detail.textContent).toContain(first.description);
    for (const link of first.links)
      expect(
        within(detail)
          .getByRole("link", { name: new RegExp(escape(link.label)) })
          .getAttribute("href"),
      ).toBe(link.url);

    await user.click(toggle(second.name));
    expect(toggle(first.name).getAttribute("aria-expanded")).toBe("false");
    expect(toggle(second.name).getAttribute("aria-expanded")).toBe("true");

    await user.click(toggle(second.name));
    expect(toggle(second.name).getAttribute("aria-expanded")).toBe("false");
  });

  it("opens and focuses the relic named by a #project-<id> link", () => {
    const target = projects[3];
    window.history.replaceState(null, "", `/#project-${target.id}`);
    withMotion(<ProjectsPanel />);
    expect(toggle(target.name).getAttribute("aria-expanded")).toBe("true");
    expect(document.activeElement).toBe(toggle(target.name));
  });
});

describe("Experience panel (quest path)", () => {
  it("is an ordered list of every role, with the ongoing one open", () => {
    withMotion(<ExperiencePanel />);
    const path = screen.getByRole("list", { name: /career path/i });
    expect(path.tagName).toBe("OL");
    const nodes = within(path).getAllByRole("heading", { level: 3 });
    expect(nodes).toHaveLength(experience.length);

    for (const entry of experience) {
      const button = toggle(entry.role);
      const ongoing = entry.endYear === undefined;
      expect(button.getAttribute("aria-expanded")).toBe(String(ongoing));
      expect(button.textContent).toContain(
        ongoing ? "Current quest" : "Quest complete",
      );
      // Collapsed details stay in the DOM (hidden), so the content is always there.
      expect(detailOf(button).textContent).toContain(entry.summary);
    }
  });

  it("nodes open and close independently from the keyboard", async () => {
    const user = userEvent.setup();
    withMotion(<ExperiencePanel />);
    const closed = experience.filter((entry) => entry.endYear !== undefined);
    const [a, b] = closed;

    toggle(a.role).focus();
    await user.keyboard("{Enter}");
    await user.keyboard("{Tab}");
    expect(document.activeElement).toBe(toggle(b.role));
    await user.keyboard(" ");
    expect(detailOf(toggle(a.role)).hidden).toBe(false);
    expect(detailOf(toggle(b.role)).hidden).toBe(false);

    await user.click(toggle(a.role));
    expect(detailOf(toggle(a.role)).hidden).toBe(true);
    expect(detailOf(toggle(b.role)).hidden).toBe(false);
  });

  it("links related projects to their relic", () => {
    withMotion(<ExperiencePanel />);
    const entry = experience.find((item) => item.projectIds.length > 0)!;
    const project = projects.find((item) => item.id === entry.projectIds[0])!;
    const link = within(detailOf(toggle(entry.role))).getByRole("link", {
      name: project.name,
      hidden: true,
    });
    expect(link.getAttribute("href")).toBe(`#project-${project.id}`);
  });
});

describe("Contact panel (merchant)", () => {
  it("every offer is a real link named by its action", () => {
    withMotion(<ContactPanel />);
    const offers = within(
      screen.getByRole("list", { name: "Contact options" }),
    ).getAllByRole("link");
    expect(offers.map((offer) => offer.getAttribute("href"))).toEqual([
      ...contactLinks.map((link) => link.href),
      ...(cv ? [cv.href] : []),
    ]);
    const email = screen.getByRole("link", { name: /^send an email/i });
    expect(email.getAttribute("href")).toMatch(/^mailto:/);
    expect(email.getAttribute("target")).toBeNull();
    const github = screen.getByRole("link", { name: /github/i });
    expect(github.getAttribute("target")).toBe("_blank");
    expect(github.textContent).toContain("(opens in a new tab)");
  });

  it("the decorative price tag is hidden from assistive tech", () => {
    withMotion(<ContactPanel />);
    for (const price of document.querySelectorAll(".offer-price"))
      expect(price.getAttribute("aria-hidden")).toBe("true");
  });
});

describe("Panels inside Card Mode", () => {
  it.each([
    ["projects", "Projects"],
    ["experience", /career path/i],
    ["contact", "Contact options"],
  ] as const)("opening the %s card loads its panel", async (id, list) => {
    const user = userEvent.setup();
    render(<RogueBoard />);
    await user.click(document.getElementById(`card-${id}`)!);
    const dialog = await screen.findByRole("dialog");
    expect(
      await within(dialog).findByRole("list", { name: list }),
    ).toBeTruthy();
  });

  it("entrances start visible under reduced motion", () => {
    setReducedMotion(true);
    withMotion(<ContactPanel />);
    for (const item of screen
      .getByRole("list", { name: "Contact options" })
      .querySelectorAll("li"))
      expect(item.style.opacity).not.toBe("0");
  });

  it("entrances animate in without reduced motion", () => {
    withMotion(<ContactPanel />);
    const first = screen
      .getByRole("list", { name: "Contact options" })
      .querySelector("li")!;
    expect(first.style.opacity).toBe("0");
  });
});
