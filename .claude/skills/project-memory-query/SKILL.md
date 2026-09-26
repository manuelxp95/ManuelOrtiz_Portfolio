---
name: project-memory-query
description: Ask the portfolio's NotebookLM project memory about architecture history, roadmap rationale, past decisions, previous approaches, or cross-cutting project understanding. Use when the answer depends on why something was built or planned a certain way rather than on what the code says today. Always verify any current-state claim it returns against git or the files before acting on it.
---

# Query project memory

Queries the NotebookLM notebook `Manuel Ortiz Portfolio — Project Memory` (alias `portfolio`).

## What this is for

NotebookLM holds **historical and contextual** memory: architecture rationale, roadmap phases and
their reasoning, decisions, known issues, and cross-session understanding. It is not a source of
truth for current state.

**Authority order — never invert it:**

```
1. Git working tree   current code and config state
2. CLAUDE.md          project operating rules
3. docs/              architecture.md, Roadmap.md, adr/
4. NotebookLM         historical / contextual memory
```

Good questions:

- *Why is Card Mode deferred to after Classic in the roadmap?*
- *What was decided about deployment and URL migration?*
- *Why are game-dev and backend tags rather than sections?*
- *What known issues were recorded about the legacy site?*

Bad questions (answer from the repository instead):

- *Which dependencies are installed right now?* → read `package.json`
- *Does `src/domain/` exist?* → look
- *What changed in the last commit?* → `git log`

## How to query

Use the MCP tool `notebook_query`. **Resolve the notebook reference first — do not pass the alias
blind**; the MCP server does not resolve aliases (it returns `NOT_FOUND`), the UUID works.

```powershell
python -c "import json;c=json.load(open('.context/notebooklm/config.json'));print(c.get('notebook_id') or c.get('notebook_alias'))"
```

Call `notebook_query` with that value as `notebook_id`. The UUID is account-specific and lives only
in the git-ignored `.context/notebooklm/config.json` — never paste it into a tracked file.

If `config.json` is missing, the notebook is not set up on this machine — run
`python scripts/notebooklm/sync-context.py --setup`.

Equivalent CLI (resolves the alias):

```powershell
nlm query notebook portfolio "<question>" --json
```

The MCP server `gemini-notebook-mcp` is registered at **local** scope for this project and is
restricted to read/query tools. It cannot add, rename or delete sources — deliberate. All source
mutation goes through `scripts/notebooklm/sync-context.py`.

## After you get an answer

1. **Check the snapshot's age.** `90-current-project-state.md` records the commit it was generated
   from. If `/project-memory-status` says STALE, say so alongside the answer.
2. **Verify every current-state claim** against the working tree (files) or history (`git log`).
3. **Report conflicts; do not resolve them silently.** If NotebookLM disagrees with the repository:
   treat NotebookLM as stale, **do not** change the project to match it, state both versions and
   their sources, and suggest `/project-memory-sync`.
4. **Distinguish recorded fact from inference or proposal.** `60-decisions.md` marks entries as
   `Accepted`, `Proposed` or `Inferred`. Carry the qualifier through — never upgrade a roadmap
   proposal into an accepted decision.

## If the query fails

- Authentication error → tell the user to run `nlm login` (opens a browser). Do not authenticate
  on their behalf.
- Notebook not found → `python scripts/notebooklm/sync-context.py --setup`.
- Rate limited → `nlm usage` reports the windows and when they reset.
