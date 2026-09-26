import type { SectionMeta } from "./types";

/** Navigation order for both renderers. */
export const sections: readonly SectionMeta[] = [
  {
    id: "about",
    classicLabel: "About",
    cardLabel: "Character Card",
    cardVariant: "character",
    icon: "user",
  },
  {
    id: "skills",
    classicLabel: "Skills",
    cardLabel: "Skill Deck",
    cardVariant: "deck",
    icon: "layers",
  },
  {
    id: "experience",
    classicLabel: "Experience",
    cardLabel: "Quest Map",
    cardVariant: "quest-map",
    icon: "map",
  },
  {
    id: "projects",
    classicLabel: "Projects",
    cardLabel: "Relic Collection",
    cardVariant: "relic-collection",
    icon: "gem",
  },
  {
    id: "education",
    classicLabel: "Education",
    cardLabel: "Codex",
    cardVariant: "codex",
    icon: "book",
  },
  {
    id: "contact",
    classicLabel: "Contact",
    cardLabel: "Merchant",
    cardVariant: "merchant",
    icon: "mail",
  },
  {
    id: "cv",
    classicLabel: "CV",
    cardLabel: "Scroll",
    cardVariant: "scroll",
    icon: "file",
  },
];
