import { describe, expect, it } from "vitest";
import { formatYearRange } from "@/domain/dates";

describe("formatYearRange", () => {
  it("shows ongoing ranges as Present", () => {
    expect(formatYearRange(2026)).toBe("2026 – Present");
  });

  it("collapses a single year", () => {
    expect(formatYearRange(2023, 2023)).toBe("2023");
  });

  it("shows a closed range", () => {
    expect(formatYearRange(2023, 2024)).toBe("2023 – 2024");
  });
});
