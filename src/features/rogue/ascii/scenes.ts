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
