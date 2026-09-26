// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ClassicSections } from "@/components/classic/ClassicSections";
import { SiteHeader } from "@/components/shell/SiteHeader";
import { SECTION_IDS } from "@/domain/types";

function renderPage() {
  return render(
    <>
      <SiteHeader />
      <main id="main">
        <ClassicSections />
      </main>
    </>,
  );
}

afterEach(cleanup);

describe("Classic page", () => {
  it("renders every section as a labelled landmark with its stable id", () => {
    const { container } = renderPage();
    for (const id of SECTION_IDS) {
      const section = container.querySelector(`section#${id}`);
      expect(section, id).not.toBeNull();
      const labelId = section!.getAttribute("aria-labelledby");
      expect(labelId && container.querySelector(`#${labelId}`)).toBeTruthy();
    }
  });

  it("has one h1 and an h2 for every other section", () => {
    renderPage();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(
      SECTION_IDS.length - 1,
    );
  });

  it("section nav links every section, in registry order", () => {
    renderPage();
    const nav = screen.getByRole("navigation", { name: "Sections" });
    const hrefs = within(nav)
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"));
    expect(hrefs).toEqual(SECTION_IDS.map((id) => `#${id}`));
  });

  it("every in-page link points at an existing element", () => {
    const { container } = renderPage();
    const hashLinks =
      container.querySelectorAll<HTMLAnchorElement>('a[href^="#"]');
    expect(hashLinks.length).toBeGreaterThan(0);
    for (const link of hashLinks) {
      const target = link.getAttribute("href")!.slice(1);
      expect(
        container.querySelector(`#${CSS.escape(target)}`),
        target,
      ).not.toBeNull();
    }
  });

  it("new-tab links are safe and announced", () => {
    const { container } = renderPage();
    for (const link of container.querySelectorAll('a[target="_blank"]')) {
      expect(link.getAttribute("rel")).toContain("noopener");
      expect(link.textContent).toContain("(opens in a new tab)");
    }
  });

  it("every image has alt text", () => {
    renderPage();
    for (const img of screen.getAllByRole("img")) {
      expect(img.getAttribute("alt")?.trim()).toBeTruthy();
    }
  });

  it("offers no CV download while no CV is published", () => {
    const { container } = renderPage();
    expect(container.querySelector("a[download]")).toBeNull();
  });
});
