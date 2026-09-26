import { describe, expect, it } from "vitest";
import { cardGlyphs } from "@/features/rogue/ascii/glyphs.generated";
import { buildCardFace, CARD_COLS } from "@/features/rogue/card-face";

const face = (
  selected: boolean,
  overrides: Partial<{ title: string; stat: string }> = {},
) =>
  buildCardFace({
    title: "Relic Collection",
    glyph: cardGlyphs.projects,
    label: "Projects",
    stat: "11 projects",
    selected,
    ...overrides,
  });

describe("buildCardFace", () => {
  it.each([false, true])(
    "keeps every line exactly %s-card width",
    (selected) => {
      const lines = face(selected).split("\n");
      expect(lines).toHaveLength(16);
      for (const line of lines) expect([...line]).toHaveLength(CARD_COLS);
    },
  );

  it("marks selection by shape and text, not only color", () => {
    expect(face(false)).not.toContain("SELECTED");
    expect(face(false).startsWith("┌")).toBe(true);
    expect(face(true)).toContain("> SELECTED");
    expect(face(true).startsWith("╔")).toBe(true);
  });

  it("truncates text that would break the frame", () => {
    const lines = face(false, {
      stat: "a stat line far longer than the card is wide",
    }).split("\n");
    expect(lines.some((line) => line.includes("…"))).toBe(true);
    for (const line of lines) expect([...line]).toHaveLength(CARD_COLS);
  });
});
