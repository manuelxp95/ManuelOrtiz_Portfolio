# ADR-003 — Mode persistence via localStorage + pre-paint script; one mounted renderer

- **Status:** Accepted
- **Date:** 2026-09-26
- **Source:** Roadmap §6.3, CLAUDE.md rule 4

## Context

Users can prefer Card Mode across visits, but pages must stay fully static and crawlable, and a
returning Card Mode user shouldn't see a flash of Classic.

## Decision

- The chosen mode is stored in `localStorage`. A small blocking inline script sets `data-mode` on
  `<html>` before paint; the store initializes from it after hydration.
- Classic HTML is the server-rendered default for crawlers and first-time visitors.
- Exactly one presentation renderer is mounted at a time. Switching mode unmounts the inactive
  renderer; only domain/navigation state (`mode`, `activeSection`) survives. The inactive
  renderer's JS chunk stays cached by the runtime, so remounting is cheap. Never keep both mounted
  (hidden or `inert`).

## Alternatives

- Cookie + per-request SSR per mode — loses fully static pages.
- `useEffect`-only mode read — visible flash.
- Hidden/`inert` dual DOM — two live renderers, breaks the single-renderer invariant.

## Consequences

- Stored-Card-Mode users see a lightweight skeleton for one chunk load instead of a Classic flash.
- Switching back pays a remount rather than a reveal — cheap, and keeps the invariant enforceable.
- Classic components must not hold client-side state outside the store (it would be lost on a
  round-trip).
