/**
 * Depth-cued ASCII (ADR-015): the standard for every element that fakes three dimensions. A
 * renderer produces a `DepthArt` — its characters, and per character a depth band — and
 * `AsciiArt.tsx` draws one text layer per band, the farther bands fading toward the background
 * (linear fog, quantized). Characters still carry the light; color carries the depth.
 * Keep this module dependency-free: the build scripts import it with type stripping.
 */
export interface DepthArt {
  /** Rows joined by "\n". */
  readonly chars: string;
  /** Same length as `chars`: a band digit per drawn character, " " for blanks and "\n" rows. */
  readonly depth: string;
  /**
   * Opaque art (P9.12): its silhouette, painted in the background color under the characters so
   * nothing behind shows through. Computed at build time (`withSilhouette`) for the combatants and
   * the environment; card art has none.
   */
  readonly silhouette?: string;
}

/** Bands of depth, 0 = nearest. The fog per band is in rogue.css (`.ascii-depth`). */
export const DEPTH_BANDS = 4;

/** Band of a depth normalized to 0 (nearest) … 1 (farthest). */
export function depthBand(t: number): string {
  return String(
    Math.min(DEPTH_BANDS - 1, Math.max(0, Math.floor(t * DEPTH_BANDS))),
  );
}

/** Flat art: every drawn character in the nearest band (text and frames around a 3D object). */
export function flatArt(chars: string): DepthArt {
  return { chars, depth: chars.replace(/[^\n ]/g, "0") };
}

/** Fills a cell of an opaque silhouette: a full block covers the whole character cell. */
export const SOLID = "\u2588";

/**
 * The art's silhouette on the same grid: SOLID on every cell inside its outline — drawn, or blank
 * but enclosed by drawn cells — and blank outside. "Outside" is every blank cell reachable from the
 * grid's border through blank neighbours, so the silhouette follows the outline exactly (gaps open
 * to the edge, like between legs, stay see-through).
 */
export function silhouette(art: DepthArt): string {
  const rows = art.chars.split("\n");
  const height = rows.length;
  const width = Math.max(...rows.map((row) => row.length));
  const blank = (x: number, y: number) => (rows[y][x] ?? " ") === " ";
  const outside = new Uint8Array(width * height);
  const stack: number[] = [];
  const visit = (x: number, y: number) => {
    const i = y * width + x;
    if (outside[i] || !blank(x, y)) return;
    outside[i] = 1;
    stack.push(i);
  };
  for (let x = 0; x < width; x++) {
    visit(x, 0);
    visit(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    visit(0, y);
    visit(width - 1, y);
  }
  while (stack.length > 0) {
    const i = stack.pop()!;
    const x = i % width;
    const y = (i - x) / width;
    if (x > 0) visit(x - 1, y);
    if (x + 1 < width) visit(x + 1, y);
    if (y > 0) visit(x, y - 1);
    if (y + 1 < height) visit(x, y + 1);
  }
  return rows
    .map((row, y) =>
      Array.from({ length: row.length }, (_, x) =>
        outside[y * width + x] ? " " : SOLID,
      ).join(""),
    )
    .join("\n");
}

/** The art made opaque: with its silhouette, for the generators to write out. */
export function withSilhouette(art: DepthArt): DepthArt {
  return { ...art, silhouette: silhouette(art) };
}

const layersCache = new WeakMap<DepthArt, readonly string[]>();

/** One string per band, same grid as the art: the band's characters, blanks elsewhere. */
export function depthLayers(art: DepthArt): readonly string[] {
  const cached = layersCache.get(art);
  if (cached) return cached;
  const layers = Array.from({ length: DEPTH_BANDS }, (_, band) => {
    const digit = String(band);
    let layer = "";
    for (let i = 0; i < art.chars.length; i++) {
      const char = art.chars[i];
      layer += char === "\n" || art.depth[i] === digit ? char : " ";
    }
    return layer;
  });
  layersCache.set(art, layers);
  return layers;
}
