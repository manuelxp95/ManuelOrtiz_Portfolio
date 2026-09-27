/**
 * Roguelike upgrades (Roadmap P9.7, ADR-012). Every two rounds (the hero's turn, then the bug's)
 * the fight pauses and offers three random modifiers; the picked one stacks for the rest of the
 * fight. A modifier is data: stats it adds once per stack, and/or a one-off effect when picked.
 * Adding one is a single entry in `modifiers`; a new kind of effect adds a field to `HeroStats`
 * and the one line of `battle.ts` that reads it.
 */
export interface HeroStats {
  /** Every card's damage is multiplied by this. */
  damageMultiplier: number;
  /** Chance an attack card strikes one more time. */
  extraHitChance: number;
  /** Chance a card's damage is doubled. */
  critChance: number;
  /** Chance to avoid a bug attack outright. */
  dodgeChance: number;
  /** Damage the bug takes whenever it attacks. */
  thorns: number;
  /** Share of card damage the hero heals. */
  lifesteal: number;
  /** Block gained at the start of each hero turn. */
  turnBlock: number;
  /** Added to the hero's maximum HP. */
  maxHp: number;
  /** Added to the cards the hero plays per turn. */
  actions: number;
}

export const BASE_STATS: HeroStats = {
  damageMultiplier: 1,
  extraHitChance: 0,
  critChance: 0,
  dodgeChance: 0,
  thorns: 0,
  lifesteal: 0,
  turnBlock: 0,
  maxHp: 0,
  actions: 0,
};

/** What a one-off effect may change. */
export interface Vitals {
  heroHp: number;
  block: number;
}

export type Rarity = "common" | "rare";

export interface ModifierDef {
  name: string;
  /** What one pick does, on its card. */
  text: string;
  rarity: Rarity;
  /** Never offered again once held this many times. */
  maxStacks?: number;
  /** Added to the hero's stats once per stack. */
  stats?: Partial<HeroStats>;
  /** One-off effect when picked, applied after the stack is counted. */
  onPick?: (vitals: Vitals, stats: HeroStats) => Vitals;
  /** Status chip for a held modifier; one-off modifiers have none. */
  badge?: (stacks: number) => string;
}

const percent = (value: number) => `${Math.round(value * 100)}%`;

export const modifiers = {
  refactor: {
    name: "Refactor",
    text: "+0.5× damage on every card, for good",
    rarity: "rare",
    stats: { damageMultiplier: 0.5 },
    badge: (stacks) => `Dmg ×${1 + stacks * 0.5}`,
  },
  "coffee-break": {
    name: "Coffee Break",
    text: "Heal 25% of your max HP",
    rarity: "common",
    onPick: (vitals, stats) => ({
      ...vitals,
      heroHp: Math.min(
        stats.maxHp,
        vitals.heroHp + Math.round(stats.maxHp * 0.25),
      ),
    }),
  },
  multithreading: {
    name: "Multithreading",
    text: "+10% chance an attack strikes once more",
    rarity: "common",
    maxStacks: 5,
    stats: { extraHitChance: 0.1 },
    badge: (stacks) => `+1 hit ${percent(stacks * 0.1)}`,
  },
  "edge-case": {
    name: "Edge Case",
    text: "+10% critical chance (critical hits deal ×2)",
    rarity: "common",
    maxStacks: 5,
    stats: { critChance: 0.1 },
    badge: (stacks) => `Crit ${percent(stacks * 0.1)}`,
  },
  "rubber-duck": {
    name: "Rubber Duck",
    text: "+10% chance to dodge the bug's attacks",
    rarity: "common",
    maxStacks: 5,
    stats: { dodgeChance: 0.1 },
    badge: (stacks) => `Evade ${percent(stacks * 0.1)}`,
  },
  "unit-tests": {
    name: "Unit Tests",
    text: "Start each turn with +3 Block",
    rarity: "common",
    stats: { turnBlock: 3 },
    badge: (stacks) => `+${stacks * 3} Block/turn`,
  },
  linter: {
    name: "Linter",
    text: "The bug takes 3 damage whenever it attacks",
    rarity: "common",
    stats: { thorns: 3 },
    badge: (stacks) => `Thorns ${stacks * 3}`,
  },
  "garbage-collector": {
    name: "Garbage Collector",
    text: "Heal 15% of the damage your cards deal",
    rarity: "common",
    maxStacks: 3,
    stats: { lifesteal: 0.15 },
    badge: (stacks) => `Leech ${percent(stacks * 0.15)}`,
  },
  scalability: {
    name: "Scalability",
    text: "+10 max HP, and heal 10",
    rarity: "common",
    stats: { maxHp: 10 },
    onPick: (vitals, stats) => ({
      ...vitals,
      heroHp: Math.min(stats.maxHp, vitals.heroHp + 10),
    }),
    badge: (stacks) => `+${stacks * 10} max HP`,
  },
  "pair-programming": {
    name: "Pair Programming",
    text: "Play one more card each turn",
    rarity: "rare",
    maxStacks: 1,
    stats: { actions: 1 },
    badge: () => "+1 action",
  },
} satisfies Record<string, ModifierDef>;

export type ModifierId = keyof typeof modifiers;
/** How many times each modifier was picked this fight. */
export type Stacks = Partial<Record<ModifierId, number>>;

export const modifierIds = Object.keys(modifiers) as ModifierId[];

export const modifier = (id: ModifierId): ModifierDef => modifiers[id];

/** Rounds (hero turn + bug turn) between two offers. */
export const REWARD_EVERY = 2;
export const OFFER_SIZE = 3;
const RARITY_WEIGHT: Record<Rarity, number> = { common: 3, rare: 1 };

/**
 * The hero's stats: the base plus every held stack. `maxHp` is the full maximum, not the bonus,
 * given the base maximum HP.
 */
export function heroStats(stacks: Stacks, baseMaxHp: number): HeroStats {
  const stats = { ...BASE_STATS, maxHp: baseMaxHp };
  for (const id of modifierIds) {
    const count = stacks[id] ?? 0;
    const added = modifier(id).stats;
    if (!count || !added) continue;
    for (const key of Object.keys(added) as (keyof HeroStats)[])
      stats[key] += (added[key] ?? 0) * count;
  }
  return stats;
}

/** Up to three distinct modifiers, weighted by rarity, skipping maxed ones. */
export function drawOffer(stacks: Stacks, roll: () => number): ModifierId[] {
  let pool = modifierIds.filter(
    (id) => (stacks[id] ?? 0) < (modifier(id).maxStacks ?? Infinity),
  );
  const offer: ModifierId[] = [];
  while (offer.length < OFFER_SIZE && pool.length > 0) {
    const total = pool.reduce(
      (sum, id) => sum + RARITY_WEIGHT[modifier(id).rarity],
      0,
    );
    let pick = roll() * total;
    const chosen =
      pool.find((id) => (pick -= RARITY_WEIGHT[modifier(id).rarity]) < 0) ??
      pool[pool.length - 1];
    offer.push(chosen);
    pool = pool.filter((id) => id !== chosen);
  }
  return offer;
}
