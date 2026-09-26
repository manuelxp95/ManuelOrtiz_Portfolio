---
name: project-memory-sync
description: Regenerate the portfolio's project-memory snapshot and upload only the documents that changed to the NotebookLM notebook. Run after completing a roadmap phase, after architecture/stack/deploy changes, after a technical decision worth recording, after a substantial task, or before a handoff.
---

# Sync project memory

Refreshes the NotebookLM notebook `Manuel Ortiz Portfolio — Project Memory` (alias `portfolio`).

## When to run this

After **meaningful** change, not after every edit:

- a roadmap phase (P0–P10) completed or its scope changed
- `docs/architecture.md`, `docs/Roadmap.md`, `CLAUDE.md` or an ADR changed
- stack, dependency, build or deploy changes
- a technical decision worth recording
- completing a substantial task, or before a handoff
- whenever explicitly asked

Do **not** wire this to a `Write`/`Edit` hook. Network sync on every edit is noise. If a sync is
due but not run, write the reason into `.context/notebooklm/.dirty`.

## Step 1 — check the working tree

```powershell
git status
```

Do not discard, reset or stash anything. Do not commit unless the user explicitly asked.

## Step 2 — record anything durable by hand

The generator never overwrites these two, so real knowledge goes here:

- **`.context/notebooklm/60-decisions.md`** — append an entry when a decision was made this
  session, in the existing format. Only record decisions supported by the repository, project docs,
  or an explicit statement from the user. **Do not fabricate history.** Roadmap proposals are
  `Proposed` until the user accepts them or an ADR lands.
- **`.context/notebooklm/70-known-issues.md`** — add an issue only when backed by evidence. Mark
  fixed issues `Resolved (<commit/date>)` instead of deleting them.

## Step 3 — regenerate and upload only what changed

```powershell
python scripts/notebooklm/sync-context.py
```

Per document: regenerate → sha256 → skip if unchanged → upload the new source with `--wait` →
verify it is present → delete the superseded source → rewrite the manifest atomically. Sources the
manifest did not create are never touched, and the notebook is never deleted.

Variants:

```powershell
python scripts/notebooklm/sync-context.py --dry-run   # what would upload; nothing remote
python scripts/notebooklm/sync-context.py --status    # CURRENT / STALE / UNAVAILABLE
python scripts/notebooklm/sync-context.py --setup     # first run: create notebook + alias + config.json
python scripts/notebooklm/sync-context.py --force     # re-upload everything
```

If it reports `NOT AUTHENTICATED`, tell the user to run `nlm login`. Do not authenticate for them.

## Step 4 — report

Say exactly:

- which documents were uploaded vs skipped as unchanged
- any document that failed to upload
- whether `.dirty` was cleared (the script clears it on success)

Do not claim a document reached NotebookLM unless the script reported it uploaded and verified.
