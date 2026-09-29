import { describe, expect, it } from "vitest";
import { SECTION_IDS } from "@/domain/types";
import {
  frameLoaders,
  modelFrameLoaders,
} from "@/features/rogue/ascii/frame-loaders";
import { cardGlyphs } from "@/features/rogue/ascii/glyphs.generated";
import {
  DEPTH_BANDS,
  depthLayers,
  flatArt,
  type DepthArt,
} from "@/features/rogue/ascii/depth";
import { ENVIRONMENT_LAYERS } from "@/features/rogue/ascii/environment";
import { environmentArt } from "@/features/rogue/ascii/frames/environment.generated";
import { renderAscii } from "@/features/rogue/ascii/renderer";
import {
  ANIMATION_FRAMES,
  ANIMATION_PITCH,
  ANIMATION_SIZE,
  ASCII_MODELS,
  ASCII_SCENES,
  animationYaw,
  GLYPH_POSE,
  GLYPH_SIZE,
} from "@/features/rogue/ascii/scenes";

function expectGrid(art: DepthArt, cols: number, rows: number) {
  for (const text of [art.chars, art.depth]) {
    const lines = text.split("\n");
    expect(lines).toHaveLength(rows);
    for (const line of lines) expect(line).toHaveLength(cols);
  }
  // A band exactly where a character is drawn.
  for (let i = 0; i < art.chars.length; i++)
    expect(art.depth[i] === " " || art.depth[i] === "\n").toBe(
      art.chars[i] === " " || art.chars[i] === "\n",
    );
  expect(art.depth).toMatch(new RegExp(`^[0-${DEPTH_BANDS - 1} \\n]*$`));
}

describe("depth-cued ASCII (ADR-015)", () => {
  const art: DepthArt = { chars: "ab \ncd ", depth: "03 \n21 " };

  it("splits art into one layer per band on the same grid", () => {
    expect(depthLayers(art)).toEqual([
      "a  \n   ",
      "   \n d ",
      "   \nc  ",
      " b \n   ",
    ]);
  });

  it("flat art puts every character in front", () => {
    expect(flatArt("a b\nc").depth).toBe("0 0\n0");
  });

  it("the renderer spreads an object over several bands", () => {
    const { depth } = renderAscii({
      shape: "torus",
      ...GLYPH_SIZE,
      ...GLYPH_POSE,
    });
    expect(new Set(depth.replace(/[ \n]/g, "")).size).toBeGreaterThan(2);
  });
});

describe("ASCII renderer", () => {
  it("is deterministic", () => {
    const options = { shape: "torus", ...GLYPH_SIZE, ...GLYPH_POSE } as const;
    expect(renderAscii(options)).toEqual(renderAscii(options));
  });

  it("draws something for every scene", () => {
    for (const id of SECTION_IDS) {
      expect(
        cardGlyphs[id].chars.replace(/[\s\n]/g, "").length,
      ).toBeGreaterThan(10);
    }
  });
});

describe("generated art is current (run `npm run ascii` when this fails)", () => {
  it.each(SECTION_IDS)("%s glyph matches the renderer", (id) => {
    expectGrid(cardGlyphs[id], GLYPH_SIZE.cols, GLYPH_SIZE.rows);
    expect(cardGlyphs[id]).toEqual(
      renderAscii({ shape: ASCII_SCENES[id], ...GLYPH_SIZE, ...GLYPH_POSE }),
    );
  });

  it.each(SECTION_IDS)("%s animation matches the renderer", async (id) => {
    const { frames } = await frameLoaders[id]();
    expect(frames).toHaveLength(ANIMATION_FRAMES);
    for (const index of [0, ANIMATION_FRAMES - 1]) {
      expectGrid(frames[index], ANIMATION_SIZE.cols, ANIMATION_SIZE.rows);
      expect(frames[index]).toEqual(
        renderAscii({
          shape: ASCII_SCENES[id],
          ...ANIMATION_SIZE,
          yaw: animationYaw(index),
          pitch: ANIMATION_PITCH,
        }),
      );
    }
  });
});

describe("combatant model art (P9.8–P9.9)", () => {
  it.each(Object.keys(ASCII_MODELS) as (keyof typeof ASCII_MODELS)[])(
    "%s: one loop of fixed-size frames that rests on its first frame",
    async (id) => {
      const model = ASCII_MODELS[id];
      const { frames, frameMs, defeated } = await modelFrameLoaders[id]();
      const rest = frames[0];
      expect(frames).toHaveLength(model.frames);
      for (const frame of [...frames, defeated])
        expectGrid(frame, model.size.cols, model.size.rows);
      expect(new Set(frames.map((frame) => frame.chars)).size).toBeGreaterThan(
        1,
      );
      expect(defeated.chars).not.toBe(rest.chars);
      expect(frameMs).toBeGreaterThan(0);
    },
  );
});

describe("environment layers (P9.12)", () => {
  it("are listed farthest first, each nearer layer moving more", () => {
    const ids = ENVIRONMENT_LAYERS.map((layer) => layer.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (let i = 1; i < ENVIRONMENT_LAYERS.length; i++) {
      expect(ENVIRONMENT_LAYERS[i].depth).toBeLessThan(
        ENVIRONMENT_LAYERS[i - 1].depth,
      );
      expect(ENVIRONMENT_LAYERS[i].parallax).toBeGreaterThan(
        ENVIRONMENT_LAYERS[i - 1].parallax,
      );
    }
  });

  it.each(ENVIRONMENT_LAYERS.map((layer) => [layer.id, layer] as const))(
    "%s: depth-cued art of its declared size, with relief",
    (id, layer) => {
      const art = environmentArt[id];
      expectGrid(art, layer.size.cols, layer.size.rows);
      expect(art.chars.replace(/\s/g, "").length).toBeGreaterThan(50);
      expect(new Set(art.depth.replace(/\s/g, "")).size).toBeGreaterThan(1);
    },
  );
});
