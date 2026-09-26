/** Card faces are a fixed character grid so the ASCII frame always closes. */
export const CARD_COLS = 24;
const INNER = CARD_COLS - 2;
const TEXT = INNER - 2;

interface CardFaceInput {
  title: string;
  glyph: string;
  label: string;
  stat: string;
  selected: boolean;
}

function fit(text: string, width: number): string {
  return text.length > width ? `${text.slice(0, width - 1)}…` : text;
}

function center(text: string, width: number): string {
  const left = Math.floor((width - text.length) / 2);
  return " ".repeat(left) + text + " ".repeat(width - text.length - left);
}

/** Selected cards switch to a double frame and a marker, so state never relies on color. */
export function buildCardFace({
  title,
  glyph,
  label,
  stat,
  selected,
}: CardFaceInput): string {
  const [tl, tr, bl, br, h, v] = selected
    ? ["╔", "╗", "╚", "╝", "═", "║"]
    : ["┌", "┐", "└", "┘", "─", "│"];
  const row = (content: string) => `${v}${content}${v}`;
  const text = (content: string) => row(` ${fit(content, TEXT).padEnd(TEXT)} `);
  const bottom = selected
    ? `${bl}${h} > SELECTED ${h.repeat(INNER - 13)}${br}`
    : `${bl}${h.repeat(INNER)}${br}`;

  return [
    `${tl}${h.repeat(INNER)}${tr}`,
    row(center(`» ${fit(title.toUpperCase(), TEXT - 4)} «`, INNER)),
    row(" ".repeat(INNER)),
    ...glyph.split("\n").map((line) => row(center(line, INNER))),
    row(" ".repeat(INNER)),
    text(label),
    text(stat),
    bottom,
  ].join("\n");
}
