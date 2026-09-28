/**
 * A still boss for component tests. The boss loops its animation (ADR-013); in jsdom every frame
 * is a DOM mutation, and Testing Library's `findBy*` re-runs its (slow) role queries on each one,
 * so async queries time out. One frame keeps the art still. The frames are checked in ascii.test.ts.
 *
 *   vi.mock("@/features/rogue/ascii/frames/boss.generated", async () =>
 *     (await import("@/test/boss-frames")).stillBoss(),
 *   );
 */
export async function stillBoss() {
  const { BOSS_REST } = await import("@/features/rogue/ascii/boss.generated");
  return { frames: [BOSS_REST], frameMs: 1000 };
}
