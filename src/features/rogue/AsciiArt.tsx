import { depthLayers, type DepthArt } from "./ascii/depth";

/**
 * Draws depth-cued ASCII (ADR-015): one text layer per depth band, stacked in a single grid cell,
 * inside whatever element holds the art (its font, size and color apply). Farther bands mix the
 * element's color toward the background (`.ascii-depth` in rogue.css), so it works in both themes.
 * Decorative: the holder is `aria-hidden`, and the scene's text alternative lives elsewhere.
 *
 * Opaque art (P9.12) also carries its exact silhouette, painted in the background color under its
 * characters, so whatever lies behind — scenery, another layer — never shows through between them.
 */
export function AsciiArt({ art }: { art: DepthArt }) {
  return (
    <span className="ascii-depth">
      {art.silhouette && <span data-silhouette="">{art.silhouette}</span>}
      {depthLayers(art).map((layer, band) => (
        <span key={band} data-band={band}>
          {layer}
        </span>
      ))}
    </span>
  );
}
