---
name: architecture-review
description: Review a proposed implementation against this project's architecture (single content source, classic/rogue separation, server/client boundaries, state ownership, loading tiers, dependency impact) before significant implementation work. Use before starting a non-trivial feature or when a design/approach needs sign-off. Read-only unless explicitly asked to edit.
---

# architecture-review

Trigger: before starting non-trivial implementation, or when asked to sanity-check a design
against `CLAUDE.md` / `docs/architecture.md`.

Scope: review only — do not edit files unless explicitly asked to.

## Checklist

- **Single content source**: does the proposal read from the shared domain/content layer, or does
  it introduce a second copy of professional content for one mode?
- **Classic/rogue separation**: is mode-specific presentation logic actually kept out of the
  shared domain/content layer? Is section id kept mode-agnostic (no `rogue-projects` vs
  `projects`)?
- **Server/client boundaries**: is `"use client"` scoped to the narrowest component that needs it?
  Does anything server-renderable end up depending on the Zustand store?
- **State ownership**: is new state local, or does it genuinely need Zustand (cross-component
  coordination)? Is anything being put in Zustand that should be local?
- **Loading tiers**: which tier (critical/preview/intent/interaction/expensive) does the new code
  belong to, and is it wired to load at that tier — not earlier?
- **Dependency impact**: does this need a new dependency? Could native browser APIs, existing
  stack (Tailwind, dnd-kit, Zustand, Motion), or existing code cover it instead?
- **Accessibility**: keyboard path, semantic elements, drag alternative, reduced-motion behavior
  accounted for in the design?
- **Responsive design**: is behavior defined per breakpoint tier, or is this a desktop layout that
  will get scaled down?
- **Abstraction justification**: is any new abstraction backed by an actual repeated pattern, or
  speculative?

## Output

- **Findings** — what was checked and what was found, grouped by checklist item (skip items with
  nothing to report).
- **Risks** — concrete failure scenarios, not generic warnings.
- **Required corrections** — specific, actionable.
- **Recommendation** — proceed / revise, one line, with the deciding reason.
