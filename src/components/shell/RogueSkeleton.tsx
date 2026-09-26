import { SECTION_IDS } from "@/domain/types";

/**
 * Static, CSS-only stand-in for the Card Mode board (preview tier). Rendered hidden in the server
 * HTML so a stored Card Mode preference shows it pre-paint, and reused while the chunk loads.
 */
export function RogueSkeleton({ prepaint = false }: { prepaint?: boolean }) {
  return (
    <div
      role="status"
      aria-busy="true"
      className={`${prepaint ? "rogue-prepaint " : ""}rogue-stage py-12`}
    >
      <span className="sr-only">Loading Card Mode…</span>
      <div className="mb-6 h-10 w-64 rounded-control bg-surface" />
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {SECTION_IDS.map((id) => (
          <li
            key={id}
            className="aspect-[5/7] rounded-card border border-border bg-surface"
          />
        ))}
      </ul>
    </div>
  );
}
