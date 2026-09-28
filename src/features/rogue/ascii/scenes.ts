import type { SectionId } from "@/domain/types";
import type { AsciiShape } from "./renderer";

/** One original ASCII object per Card Mode card. Input to scripts/ascii/generate.mts. */
export const ASCII_SCENES: Record<SectionId, AsciiShape> = {
  about: "sphere",
  skills: "box",
  experience: "torus",
  projects: "octahedron",
  education: "book",
  contact: "coin",
  cv: "scroll",
};

export const GLYPH_SIZE = { cols: 20, rows: 9 } as const;
export const GLYPH_POSE = { yaw: 0.6, pitch: 0.45 } as const;

export const ANIMATION_SIZE = { cols: 36, rows: 16 } as const;
export const ANIMATION_FRAMES = 36;
export const ANIMATION_PITCH = 0.45;

export function animationYaw(frame: number): number {
  return GLYPH_POSE.yaw + (frame / ANIMATION_FRAMES) * Math.PI * 2;
}

/**
 * Project relics that can be turned in 3D (Roadmap P8), rendered in the browser on each input.
 * Keyed by project id; `description` is the text alternative of the model.
 */
export const RELIC_MODELS: Partial<
  Record<string, { shape: AsciiShape; description: string }>
> = {
  sopa: {
    shape: "potato",
    description: "a lumpy potato, the stolen treasure of SOPA",
  },
};

export const INSPECTOR_SIZE = { cols: 44, rows: 18 } as const;
export const INSPECTOR_POSE = { yaw: 0.6, pitch: 0.35 } as const;

/**
 * The boss (Roadmap P9.8): a skinned glTF model turned into ASCII at build time by
 * scripts/ascii/boss.mts. The model stays in the git-ignored `resources/` folder; its CC BY 4.0
 * credit is shown in Card Mode.
 */
export const BOSS_MODEL = {
  path: "resources/boss_v1/scene.gltf",
  title: "Boppin' Ariados",
  author: "zcythe",
  url: "https://sketchfab.com/3d-models/boppin-ariados-d3d9fed0764743a8a4c7b884f801812d",
  license: "CC BY 4.0",
  licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
  /** How bright each material reads (0..1); materials left out are not drawn. */
  albedo: {
    MAT_Main: 1,
    Limbs: 0.75,
    Horns: 0.55,
    Sclera: 1,
    pupil: 0,
  },
} as const;

export const BOSS_SIZE = { cols: 48, rows: 20 } as const;
/** Three-quarter view from above: the model faces +z, so this turns its head toward the hero (left). */
export const BOSS_VIEW = { yaw: -2.2, pitch: 0.55 } as const;
export const BOSS_ANIMATION_FRAMES = 24;
/** Playback speed of the model's animation (1 = as authored). */
export const BOSS_ANIMATION_SPEED = 0.75;
