"use client";

import dynamic from "next/dynamic";
import { useLayoutEffect, type ReactNode } from "react";
import { ClassicSync } from "@/components/classic/ClassicSync";
import { usePortfolioStore } from "@/state/portfolio-store";
import { useHashSync } from "@/state/use-hash-sync";
import { useHydrated } from "@/state/use-hydrated";
import { RogueSkeleton } from "./RogueSkeleton";

// Intent/interaction tier: the Card Mode board is its own chunk, never in the critical bundle.
const RogueRenderer = dynamic(
  () =>
    import("@/features/rogue/RoguePlaceholder").then(
      (module) => module.RoguePlaceholder,
    ),
  { ssr: false, loading: () => <RogueSkeleton /> },
);

/**
 * Mounts exactly one renderer (ADR-003). Classic arrives as server-rendered `children`; switching
 * to Card Mode unmounts it, and switching back remounts it. Until hydration the Classic HTML is
 * kept as-is, with a pre-paint skeleton that CSS reveals for a stored Card Mode preference.
 */
export function ModeRoot({ children }: { children: ReactNode }) {
  const mode = usePortfolioStore((state) => state.mode);
  const hydrated = useHydrated();
  useHashSync();

  // Dev Strict Mode remounts reset <html> attributes; re-apply before paint (no-op in production).
  useLayoutEffect(() => {
    document.documentElement.dataset.mode = mode;
  }, [mode]);

  if (!hydrated) {
    return (
      <>
        <div data-renderer="classic">{children}</div>
        <RogueSkeleton prepaint />
      </>
    );
  }
  if (mode === "rogue") return <RogueRenderer />;
  return (
    <>
      <div data-renderer="classic">{children}</div>
      <ClassicSync />
    </>
  );
}
