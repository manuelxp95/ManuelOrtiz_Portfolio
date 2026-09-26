# Manuel Ortiz Portfolio — Technical Decisions

> Project-memory document. **Hand-maintained** — `generate-context.py` never overwrites this file.
> Append new decisions at the end; do not rewrite history.
> Authority order: Git working tree > CLAUDE.md > docs/ > this document.

Only record decisions actually supported by the repository, project documentation, or an explicit
statement from the project owner. Do not invent history. Where a decision is *inferred* from the
repository rather than stated, say so in its `Status` line. Formal ADRs belong in `docs/adr/`
(mirrored into `10-architecture.md`); this file is the running log.

Format for each entry:

```markdown
## Decision: <title>

Status: Accepted | Proposed | Superseded by <title> | Inferred from repository
Date: YYYY-MM-DD
Source: <where this is stated>
Context:
Decision:
Consequences:
```

---

## Decision: Fresh scaffold on `portfolio_v2`, legacy site frozen on `master`

Status: Accepted (stated by the project owner)
Date: 2026-08-11 (commit `d008e03`, "Create Roadmap.md")
Source: `docs/Roadmap.md` → Context → "User decisions already made (do not re-litigate)"
Context: The legacy site is Next 12 / Pages Router / JS / Chakra UI. `docs/architecture.md`
describes an incremental in-place migration.
Decision: Rebuild on branch `portfolio_v2`, replacing the root app. The old site stays deployable
from `master`. Old code is content/reference, not a structural constraint.
Consequences: Supersedes the "incremental, not a rewrite" migration note in
`docs/architecture.md`; Roadmap P1 must update that doc (see `70-known-issues.md`).

## Decision: Deploy to Vercel instead of GitHub Pages

Status: Accepted (stated by the project owner)
Date: 2026-08-11
Source: `docs/Roadmap.md` → Context → "User decisions already made"
Context: Legacy deploys were manual `gh-pages` pushes with a `homepage` field.
Decision: Deploy v2 to Vercel. No `basePath`; `next/image` optimization available; static
generation preferred, `output: 'export'` not required.
Consequences: URL migration (LinkedIn, CV links) is handled in Roadmap P10. `CLAUDE.md` still
describes the GitHub Pages deploy of the legacy site.

## Decision: Seven top-level sections; game-dev/backend become tags

Status: Accepted 2026-09-26 (owner delegated the call to the documentation audit: "lo más conveniente para el proyecto"); was Proposed
Date: 2026-08-11
Source: `docs/Roadmap.md` §2 "Section set decision"
Context: `docs/architecture.md`'s example `SectionId` includes `game-dev` and `backend`.
Decision: `about | skills | experience | projects | education | contact | cv`; game-dev and
backend are project/skill tags.
Consequences: `docs/architecture.md` updated in the 2026-09-26 audit.

## Decision: Roadmap ADRs 1–6 (one model two renderers, fresh scaffold + Vercel, mode persistence, hash-only URLs, loading tiers, Motion vs dnd-kit + 3D admission)

Status: Accepted as plan; ADR files scheduled for Roadmap P0 task 4 (none exist yet). ADR-5/6 numbers provisional until P5/P8 measurements
Date: 2026-08-11
Source: `docs/Roadmap.md` §6
Decision: See the roadmap text (mirrored in `20-roadmap.md`). When each ADR is written to
`docs/adr/NNN-title.md`, record it here as Accepted with its file path.

## Decision: NotebookLM project memory, same system as ResonateBlind

Status: Accepted (requested by the project owner)
Date: 2026-09-26
Source: owner request in a Claude Code session: reuse the NotebookLM context-memory system from
`ResonateBlind` for this repository, based on `docs/Roadmap.md` and `docs/architecture.md`.
Context: Long-running, multi-session migration (P0–P10) where rationale and history must
survive across Claude Code sessions.
Decision: Generated Markdown snapshot in `.context/notebooklm/`, synced incrementally by
`scripts/notebooklm/sync-context.py` (via the `nlm` CLI) to the notebook
`Manuel Ortiz Portfolio — Project Memory` (alias `portfolio`). Skills
`project-memory-status`, `project-memory-query`, `project-memory-sync`. Unlike ResonateBlind there
is no Unreal/Layer-B capture; every generated document is filesystem-derived.
Consequences: NotebookLM is the lowest authority (below the working tree, `CLAUDE.md` and
`docs/`). Run `/project-memory-sync` after meaningful architecture changes or phase completions.

## Decision: Documentation audit — one consistent story across CLAUDE.md, architecture.md, Roadmap.md

Status: Accepted (requested by the project owner)
Date: 2026-09-26
Source: owner request: audit the roadmap "según lo que sea más conveniente para el proyecto", so
the project starts with contradiction-free documentation.
Context: `docs/architecture.md` and `CLAUDE.md` predated the roadmap's decisions and disagreed
with it; the roadmap had internal inconsistencies and stale repo findings.
Decision: Roadmap decisions win where they were explicit; the docs were rewritten to match.
Resolved points:
- Migration: fresh scaffold on `portfolio_v2`, legacy frozen on `master` (architecture.md rewritten).
- Sections: 7 (`about|skills|experience|projects|education|contact|cv`); game-dev/backend are tags.
- Rendering: static generation on Vercel; `output: 'export'` not required.
- Renderers: exactly one mounted at a time; unmount inactive; never hidden+inert dual mounting
  (CLAUDE.md rule 4 tightened; roadmap P3 prompt fixed).
- Mode persistence: localStorage + blocking inline script setting `data-mode`; classic is the
  server-rendered default.
- Zustand scope: `mode` + `activeSection` only; card interaction state lives in `card-machine.ts`.
- Card states (canonical, architecture.md): idle → hovered/focused → selected → expanded →
  closing/restoring; grabbed/dragging → drop candidate as P6 enhancement. `card-interaction-review`
  skill aligned.
- Loading tiers named critical/preview/intent/interaction/expensive everywhere (roadmap P5 aligned).
- 3D seam path: `src/features/rogue/three/`.
- Tests: Vitest + RTL from P1; Playwright only if jsdom proves insufficient (CLAUDE.md updated).
- Budgets: roadmap §7 is the single source; P2/P4 now reference it.
- ADRs: written in P0 task 4.
- CV: `public/CV-ManuelOrtiz_2024.pdf` kept; the 2023 CV dropped unless the owner wants it.
- `docs/daily/` is a private, git-ignored prompt workspace — not project documentation.
Consequences: on any future conflict between these docs, fix the docs rather than choosing one
silently.
