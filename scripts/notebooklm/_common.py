"""Shared helpers for the Manuel Ortiz Portfolio NotebookLM project-memory scripts.

Nothing here talks to the network. Generation is deterministic: the same repo
state must produce byte-identical Markdown, so that unchanged documents hash
identically and the sync step can skip them.
"""

from __future__ import annotations

import hashlib
import json
import os
import re
import subprocess
from pathlib import Path

PROJECT = "ManuelOrtiz_Portfolio"
NOTEBOOK_TITLE = "Manuel Ortiz Portfolio — Project Memory"
NOTEBOOK_ALIAS = "portfolio"

# ---------------------------------------------------------------- locations

def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def context_dir() -> Path:
    return repo_root() / ".context" / "notebooklm"


CONFIG_PATH = "config.json"
MANIFEST_PATH = "manifest.json"
DIRTY_PATH = ".dirty"

# Documents the generator owns end to end. 60/70 are hand-maintained: the
# generator never overwrites them.
GENERATED_DOCS = [
    "00-project-overview.md",
    "10-architecture.md",
    "20-roadmap.md",
    "30-codebase-inventory.md",
    "40-roadmap-progress.md",
    "50-build-deploy-config.md",
    "90-current-project-state.md",
]
AUTHORED_DOCS = [
    "60-decisions.md",
    "70-known-issues.md",
]
ALL_DOCS = sorted(GENERATED_DOCS + AUTHORED_DOCS)

# ------------------------------------------------------------------ hashing

# Lines that change on every run even when nothing else did. They are excluded
# from the content hash so a regeneration alone never forces a re-upload.
VOLATILE_LINE = re.compile(r"^(<!-- generated-at:|_Snapshot generated: )")


def stable_text(text: str) -> str:
    keep = [l for l in text.splitlines() if not VOLATILE_LINE.match(l)]
    return "\n".join(keep) + "\n"


def content_hash(text: str) -> str:
    return hashlib.sha256(stable_text(text).encode("utf-8")).hexdigest()


def file_hash(path: Path) -> str:
    return content_hash(path.read_text(encoding="utf-8"))


# ---------------------------------------------------------------------- git

def _git(*args: str) -> str:
    try:
        out = subprocess.run(
            ["git", *args],
            cwd=repo_root(),
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            check=False,
        )
        return out.stdout.strip() if out.returncode == 0 else ""
    except OSError:
        return ""


SELF_PREFIX = ".context/notebooklm/"


def git_info() -> dict:
    # The snapshot's own files are excluded so writing them never changes the
    # snapshot, which would leave `generate-context.py --check` permanently dirty.
    status = _git("status", "--porcelain", "--untracked-files=all")
    entries = [l for l in status.splitlines() if l.strip() and not l[3:].strip('"').startswith(SELF_PREFIX)]
    return {
        "branch": _git("rev-parse", "--abbrev-ref", "HEAD") or "(unknown)",
        "sha": _git("rev-parse", "HEAD") or "(unknown)",
        "short_sha": _git("rev-parse", "--short", "HEAD") or "(unknown)",
        "subject": _git("log", "-1", "--pretty=%s") or "(unknown)",
        "commit_date": _git("log", "-1", "--date=iso-strict", "--pretty=%ad") or "(unknown)",
        "dirty_count": len(entries),
        "dirty_files": sorted(e[3:] for e in entries)[:40],
        "recent": _git("log", "-15", "--pretty=%h %ad %s", "--date=short").splitlines(),
        "remote": _git("remote", "get-url", "origin"),
        "branches": sorted(b.strip("* ").strip() for b in _git("branch", "--list").splitlines()),
    }


def repo_files() -> list[str]:
    """Tracked plus untracked-but-not-ignored files, POSIX paths, sorted."""
    out = _git("ls-files", "--cached", "--others", "--exclude-standard")
    root = repo_root()
    return sorted(f for f in out.splitlines()
                  if f and not f.startswith(SELF_PREFIX) and (root / f).is_file())


# ------------------------------------------------------------- config/state

def load_json(path: Path, default):
    if not path.exists():
        return default
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return default


def write_json_atomic(path: Path, data) -> None:
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(data, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    os.replace(tmp, path)


def read_text(path: Path) -> str | None:
    try:
        return path.read_text(encoding="utf-8")
    except (OSError, UnicodeDecodeError):
        return None
