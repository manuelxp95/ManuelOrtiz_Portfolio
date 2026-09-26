#!/usr/bin/env python3
"""Regenerate the Manuel Ortiz Portfolio project-memory Markdown snapshots.

Reads package.json, framework/tooling config, docs/, CLAUDE.md, the file tree and
git. Nothing here touches the network.

Usage:
    python generate-context.py            regenerate in place
    python generate-context.py --check    exit 1 if anything would change; write nothing
"""

from __future__ import annotations

import argparse
import datetime as _dt
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

# Windows consoles default to a legacy code page; force UTF-8 so the em dashes
# in the snapshot titles do not mangle.
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass


from _common import (  # noqa: E402
    AUTHORED_DOCS,
    GENERATED_DOCS,
    content_hash,
    context_dir,
    git_info,
    load_json,
    read_text,
    repo_files,
    repo_root,
)
from _render import CONFIG_FILES, RENDERERS  # noqa: E402

CODE_SUFFIXES = (".js", ".mjs", ".ts", ".tsx", ".jsx")
HEAVY_IMPORT = re.compile(r"""(?:from\s*|import\s*\(\s*|require\(\s*)['"](three|@react-three/[\w-]+)[/'"]""")


def build_context() -> dict:
    root = repo_root()
    files = repo_files()
    sizes = {f: (root / f).stat().st_size for f in files}

    wanted = set(CONFIG_FILES) | {"CLAUDE.md", "docs/architecture.md", "docs/Roadmap.md"}
    texts: dict[str, str] = {}
    for f in files:
        if f in wanted or (f.startswith(("docs/adr/", ".claude/skills/")) and f.endswith(".md")):
            t = read_text(root / f)
            if t is not None:
                texts[f] = t

    heavy: dict[str, list[str]] = {}
    for f in files:
        if f.endswith(CODE_SUFFIXES) and not f.startswith(("public/", "scripts/")):
            t = read_text(root / f) or ""
            libs = sorted(set(HEAVY_IMPORT.findall(t)))
            if libs:
                heavy[f] = libs

    top_counts: dict[str, int] = {}
    for f in files:
        top = f.split("/", 1)[0] + ("/" if "/" in f else "")
        top_counts[top] = top_counts.get(top, 0) + 1

    return {
        "now": _dt.datetime.now(_dt.timezone.utc).replace(microsecond=0).isoformat(),
        "git": git_info(),
        "package": load_json(root / "package.json", {}),
        "files": files,
        "sizes": sizes,
        "texts": texts,
        "heavy_imports": heavy,
        "top_counts": top_counts,
    }


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--check", action="store_true",
                    help="report whether anything would change; write nothing")
    args = ap.parse_args()

    cd = context_dir()
    cd.mkdir(parents=True, exist_ok=True)
    ctx = build_context()

    created: list[str] = []
    updated: list[str] = []
    unchanged: list[str] = []

    for name in GENERATED_DOCS:
        p = cd / name
        new = RENDERERS[name](ctx)
        if p.exists():
            if content_hash(p.read_text(encoding="utf-8")) == content_hash(new):
                unchanged.append(name)
                continue
            bucket = updated
        else:
            bucket = created
        if not args.check:
            p.write_text(new, encoding="utf-8", newline="\n")
        bucket.append(name)

    for name in AUTHORED_DOCS:
        if (cd / name).exists():
            unchanged.append(f"{name} (hand-maintained, untouched)")
        else:
            print(f"  WARNING: {name} is missing. It is hand-maintained and is not regenerated.")

    for n in created:
        print(f"  created   {n}")
    for n in updated:
        print(f"  updated   {n}")
    for n in sorted(unchanged):
        print(f"  unchanged {n}")

    if args.check:
        return 1 if (created or updated) else 0
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
