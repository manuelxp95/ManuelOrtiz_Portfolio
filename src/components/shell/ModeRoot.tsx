"use client";

import { useEffect, useLayoutEffect, type ReactNode } from "react";
import { ClassicSync } from "@/components/classic/ClassicSync";
import {
  loadRogueBoard,
  RogueBoardSlot,
  useRogueBoardLoaded,
} from "@/features/rogue/preload";
import { switchMode, usePortfolioStore } from "@/state/portfolio-store";
import { useHashSync } from "@/state/use-hash-sync";
import { useHydrated } from "@/state/use-hydrated";
import { RogueSkeleton } from "./RogueSkeleton";

/**
 * Mounts exactly one renderer (ADR-003). Classic arrives as server-rendered `children`; switching
 * to Card Mode unmounts it, and switching back remounts it. Until hydration the Classic HTML is
 * kept as-is, with a pre-paint skeleton that CSS reveals for a stored Card Mode preference.
 * Card Mode renders straight from its lazily loaded chunk (ADR-005): the skeleton shows only
 * while the chunk is still downloading.
 */
export function ModeRoot({ children }: { children: ReactNode }) {
  const mode = usePortfolioStore((state) => state.mode);
  const hydrated = useHydrated();
  const boardLoaded = useRogueBoardLoaded();
  useHashSync();

  // Dev Strict Mode remounts reset <html> attributes; re-apply before paint (no-op in production).
  useLayoutEffect(() => {
    document.documentElement.dataset.mode = mode;
  }, [mode]);

  useEffect(() => {
    if (!hydrated || mode !== "rogue" || boardLoaded) return;
    // If the chunk can't load (offline, deploy mismatch), fall back to Classic: content first.
    loadRogueBoard().catch(() => switchMode("classic"));
  }, [hydrated, mode, boardLoaded]);

  if (!hydrated) {
    return (
      <>
        <div data-renderer="classic">{children}</div>
        <RogueSkeleton prepaint />
      </>
    );
  }
  if (mode === "rogue") {
    return <RogueBoardSlot fallback={<RogueSkeleton />} />;
  }
  return (
    <>
      <div data-renderer="classic">{children}</div>
      <ClassicSync />
    </>
  );
}
