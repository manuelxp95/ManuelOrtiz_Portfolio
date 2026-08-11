---
name: verify-feature
description: Definition-of-done check after implementation — inspect the diff, run the relevant checks (typecheck, lint, tests, build), detect unrelated modifications, verify architecture invariants and no content duplication, report remaining risks. Use before reporting a feature as complete. Never claims success without actually running the checks.
---

# verify-feature

Trigger: after implementation, before telling the user a feature is done.

Scope: verification only. Do not silently fix unrelated issues found along the way — report them.

## Steps

1. **Inspect the diff** (`git diff` / `git status`) — confirm the change matches the stated scope;
   flag anything unrelated.
2. **Run the checks that actually exist** in this repo's `package.json` at the time (typecheck,
   lint, build, tests). Only reference scripts that are actually defined — check `package.json`
   first, don't assume.
3. **Detect unrelated modifications** — files touched that aren't explained by the feature.
4. **Verify architecture invariants**:
   - single content source not duplicated between Classic and Card Mode
   - mode-agnostic section ids preserved
   - client boundaries still narrow
   - no new Three/R3F leakage outside its isolated boundary
5. **Report remaining risks** — anything not covered by the checks that ran (e.g. no visual/manual
   check of Card Mode on mobile if that wasn't done).

## Output

- **Checks run** — exact commands, with pass/fail.
- **Diff scope** — in-scope vs unrelated changes found.
- **Architecture invariants** — pass/fail per invariant above.
- **Remaining risks** — explicit, not hand-waved.
- **Verdict** — done / not done, one line.

Never report a check as passing without having actually run it.
