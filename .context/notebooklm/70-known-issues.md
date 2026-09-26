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

Status: Resolved (2026-09-26, Roadmap P0 — `git rm --cached -r .vs` + `.vs/` in `.gitignore`)
Evidence: `git ls-files` lists `.vs/ProjectSettings.json`, `.vs/VSWorkspaceState.json`,
`.vs/slnx.sqlite`, `.vs/ManuelOrtiz_Portfolio/v17/.wsuo`; `.gitignore` has no `.vs/` entry.
Impact: Machine-local IDE state churns in diffs.
Next step: `git rm --cached -r .vs` + `.gitignore` entry during P0.

## Issue: Empty placeholder file `components/contact.js`

Status: Resolved (2026-09-26, Roadmap P0 — legacy `components/` removed)
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

## Issue: Vercel preview builds of `portfolio_v2` failed on the legacy app

Status: Resolved (commit `3e817f9` — GitHub commit status "Vercel: success", owner confirmed the preview loads)
Evidence: Vercel email to the owner: "The preview deployment for project
manuel-ortiz-portfolio-pjhc failed on branch portfolio_v2 at commit 764dcc0 … The deployment
failed because of a project or build error." The Vercel project already existed and builds every
push; `764dcc0` still contained the Next 12 / React 17 app.
Impact: No working v2 preview URL; Lighthouse baseline (`docs/perf-baseline.md`) is blocked on it.
Next step: push the P0 scaffold; if the preview still fails, check the Vercel project settings
(Framework Preset = Next.js, default build/output/install commands, Root Directory `./`, Node.js
version matching `.nvmrc`).

## Issue: CV PDF predates the current experience

Status: Scheduled (Roadmap P10 — owner will produce a portfolio-specific CV, stated 2026-09-26)
Evidence: `public/CV-ManuelOrtiz_2024.pdf` was last updated in commit `15e32b8` (2024-05-02);
`src/content/experience.ts` lists UNNE (2024–2025) and ATP (2026–present), which it cannot contain.
Impact: The CV download would contradict the site's Experience section.
Next step: Owner supplies the portfolio CV at P10; update `src/content/cv.ts`.

## Issue: Unlisted itch.io links carry `?secret=` tokens

Status: Mitigated (2026-09-26 — links removed from `src/content/projects.ts`; owner to supply public URLs)
Evidence: The legacy meteoritos, road-to-carpincho (desktop and mobile) and saltarina itch.io URLs
include `?secret=` (still recorded in `docs/legacy-content/projects.md`). A content test now
rejects any project link with a `secret` query parameter.
Impact: Publishes unlisted-page tokens; pages may also be intentionally unlisted.
Next step: Owner finds or publishes the public itch.io pages; add them back as `itch` links.

## Issue: Godot appears in projects but not in skills

Status: Resolved (2026-09-26 — owner confirmed; Godot added to `src/content/skills.ts`)
Evidence: meteoritos, road-to-carpincho and saltarina list Godot in `stack`; the owner's profile
(and so `src/content/skills.ts`) does not list Godot.
Impact: Minor inconsistency between Skills and Projects.
Next step: Owner confirms whether Godot belongs in Skills.
