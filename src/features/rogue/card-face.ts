import type { DepthArt } from "./ascii/depth";

/** Card faces are a fixed character grid so the ASCII frame always closes. */
export const CARD_COLS = 24;
const INNER = CARD_COLS - 2;
const TEXT = INNER - 2;

interface CardFaceInput {
  title: string;
  /** The card's 3D object; the frame and text around it sit in the nearest depth band. */
  glyph: DepthArt;
  label: string;
  stat: string;
  selected: boolean;
  /** Card type (ATTACK / SKILL / POWER), set into the top border. */
  type?: string;
}

function fit(text: string, width: number): string {
  return text.length > width ? `${text.slice(0, width - 1)}…` : text;
}

function center(text: string, width: number): string {
  const left = Math.floor((width - text.length) / 2);
  return " ".repeat(left) + text + " ".repeat(width - text.length - left);
}

/** Nearest band for every drawn character of flat text. */
const flat = (line: string) => line.replace(/[^ ]/g, "0");

/** Selected cards switch to a double frame and a marker, so state never relies on color. */
export function buildCardFace({
  title,
  glyph,
  label,
  stat,
  selected,
  type,
}: CardFaceInput): DepthArt {
  const [tl, tr, bl, br, h, v] = selected
    ? ["╔", "╗", "╚", "╝", "═", "║"]
    : ["┌", "┐", "└", "┘", "─", "│"];
  const row = (content: string) => `${v}${content}${v}`;
  const text = (content: string) => row(` ${fit(content, TEXT).padEnd(TEXT)} `);
  const bottom = selected
    ? `${bl}${h} > SELECTED ${h.repeat(INNER - 13)}${br}`
    : `${bl}${h.repeat(INNER)}${br}`;

  const tag = type ? `${h} ${type.toUpperCase()} ` : "";
  const head = [
    `${tl}${tag}${h.repeat(INNER - tag.length)}${tr}`,
    row(center(`» ${fit(title.toUpperCase(), TEXT - 4)} «`, INNER)),
    row(" ".repeat(INNER)),
  ];
  const foot = [row(" ".repeat(INNER)), text(label), text(stat), bottom];
  const glyphDepth = glyph.depth.split("\n");
  const glyphRows = glyph.chars.split("\n");
  // The object keeps its depth; the frame at its sides is flat like the rest of the card.
  const edge = (content: string) => `0${content}0`;
  return {
    chars: [
      ...head,
      ...glyphRows.map((line) => row(center(line, INNER))),
      ...foot,
    ].join("\n"),
    depth: [
      ...head.map(flat),
      ...glyphDepth.map((line) => edge(center(line, INNER))),
      ...foot.map(flat),
    ].join("\n"),
  };
}
