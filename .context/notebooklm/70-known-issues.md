# Manuel Ortiz Portfolio — Known Issues

> Project-memory document. **Hand-maintained** — `generate-context.py` never overwrites this file.
> Authority order: Git working tree > CLAUDE.md > docs/ > this document.

Add an issue only when it is backed by evidence (a file, a config value, a log, a TODO, or an
explicit report). Do not manufacture potential bugs. Mark an issue `Resolved` with the commit or
date instead of deleting it.

Format:

```markdown
## Issue: <title>

Status: Open | Scheduled (<phase>) | Resolved (<commit/date>)
Evidence:
Impact:
Next step:
```

---

## Issue: Visual Studio `.vs/` state is tracked in git

Status: Scheduled (Roadmap P0 task 4)
Evidence: `git ls-files` lists `.vs/ProjectSettings.json`, `.vs/VSWorkspaceState.json`,
`.vs/slnx.sqlite`, `.vs/ManuelOrtiz_Portfolio/v17/.wsuo`; `.gitignore` has no `.vs/` entry.
Impact: Machine-local IDE state churns in diffs.
Next step: `git rm --cached -r .vs` + `.gitignore` entry during P0.

## Issue: Empty placeholder file `components/contact.js`

Status: Scheduled (Roadmap P0 — legacy `components/` is removed by the fresh scaffold)
Evidence: `components/contact.js` is 0 bytes and tracked.
Impact: None at runtime.
Next step: Disappears with the legacy app files in P0.

---

## Issue: `docs/architecture.md` contradicted the fresh-scaffold decision

Status: Resolved (2026-09-26, documentation audit)
Evidence: architecture.md said "incremental, not a rewrite-in-place big bang"; the roadmap records
the owner's fresh-scaffold decision.
Next step: none — architecture.md rewritten to match. See `60-decisions.md` → Documentation audit.

## Issue: `CLAUDE.md` described only the GitHub Pages deploy

Status: Resolved (2026-09-26, documentation audit)
Evidence: `CLAUDE.md` → Current state said "deployed to GitHub Pages via `gh-pages`" with no
mention of the Vercel decision.
Next step: none — Current state now distinguishes legacy (until P0) from v2 on Vercel.

## Issue: Roadmap §1 findings were partly stale

Status: Resolved (2026-09-26, documentation audit)
Evidence: roadmap claimed OneDrive location, no lockfile, unused `three`, unknown CV location.
Reality: `D:\Git\ManuelOrtiz_Portfolio`, `package-lock.json` tracked, `three` used by
`components/voxel-arcade.js` on every page, CVs at `public/CV-ManuelOrtiz_2024.pdf` and
`public/CV_ManuelOrtiz_2023.pdf`.
Next step: none — §1 and P0 corrected.

## Issue: Roadmap internal inconsistencies

Status: Resolved (2026-09-26, documentation audit)
Evidence: P3 prompt asked for "hidden+inert switching" while ADR-3 rejects it; P2/P4 budgets
(+15 kB, 60 kB) differed from §7 (+20 kB, 80 kB); P4 and architecture.md used different card-state
names; P5 tier names differed from CLAUDE.md/architecture.md; ADRs were never scheduled.
Next step: none — all aligned; see `60-decisions.md` → Documentation audit.
