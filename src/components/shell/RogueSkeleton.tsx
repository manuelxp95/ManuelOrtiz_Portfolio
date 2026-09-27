import { SECTION_IDS } from "@/domain/types";

/**
 * Static, CSS-only stand-in for the Card Mode board (preview tier). Rendered hidden in the server
 * HTML so a stored Card Mode preference shows it pre-paint, and reused while the chunk loads. Same
 * frame as the board — header, battlefield, hand in one viewport — so the swap shifts nothing.
 */
export function RogueSkeleton({ prepaint = false }: { prepaint?: boolean }) {
  return (
    <div
      role="status"
      aria-busy="true"
      className={`${prepaint ? "rogue-prepaint " : ""}rogue-stage rogue-skeleton`}
    >
      <span className="sr-only">Loading Card Mode…</span>
      <div className="h-7 w-56 rounded-control bg-surface" />
      <div className="mt-2 h-4 w-72 max-w-full rounded-control bg-surface" />
      <div className="mt-3 flex-1 rounded-card border border-border" />
      <ul className="flex justify-center pt-10 pb-4">
        {SECTION_IDS.map((id) => (
          <li
            key={id}
            className="-ml-10 aspect-[5/7] w-[clamp(5.75rem,27vw,11rem)] rounded-card border border-border bg-surface first:ml-0"
          />
        ))}
      </ul>
    </div>
  );
}
