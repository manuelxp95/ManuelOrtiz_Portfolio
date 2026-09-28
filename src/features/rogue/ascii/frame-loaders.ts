import type { SectionId } from "@/domain/types";
import type { AsciiModelId } from "./scenes";

type FrameModule = Promise<{ frames: readonly string[] }>;

/** Interaction tier: each card's rotation is its own chunk, fetched only when that card opens. */
export const frameLoaders: Record<SectionId, () => FrameModule> = {
  about: () => import("./frames/about.generated"),
  skills: () => import("./frames/skills.generated"),
  experience: () => import("./frames/experience.generated"),
  projects: () => import("./frames/projects.generated"),
  education: () => import("./frames/education.generated"),
  contact: () => import("./frames/contact.generated"),
  cv: () => import("./frames/cv.generated"),
};

type ModelFrameModule = Promise<{ frames: readonly string[]; frameMs: number }>;

/** Each combatant's animation loop is its own chunk, fetched when the battlefield mounts. */
export const modelFrameLoaders: Record<AsciiModelId, () => ModelFrameModule> = {
  boss: () => import("./frames/boss.generated"),
  hero: () => import("./frames/hero.generated"),
};
