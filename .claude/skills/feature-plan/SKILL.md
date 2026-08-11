---
name: feature-plan
description: Produce a bounded implementation plan for a non-trivial feature before writing code — files involved, state/domain changes, client/server boundary impact, performance impact, test strategy, acceptance criteria, explicit non-goals. Use when starting a non-trivial feature, especially when the user explicitly asks for a plan before implementation.
---

# feature-plan

Trigger: starting a non-trivial feature, or the user explicitly asks for a plan before code.

Scope: planning only. Do not write implementation code until the plan is approved when the user
has explicitly asked for planning.

## Plan must identify

- **Files likely involved** — new and modified, by path.
- **State changes** — what's local, what's Zustand, and why (per `CLAUDE.md` state rules).
- **Domain changes** — any change to `SectionId`, content schema, or section-to-renderer mapping.
- **Client/server boundary impact** — which new/changed components need `"use client"`, and
  whether the boundary stays narrow.
- **Performance impact** — which loading tier the new code lands in, and any new dependency's
  bundle cost.
- **Test strategy** — what actually needs a test per the testing priorities in `CLAUDE.md`
  (section mapping, mode switching, active-section preservation, URL/hash sync, keyboard a11y,
  domain validation, state transitions), and what doesn't.
- **Acceptance criteria** — concrete, checkable.
- **Explicit non-goals** — what this feature deliberately does not do, to bound scope.

## Output format

Short sections matching the list above. No implementation code. End with a one-line summary of
what approval unblocks.
