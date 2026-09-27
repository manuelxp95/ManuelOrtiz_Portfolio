import {
  contactLinks,
  cv,
  education,
  experience,
  profile,
  projects,
  skillCategoryLabels,
  skills,
} from "@/content";
import { sections } from "@/domain/sections";
import type { Project, SectionId, SkillCategory } from "@/domain/types";

/**
 * Every card of Card Mode's deck (Roadmap P9.4): the seven section cards, one card per project and
 * one upgrade card per skill category, plus golden copies a modifier adds (P9.7). Faces, numbers
 * and tokens derive from the content; the content itself stays in the section panels.
 */
export type ProjectCardId = `project:${string}`;
export type SkillCardId = `skill:${SkillCategory}`;
export type BaseCardId = SectionId | ProjectCardId | SkillCardId;
/** A golden copy of a card: same section, every number of its effect ×1.5 (rounded up). */
export type GoldenCardId = `gold:${BaseCardId}`;
export type CardId = BaseCardId | GoldenCardId;

export const GOLDEN_BOOST = 1.5;

export const isGolden = (card: CardId): card is GoldenCardId =>
  card.startsWith("gold:");

/** The card a golden copy was made from; a plain card is its own base. */
export const baseOf = (card: CardId): BaseCardId =>
  isGolden(card) ? (card.slice("gold:".length) as BaseCardId) : card;

export const goldenOf = (card: BaseCardId): GoldenCardId => `gold:${card}`;

export const isSectionCard = (card: CardId): card is SectionId =>
  !card.includes(":");

/** The section a card opens when played. */
export function sectionOf(card: CardId): SectionId {
  const base = baseOf(card);
  if (base.startsWith("project:")) return "projects";
  if (base.startsWith("skill:")) return "skills";
  return base as SectionId;
}

/** Element id of a card in the hand. */
export const cardElementId = (card: CardId) =>
  `card-${card.replaceAll(":", "-")}`;

export const projectCards: ProjectCardId[] = projects.map(
  (project) => `project:${project.id}` as const,
);

const categories = [...new Set(skills.map((skill) => skill.category))];
export const skillCards: SkillCardId[] = categories.map(
  (category) => `skill:${category}` as const,
);

export const allCards: BaseCardId[] = [
  ...sections.map((section) => section.id),
  ...projectCards,
  ...skillCards,
];

export type Rarity = "legendary" | "rare" | "common";

/** Presentation only: shipped professional work outranks featured work, which outranks the rest. */
export function rarityOf(project: Project): Rarity {
  if (project.context === "professional" || project.impact) return "legendary";
  return project.featured ? "rare" : "common";
}

export const rarityLabels: Record<Rarity, string> = {
  legendary: "Legendary",
  rare: "Rare",
  common: "Common",
};

const rarityDamage: Record<Rarity, number> = {
  legendary: 14,
  rare: 10,
  common: 6,
};

export type Upgrade = "strength" | "energy" | "shield";

/** What each skill category upgrades: hit harder, play more cards this turn, or block. */
export const categoryUpgrades: Record<SkillCategory, Upgrade> = {
  language: "strength",
  backend: "strength",
  engine: "strength",
  frontend: "energy",
  practice: "energy",
  tool: "energy",
  ai: "energy",
  testing: "shield",
  xr: "shield",
};

export type CardType = "attack" | "skill" | "power";
export type Target = "bug" | "hero";

export type EffectKind =
  "summon" | "buff" | "combo" | "burst" | "runes" | "coins" | "scroll";

export interface CardAction {
  type: CardType;
  target: Target;
  kind: EffectKind;
  /** What the card does, shown on the battlefield and on its face. */
  verb: string;
  /** Glyphs or words the effect throws at its target. */
  tokens: string[];
  /** Attacks: hits × (damage per hit + Strength). */
  attack?: { hits: number; perHit: number };
  block?: number;
  heal?: number;
  strength?: number;
  /** Extra cards the hero can play this turn. */
  energy?: number;
  dodge?: boolean;
  /** Pulls cards of this kind from the deck into the hand. */
  draw?: { from: "project" | "skill"; count: number };
}

const sectionActions: Record<SectionId, CardAction> = {
  about: {
    type: "power",
    target: "hero",
    kind: "summon",
    verb: "Dodge the next attack",
    tokens: ["@"],
    dodge: true,
  },
  skills: {
    type: "skill",
    target: "hero",
    kind: "buff",
    verb: "Draw 2 skill cards",
    tokens: skills.slice(0, 6).map((skill) => skill.name),
    draw: { from: "skill", count: 2 },
  },
  experience: {
    type: "attack",
    target: "bug",
    kind: "combo",
    verb: `${experience.length}-hit combo`,
    tokens: experience.map((entry) => String(entry.startYear)),
    attack: { hits: experience.length, perHit: 4 },
  },
  projects: {
    type: "skill",
    target: "hero",
    kind: "burst",
    verb: "Draw 2 project cards",
    tokens: projects.slice(0, 8).map(() => "✦"),
    draw: { from: "project", count: 2 },
  },
  education: {
    type: "skill",
    target: "hero",
    kind: "runes",
    verb: `Block +${education.length}`,
    tokens: education.map((_, index) => (index % 2 ? "◆" : "◇")),
    block: education.length,
  },
  contact: {
    type: "skill",
    target: "hero",
    kind: "coins",
    verb: `Merchant potion: heal ${contactLinks.length * 3}`,
    tokens: [...contactLinks, ...contactLinks].map(() => "$"),
    heal: contactLinks.length * 3,
  },
  cv: {
    type: "attack",
    target: "bug",
    kind: "scroll",
    verb: "Résumé scroll",
    tokens: ["≡", "≡", "≡"],
    attack: { hits: 1, perHit: 15 },
  },
};

const projectById = new Map(projects.map((project) => [project.id, project]));
const projectOf = (card: ProjectCardId) =>
  projectById.get(card.slice("project:".length))!;
const categoryOf = (card: SkillCardId) =>
  card.slice("skill:".length) as SkillCategory;
const skillsIn = (category: SkillCategory) =>
  skills.filter((skill) => skill.category === category);

function upgradeAction(category: SkillCategory): CardAction {
  const names = skillsIn(category).map((skill) => skill.name);
  const upgrade = categoryUpgrades[category];
  const base = { type: "power", target: "hero", tokens: names } as const;
  if (upgrade === "strength")
    return { ...base, kind: "buff", verb: "Strength +2", strength: 2 };
  if (upgrade === "energy")
    return { ...base, kind: "summon", verb: "+1 card this turn", energy: 1 };
  const block = names.length * 2;
  return { ...base, kind: "runes", verb: `Shield: Block +${block}`, block };
}

const boost = (value: number) => Math.ceil(value * GOLDEN_BOOST);

/** A golden card's action: every number of its effect boosted; dodge stays a dodge. */
function goldenAction(action: CardAction): CardAction {
  const golden: CardAction = {
    ...action,
    verb: `★ ${action.verb} ×${GOLDEN_BOOST}`,
  };
  if (action.attack)
    golden.attack = { ...action.attack, perHit: boost(action.attack.perHit) };
  if (action.block) golden.block = boost(action.block);
  if (action.heal) golden.heal = boost(action.heal);
  if (action.strength) golden.strength = boost(action.strength);
  if (action.energy) golden.energy = boost(action.energy);
  if (action.draw)
    golden.draw = { ...action.draw, count: boost(action.draw.count) };
  return golden;
}

export function cardAction(card: CardId): CardAction {
  if (isGolden(card)) return goldenAction(cardAction(baseOf(card)));
  if (isSectionCard(card)) return sectionActions[card];
  if (card.startsWith("project:")) {
    const project = projectOf(card as ProjectCardId);
    return {
      type: "attack",
      target: "bug",
      kind: "burst",
      verb: `${project.name.split(" — ")[0]}: ${rarityLabels[rarityOf(project)].toLowerCase()} hit`,
      tokens: ["✦", "✦", "✦", "✦"],
      attack: { hits: 1, perHit: rarityDamage[rarityOf(project)] },
    };
  }
  return upgradeAction(categoryOf(card as SkillCardId));
}

/** One-line summary per section card, derived from the content. */
const sectionStats: Record<SectionId, string> = {
  about: profile.location.split(",")[0],
  skills: `${skills.length} skills`,
  experience: `${experience.length} roles`,
  projects: `${projects.length} projects`,
  education: `${education.length} entries`,
  contact: `${contactLinks.length} channels`,
  cv: cv ? "PDF ready" : "PDF coming soon",
};

export interface CardFaceData {
  /** Top of the face, and the drag announcements' name. */
  title: string;
  /** Which section's ASCII glyph the face shows. */
  glyph: SectionId;
  label: string;
  stat: string;
}

export function cardFace(card: CardId): CardFaceData {
  if (isGolden(card))
    return {
      ...cardFace(baseOf(card)),
      stat: `★ golden ×${GOLDEN_BOOST}`,
    };
  if (isSectionCard(card)) {
    const meta = sections.find((section) => section.id === card)!;
    return {
      title: meta.cardLabel,
      glyph: card,
      label: meta.classicLabel,
      stat: sectionStats[card],
    };
  }
  if (card.startsWith("project:")) {
    const project = projectOf(card as ProjectCardId);
    return {
      title: project.name.split(" — ")[0],
      glyph: "projects",
      label: rarityLabels[rarityOf(project)],
      stat: `${rarityDamage[rarityOf(project)]} damage`,
    };
  }
  const category = categoryOf(card as SkillCardId);
  return {
    title: skillCategoryLabels[category],
    glyph: "skills",
    label: `${skillsIn(category).length} skills`,
    stat: upgradeAction(category).verb,
  };
}
