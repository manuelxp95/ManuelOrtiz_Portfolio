# ADR-002 — Fresh scaffold on `portfolio_v2`, deployed to Vercel

- **Status:** Accepted (project owner decision, 2026-08-11)
- **Date:** 2026-09-26
- **Source:** Roadmap §6.2 and Context → "User decisions already made"
- **Supersedes:** the incremental in-place migration note formerly in `docs/architecture.md`, and
  the GitHub Pages deploy.

## Context

The legacy site is Next 12 / Pages Router / plain JS / Chakra UI / React 17, deployed to GitHub
Pages via `gh-pages`. Reaching the target stack (current Next, App Router, TS strict, Tailwind)
in place would mean a stepwise framework + UI-library migration of a small site.

## Decision

Rebuild from a fresh `create-next-app` scaffold on branch `portfolio_v2`, replacing the root app.
The legacy site stays frozen and deployable on `master`; its code is content/reference only
(harvested into `docs/legacy-content/`). Deploy v2 to Vercel: no `basePath`, `next/image`
optimization available, static generation preferred, `output: 'export'` not required.

## Alternatives

- Incremental in-place migration (Next 12 → current, Chakra → Tailwind).
- Stay on GitHub Pages with a static export.

## Consequences

- Loses "every step deployable on the old URL"; each phase instead leaves a Vercel preview.
- URL migration (LinkedIn, CV links, old GitHub Pages URL) happens at production cutover in
  Roadmap P10.
