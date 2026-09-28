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
