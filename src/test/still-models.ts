/**
 * Still combatants for component tests. The combatants loop their animations (ADR-013); in jsdom
 * every frame is a DOM mutation, and Testing Library's `findBy*` re-runs its (slow) role queries on
 * each one, so async queries time out. One frame keeps the art still. The frames themselves are
 * checked in ascii.test.ts.
 *
 *   vi.mock("@/features/rogue/ascii/frames/boss.generated", async () =>
 *     (await import("@/test/still-models")).stillModel("boss"),
 *   );
 */
export async function stillModel(id: "boss" | "hero") {
  const { rest } =
    id === "boss"
      ? await import("@/features/rogue/ascii/models/boss.generated")
      : await import("@/features/rogue/ascii/models/hero.generated");
  return { frames: [rest], frameMs: 1000 };
}
