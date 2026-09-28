/**
 * The characters an `AsciiArt` shows, merged back from its depth layers (ADR-015): each position
 * takes the one layer that draws there.
 */
export function shownAscii(holder: Element): string {
  const layers = [...holder.querySelectorAll(".ascii-depth > span")].map(
    (layer) => layer.textContent ?? "",
  );
  if (layers.length === 0) return "";
  return [...layers[0]]
    .map((char, i) => layers.find((layer) => layer[i] !== " ")?.[i] ?? char)
    .join("");
}
