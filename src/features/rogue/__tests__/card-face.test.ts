import { describe, expect, it } from "vitest";
import { cardGlyphs } from "@/features/rogue/ascii/glyphs.generated";
import { buildCardFace, CARD_COLS } from "@/features/rogue/card-face";

const art = (
  selected: boolean,
  overrides: Partial<{ title: string; stat: string; type: string }> = {},
) =>
  buildCardFace({
    title: "Relic Collection",
    glyph: cardGlyphs.projects,
    label: "Projects",
    stat: "11 projects",
    selected,
    ...overrides,
  });
const face = (
  selected: boolean,
  overrides: Partial<{ title: string; stat: string; type: string }> = {},
) => art(selected, overrides).chars;

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

  it("sets the card type into the top border", () => {
    const top = face(false, { type: "attack" }).split("\n")[0];
    expect(top).toContain(" ATTACK ");
    expect([...top]).toHaveLength(CARD_COLS);
    expect([...face(true, { type: "power" }).split("\n")[0]]).toHaveLength(
      CARD_COLS,
    );
  });

  it("truncates text that would break the frame", () => {
    const lines = face(false, {
      stat: "a stat line far longer than the card is wide",
    }).split("\n");
    expect(lines.some((line) => line.includes("…"))).toBe(true);
    for (const line of lines) expect([...line]).toHaveLength(CARD_COLS);
  });
});

describe("card face depth (ADR-015)", () => {
  it("keeps the glyph's depth and puts the frame and text in front", () => {
    const { chars, depth } = art(false);
    expect(depth).toHaveLength(chars.length);
    const charRows = chars.split("\n");
    const depthRows = depth.split("\n");
    // Border, title and text rows: every drawn character is in the nearest band.
    for (const row of [0, 1, charRows.length - 3, charRows.length - 1])
      for (let i = 0; i < charRows[row].length; i++)
        expect(depthRows[row][i]).toBe(charRows[row][i] === " " ? " " : "0");
    // The object keeps farther bands.
    expect(depth).toMatch(/[123]/);
  });
});
