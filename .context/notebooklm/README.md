# `.context/notebooklm/`

Generated project-memory snapshot for the NotebookLM notebook
**`Manuel Ortiz Portfolio — Project Memory`** (alias `portfolio`).

The numbered Markdown files are the **only** thing ever uploaded to NotebookLM. The MCP server's
`NOTEBOOKLM_ALLOWED_FILE_DIRS` is pinned to this directory so nothing outside it can be ingested.
`.env*`, `node_modules/`, `.next/` and `public/` binaries are never uploaded.

## Files

| File | Maintained by | Tracked in git |
|---|---|---|
| `00-project-overview.md` | generated | yes |
| `10-architecture.md` | generated — verbatim `CLAUDE.md` + `docs/architecture.md` + `docs/adr/*.md` | yes |
| `20-roadmap.md` | generated — verbatim `docs/Roadmap.md` | yes |
| `30-codebase-inventory.md` | generated | yes |
| `40-roadmap-progress.md` | generated — filesystem evidence per phase, never a verdict | yes |
| `50-build-deploy-config.md` | generated | yes |
| `60-decisions.md` | **hand-maintained** — append only, never regenerated | yes |
| `70-known-issues.md` | **hand-maintained** — never regenerated | yes |
| `90-current-project-state.md` | generated | yes |
| `config.json` | `sync-context.py --setup` | **no** — user-specific notebook id |
| `manifest.json` | `sync-context.py` | **no** — user-specific source ids |
| `.dirty` | manual, when a sync is due | **no** |

`config.example.json` and `manifest.example.json` are tracked so the shape is documented.

## Regenerating

```powershell
# local only, no network
python scripts/notebooklm/generate-context.py

# regenerate + upload only what changed
python scripts/notebooklm/sync-context.py
```

Generation is deterministic: the same repository state produces byte-identical Markdown. Timestamp
lines are excluded from the sha256 used for change detection, and the snapshot's own files are
excluded from the inventory and git status it records, so regenerating alone never forces a
re-upload.

## Do not hand-edit the generated files

Edits to a generated document are overwritten on the next run. Put durable knowledge in
`60-decisions.md` or `70-known-issues.md`, edit the source doc (`docs/`, `CLAUDE.md`), or change the
renderer in `scripts/notebooklm/_render.py`.
