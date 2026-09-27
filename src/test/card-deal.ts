/**
 * A known Card Mode deal for component tests: all seven section cards in hand, in registry order,
 * so tests can reach any section card. The random deal itself is unit-tested in battle.test.ts.
 *
 *   vi.mock("@/features/rogue/battle", async (importOriginal) =>
 *     (await import("@/test/card-deal")).dealAllSections(importOriginal),
 *   );
 */
export async function dealAllSections(importOriginal: () => Promise<unknown>) {
  const actual =
    (await importOriginal()) as typeof import("@/features/rogue/battle");
  const { SECTION_IDS } = await import("@/domain/types");
  const sectionIds: readonly string[] = SECTION_IDS;
  return {
    ...actual,
    createBoardState: (seed: number) => {
      const state = actual.createBoardState(seed);
      const pool = [...state.hand, ...state.deck];
      return {
        ...state,
        hand: [...SECTION_IDS],
        deck: pool.filter((card) => !sectionIds.includes(card)),
      };
    },
  };
}
