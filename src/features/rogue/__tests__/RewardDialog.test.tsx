// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { RewardDialog } from "@/features/rogue/RewardDialog";
import { installDialog } from "@/test/browser-polyfills";

beforeAll(installDialog);
afterEach(cleanup);

describe("RewardDialog (P9.7)", () => {
  it("offers each modifier as a button, with its held stacks", () => {
    const onPick = vi.fn();
    render(
      <RewardDialog
        offer={["refactor", "linter", "coffee-break"]}
        held={{ refactor: 2 }}
        onPick={onPick}
        onSkip={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("dialog", { name: "Choose an upgrade" }),
    ).toBeTruthy();
    const refactor = screen.getByRole("button", { name: /Refactor/ });
    expect(refactor.textContent).toContain("held ×2");
    fireEvent.click(refactor);
    expect(onPick).toHaveBeenCalledWith("refactor");
  });

  it("Escape and Skip decline the offer", () => {
    const onSkip = vi.fn();
    render(
      <RewardDialog
        offer={["refactor", "linter", "coffee-break"]}
        held={{}}
        onPick={vi.fn()}
        onSkip={onSkip}
      />,
    );
    fireEvent(screen.getByRole("dialog"), new Event("cancel"));
    fireEvent.click(screen.getByRole("button", { name: "Skip" }));
    expect(onSkip).toHaveBeenCalledTimes(2);
  });

  it("renders nothing to pick without an offer", () => {
    render(
      <RewardDialog offer={null} held={{}} onPick={vi.fn()} onSkip={vi.fn()} />,
    );
    expect(screen.queryByRole("button")).toBeNull();
  });
});
