/**
 * Still combatants for component tests. The combatants loop their animations (ADR-013); in jsdom
 * every frame is a DOM mutation, and Testing Library's `findBy*` re-runs its (slow) role queries on
 * each one, so async queries time out. Keeping only the rest frame keeps the art still. The frames
 * themselves are checked in ascii.test.ts.
 *
 *   vi.mock("@/features/rogue/ascii/frames/boss.generated", async (importOriginal) =>
 *     (await import("@/test/still-models")).stillModel(importOriginal),
 *   );
 */
export async function stillModel(importOriginal: () => Promise<unknown>) {
  const actual =
    (await importOriginal()) as typeof import("@/features/rogue/ascii/frames/boss.generated");
  return { ...actual, frames: actual.frames.slice(0, 1) };
}
