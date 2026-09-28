import { describe, expect, it } from "vitest";
import { SECTION_IDS } from "@/domain/types";
import {
  BOSS_DEFEATED,
  BOSS_REST,
} from "@/features/rogue/ascii/boss.generated";
import { frameLoaders } from "@/features/rogue/ascii/frame-loaders";
import {
  frameMs,
  frames as bossFrames,
} from "@/features/rogue/ascii/frames/boss.generated";
import { cardGlyphs } from "@/features/rogue/ascii/glyphs.generated";
import { renderAscii } from "@/features/rogue/ascii/renderer";
import {
  ANIMATION_FRAMES,
  ANIMATION_PITCH,
  ANIMATION_SIZE,
  ASCII_SCENES,
  BOSS_ANIMATION_FRAMES,
  BOSS_SIZE,
  animationYaw,
  GLYPH_POSE,
  GLYPH_SIZE,
} from "@/features/rogue/ascii/scenes";

function expectGrid(art: string, cols: number, rows: number) {
  const lines = art.split("\n");
  expect(lines).toHaveLength(rows);
  for (const line of lines) expect(line).toHaveLength(cols);
}

describe("ASCII renderer", () => {
  it("is deterministic", () => {
    const options = { shape: "torus", ...GLYPH_SIZE, ...GLYPH_POSE } as const;
    expect(renderAscii(options)).toBe(renderAscii(options));
  });

  it("draws something for every scene", () => {
    for (const id of SECTION_IDS) {
      expect(cardGlyphs[id].replace(/[\s\n]/g, "").length).toBeGreaterThan(10);
    }
  });
});

describe("generated art is current (run `npm run ascii` when this fails)", () => {
  it.each(SECTION_IDS)("%s glyph matches the renderer", (id) => {
    expectGrid(cardGlyphs[id], GLYPH_SIZE.cols, GLYPH_SIZE.rows);
    expect(cardGlyphs[id]).toBe(
      renderAscii({ shape: ASCII_SCENES[id], ...GLYPH_SIZE, ...GLYPH_POSE }),
    );
  });

  it.each(SECTION_IDS)("%s animation matches the renderer", async (id) => {
    const { frames } = await frameLoaders[id]();
    expect(frames).toHaveLength(ANIMATION_FRAMES);
    for (const index of [0, ANIMATION_FRAMES - 1]) {
      expectGrid(frames[index], ANIMATION_SIZE.cols, ANIMATION_SIZE.rows);
      expect(frames[index]).toBe(
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

describe("boss art (P9.8)", () => {
  it("is one loop of fixed-size frames that rests on its first frame", () => {
    expect(bossFrames).toHaveLength(BOSS_ANIMATION_FRAMES);
    for (const frame of [...bossFrames, BOSS_DEFEATED])
      expectGrid(frame, BOSS_SIZE.cols, BOSS_SIZE.rows);
    expect(BOSS_REST).toBe(bossFrames[0]);
    expect(new Set(bossFrames).size).toBeGreaterThan(1);
    expect(BOSS_DEFEATED).not.toBe(BOSS_REST);
    expect(frameMs).toBeGreaterThan(0);
  });
});
