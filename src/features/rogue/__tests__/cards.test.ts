import { describe, expect, it } from "vitest";
import {
  contactLinks,
  education,
  experience,
  projects,
  skillCategoryLabels,
  skills,
} from "@/content";
import { SECTION_IDS } from "@/domain/types";
import {
  allCards,
  cardAction,
  cardElementId,
  cardFace,
  categoryUpgrades,
  projectCards,
  rarityOf,
  sectionOf,
  skillCards,
} from "@/features/rogue/cards";

describe("the deck's cards", () => {
  it("are the seven sections, one card per project and one per skill category", () => {
    const categories = new Set(skills.map((skill) => skill.category));
    expect(allCards).toHaveLength(
      SECTION_IDS.length + projects.length + categories.size,
    );
    expect(new Set(allCards).size).toBe(allCards.length);
    expect(projectCards).toEqual(projects.map((p) => `project:${p.id}`));
    expect(skillCards).toEqual([...categories].map((c) => `skill:${c}`));
  });

  it("open the section their content lives in", () => {
    expect(sectionOf("cv")).toBe("cv");
    expect(sectionOf(projectCards[0])).toBe("projects");
    expect(sectionOf(skillCards[0])).toBe("skills");
    expect(cardElementId(projectCards[0])).toBe(
      `card-project-${projects[0].id}`,
    );
  });

  it("attacks hit the bug; skills and powers act on the hero", () => {
    for (const card of allCards) {
      const action = cardAction(card);
      expect(action.target).toBe(action.type === "attack" ? "bug" : "hero");
      expect(!!action.attack).toBe(action.type === "attack");
      expect(action.tokens.length).toBeGreaterThan(0);
      expect(cardFace(card).title.trim()).not.toBe("");
    }
  });

  it("Projects and Skills draw their own cards from the deck", () => {
    expect(cardAction("projects").draw).toEqual({ from: "project", count: 2 });
    expect(cardAction("skills").draw).toEqual({ from: "skill", count: 2 });
  });

  it("project cards attack harder the rarer the project", () => {
    const damage = (id: string) => cardAction(`project:${id}`).attack!.perHit;
    const byRarity = Object.groupBy(projects, rarityOf);
    const legendary = byRarity.legendary?.[0];
    const common = byRarity.common?.[0];
    expect(legendary && common).toBeTruthy();
    expect(damage(legendary!.id)).toBeGreaterThan(damage(common!.id));
  });

  it("skill cards upgrade the hero: Strength, an extra card, or a shield", () => {
    for (const card of skillCards) {
      const category = card.slice(6) as keyof typeof categoryUpgrades;
      const action = cardAction(card);
      const upgrade = categoryUpgrades[category];
      if (upgrade === "strength") expect(action.strength).toBe(2);
      if (upgrade === "energy") expect(action.energy).toBe(1);
      if (upgrade === "shield")
        expect(action.block).toBe(
          skills.filter((s) => s.category === category).length * 2,
        );
      expect(cardFace(card).title).toBe(skillCategoryLabels[category]);
    }
  });

  it("section cards keep their content-derived numbers", () => {
    expect(cardAction("experience").attack).toEqual({
      hits: experience.length,
      perHit: 4,
    });
    expect(cardAction("education").block).toBe(education.length);
    expect(cardAction("contact").heal).toBe(contactLinks.length * 3);
  });
});
