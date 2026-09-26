# ADR-004 — Hash-only section identity; mode never in the URL

- **Status:** Accepted
- **Date:** 2026-09-26
- **Source:** Roadmap §6.4, CLAUDE.md rules 2–3

## Context

Sections must be deep-linkable in both modes, and switching mode must preserve the active section.

## Decision

- Sections are identified by a stable `SectionId` and addressed as `#<id>` (e.g. `#projects`).
- No mode-specific routes (`/classic/x`, `/rogue/x`) and no mode query parameter.
- History policy: `history.replaceState` for scroll-spy-driven section changes, `pushState` only for
  explicit navigation clicks, so back/forward stays predictable.

## Alternatives

- Mode-specific routes.
- Mode as a query parameter.

## Consequences

- A shared link opens in the recipient's stored mode, or Classic by default — intended for
  recruiter links.
- Arbitrary hashes must be validated against `SectionId` before touching state.
