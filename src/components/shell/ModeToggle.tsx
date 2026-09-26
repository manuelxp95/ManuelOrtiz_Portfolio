"use client";

import { preloadRogueBoard } from "@/features/rogue/preload";
import { switchMode, usePortfolioStore } from "@/state/portfolio-store";
import { useHydrated } from "@/state/use-hydrated";

export function ModeToggle() {
  const mode = usePortfolioStore((state) => state.mode);
  const hydrated = useHydrated();
  // Server HTML is always Classic; reflect a stored Card Mode only after hydration.
  const cardMode = hydrated && mode === "rogue";
  // Intent tier (ADR-005): warm the Card Mode chunk before the click lands.
  const warm = cardMode ? undefined : preloadRogueBoard;

  return (
    <button
      type="button"
      aria-pressed={cardMode}
      onClick={() => switchMode(cardMode ? "classic" : "rogue")}
      onPointerEnter={warm}
      onFocus={warm}
      onTouchStart={warm}
      className="flex shrink-0 items-center gap-2 rounded-control border border-border px-3 py-1 text-sm transition-colors duration-(--duration-fast) hover:border-accent aria-pressed:border-accent aria-pressed:bg-accent-soft"
    >
      Card Mode
      <span
        aria-hidden="true"
        className="rounded-control bg-surface px-1.5 text-xs font-semibold text-muted"
      >
        {cardMode ? "On" : "Off"}
      </span>
    </button>
  );
}
