---
name: project-memory-status
description: Report whether the portfolio's NotebookLM project memory is CURRENT, STALE or UNAVAILABLE. Compares the current git SHA against the SHA the snapshot was synced at, the local document hashes against the sync manifest, plus NotebookLM authentication. Use when asked about project memory freshness, before relying on NotebookLM for an answer, or at the start of a session that will lean on historical context.
---

# Project memory status

Reports the freshness of the NotebookLM notebook `Manuel Ortiz Portfolio — Project Memory`
(alias `portfolio`) against the current repository state.

## Run this

```powershell
python scripts/notebooklm/sync-context.py --status
```

Exit code: `0` = CURRENT, `1` = STALE, `2` = UNAVAILABLE.

That command compares:

| Compared | Source |
|---|---|
| Current git SHA + working-tree cleanliness | `git` |
| SHA the snapshot was last synced at | `manifest.json` → `git_sha` |
| Per-document local sha256 | `.context/notebooklm/*.md` |
| Per-document synced sha256 + NotebookLM source id | `manifest.json` → `sources` |
| Notebook configured at all | `.context/notebooklm/config.json` |
| Authentication state | `nlm login --check` |

## Also check, and report

1. **Whether the snapshot would change if regenerated:**

   ```powershell
   python scripts/notebooklm/generate-context.py --check
   ```

   Exit `1` means the repository moved since the snapshot was written, even if the manifest still
   matches what is on disk. Report this as STALE.

2. **Whether the `.dirty` marker is set** (`.context/notebooklm/.dirty`). If present, a previous
   session flagged a meaningful change that has not been synced. Report what it says.

## Report format

State the verdict first, then the evidence:

```
CURRENT | STALE | UNAVAILABLE

Reason: <one sentence>

Git            <branch> @ <sha>  (clean | N changed paths)
Snapshot at    <manifest git_sha>
Documents      N current, N stale, N never uploaded
Regeneration   no change | would change <docs>
Auth           OK | expired | no profile
Dirty marker   set (<reason>) | not set
```

- **CURRENT** — every document hash matches the manifest, regeneration would change nothing, and
  authentication works.
- **STALE** — reachable but lagging the repository. Name the documents and recommend
  `/project-memory-sync`.
- **UNAVAILABLE** — no notebook configured, authentication missing/expired, or `nlm` not installed.
  Give the exact remedy (`nlm login`, or `python scripts/notebooklm/sync-context.py --setup`).

Do not report CURRENT unless you actually ran the commands and saw the result.
