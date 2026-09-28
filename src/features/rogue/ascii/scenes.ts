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
 * The combatants (Roadmap P9.8 boss, P9.9 hero): skinned glTF models turned into ASCII at build time
 * by scripts/ascii/models.mts. The models stay in the git-ignored `resources/` folder; their CC BY
 * 4.0 credits are shown in Card Mode.
 */
export interface AsciiModel {
  /** glTF source, relative to the repository root. */
  path: string;
  credit: {
    title: string;
    author: string;
    url: string;
    license: string;
    licenseUrl: string;
  };
  /** How bright each material reads (0..1); materials left out are not drawn. */
  albedo: Readonly<Record<string, number>>;
  size: { cols: number; rows: number };
  /** Positive pitch = seen from above. A model facing +z looks left at yaw ≈ −2.2, right at ≈ 2.2. */
  view: { yaw: number; pitch: number };
  /** Frames rendered from one loop of the model's animation. */
  frames: number;
  /** Playback speed of the animation (1 = as authored). */
  speed: number;
  /** Roll of the defeated pose around the view axis, radians. */
  defeatedRoll: number;
  /**
   * Mesh name → node whose inverse matrix brings that mesh's vertices into the skin's bind space.
   * For exports whose meshes were bound in different spaces (a mesh renders at the wrong scale).
   */
  bindShape?: Readonly<Record<string, number>>;
}

const CC_BY = {
  license: "CC BY 4.0",
  licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
} as const;

export const ASCII_MODELS = {
  /** Three-quarter from above, head toward the hero; defeated legs up. */
  boss: {
    path: "resources/boss_v1/scene.gltf",
    credit: {
      title: "Boppin' Ariados",
      author: "zcythe",
      url: "https://sketchfab.com/3d-models/boppin-ariados-d3d9fed0764743a8a4c7b884f801812d",
      ...CC_BY,
    },
    albedo: { MAT_Main: 1, Limbs: 0.75, Horns: 0.55, Sclera: 1, pupil: 0 },
    size: { cols: 48, rows: 20 },
    view: { yaw: -2.2, pitch: 0.55 },
    frames: 24,
    speed: 0.5,
    defeatedRoll: Math.PI,
  },
  /** Three-quarter, turned toward the bug; defeated lying down. */
  hero: {
    path: "resources/base_mesh_chibi/scene.gltf",
    credit: {
      title: "Base Mesh Chibi",
      author: "abhishekfarshwan",
      url: "https://sketchfab.com/3d-models/base-mesh-chibi-699ee2e05bce46749ef93e3330cfb7d4",
      ...CC_BY,
    },
    albedo: { "Material.001": 1 },
    // The body mesh was exported in the space of its "Body" transform (Object_50); the head's
    // vertices already match the skin.
    bindShape: { "Body_Material.001_0": 0.04 },
    size: { cols: 28, rows: 20 },
    view: { yaw: 2.0, pitch: 0.1 },
    frames: 64,
    speed: 1,
    defeatedRoll: Math.PI / 2,
  },
} as const satisfies Record<string, AsciiModel>;

export type AsciiModelId = keyof typeof ASCII_MODELS;
