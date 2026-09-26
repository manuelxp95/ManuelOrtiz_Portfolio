#!/usr/bin/env python3
"""Incrementally synchronise the Manuel Ortiz Portfolio project-memory snapshot to NotebookLM.

NotebookLM local-file sources are immutable snapshots: a changed document must be
re-uploaded as a NEW source and the old one retired. This script does that safely.

Per document, in order:
  1. regenerate the local Markdown (generate-context.py)
  2. hash it (sha256, with volatile timestamp lines excluded)
  3. if the hash matches the manifest -> do nothing
  4. otherwise upload the new file as a new source (`nlm source add --wait --json`)
  5. verify the new source is actually present in the notebook
  6. only then delete the superseded source
  7. rewrite the manifest atomically
  8. never delete a source that this manifest did not create

The whole notebook is never deleted. Sources not recorded in the manifest are never
touched, so anything you add to the notebook by hand survives.

Usage:
    python sync-context.py --setup       find or create the notebook, set the alias, write config.json
    python sync-context.py               regenerate + sync changed documents
    python sync-context.py --dry-run     show what would change; touch nothing remote
    python sync-context.py --status      report local vs manifest vs remote state
    python sync-context.py --force       re-upload every document regardless of hash
"""

from __future__ import annotations

import argparse
import datetime as _dt
import json
import shutil
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

# Windows consoles default to a legacy code page; force UTF-8 so the em dashes
# and box characters in the snapshot titles do not mangle.
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass


from _common import (  # noqa: E402
    ALL_DOCS,
    CONFIG_PATH,
    DIRTY_PATH,
    NOTEBOOK_ALIAS,
    NOTEBOOK_TITLE,
    PROJECT,
    context_dir,
    file_hash,
    git_info,
    load_json,
    repo_root,
    write_json_atomic,
)


def now() -> str:
    return _dt.datetime.now(_dt.timezone.utc).replace(microsecond=0).isoformat()


# ----------------------------------------------------------------- nlm shim

def nlm_path() -> str:
    exe = shutil.which("nlm")
    if exe:
        return exe
    for cand in (Path.home() / ".local/bin/nlm.exe", Path.home() / ".local/bin/nlm"):
        if cand.exists():
            return str(cand)
    raise SystemExit("nlm not found on PATH. Install with: uv tool install --force notebooklm-mcp-cli")


def nlm(*args: str, json_out: bool = True, timeout: int = 900) -> tuple[int, object, str]:
    """Run an nlm command. Returns (returncode, parsed-json-or-raw-text, stderr)."""
    cmd = [nlm_path(), *args]
    if json_out and "--json" not in args:
        cmd.append("--json")
    proc = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8",
                          errors="replace", timeout=timeout)
    # Some nlm subcommands produce no stdout at all, which surfaces as None here.
    out = (proc.stdout or "").strip()
    parsed: object = out
    if json_out and out:
        try:
            parsed = json.loads(out)
        except json.JSONDecodeError:
            parsed = out
    return proc.returncode, parsed, (proc.stderr or "").strip()


def check_auth() -> tuple[bool, str]:
    rc, out, err = nlm("login", "--check", json_out=False, timeout=120)
    text = f"{out}\n{err}".strip()
    return rc == 0, text


# --------------------------------------------------------------- generation

def regenerate() -> None:
    script = Path(__file__).resolve().parent / "generate-context.py"
    proc = subprocess.run([sys.executable, str(script)], capture_output=True, text=True)
    sys.stdout.write(proc.stdout)
    if proc.returncode != 0:
        sys.stderr.write(proc.stderr)
        raise SystemExit(f"generate-context.py failed with exit {proc.returncode}")


def local_hashes() -> dict[str, str]:
    cd = context_dir()
    out: dict[str, str] = {}
    for name in ALL_DOCS:
        p = cd / name
        if p.exists():
            out[name] = file_hash(p)
    return out


# -------------------------------------------------------------------- setup

def _iter_notebooks(payload) -> list[dict]:
    if isinstance(payload, dict):
        for key in ("notebooks", "results", "data", "items"):
            if isinstance(payload.get(key), list):
                return payload[key]
        return []
    return payload if isinstance(payload, list) else []


def _nb_id(nb: dict) -> str:
    for k in ("id", "notebook_id", "notebookId", "uuid"):
        if nb.get(k):
            return str(nb[k])
    return ""


def _nb_title(nb: dict) -> str:
    for k in ("title", "name", "emoji_title"):
        if nb.get(k):
            return str(nb[k])
    return ""


def cmd_setup(args) -> int:
    ok, msg = check_auth()
    if not ok:
        print("NOT AUTHENTICATED.\n" + msg)
        print("\nRun `nlm login` in your terminal (it opens a browser), then re-run --setup.")
        return 2

    rc, payload, err = nlm("notebook", "list")
    if rc != 0:
        print(f"nlm notebook list failed: {err or payload}")
        return 1

    existing = None
    for nb in _iter_notebooks(payload):
        title = _nb_title(nb)
        if title.strip().endswith(NOTEBOOK_TITLE):
            existing = nb
            break

    if existing:
        nb_id = _nb_id(existing)
        print(f"Reusing existing notebook: {_nb_title(existing)}  ({nb_id})")
    else:
        rc, payload, err = nlm("notebook", "create", NOTEBOOK_TITLE)
        if rc != 0:
            print(f"nlm notebook create failed: {err or payload}")
            return 1
        nb = payload if isinstance(payload, dict) else {}
        nb_id = _nb_id(nb.get("notebook", nb) if isinstance(nb, dict) else {})
        if not nb_id:
            print(f"Could not read the new notebook id from: {payload}")
            return 1
        print(f"Created notebook: {NOTEBOOK_TITLE}  ({nb_id})")

    rc, _, err = nlm("alias", "set", NOTEBOOK_ALIAS, nb_id, json_out=False)
    print(f"Alias `{NOTEBOOK_ALIAS}` -> {nb_id}" if rc == 0 else f"alias set failed: {err}")

    cfg_path = context_dir() / CONFIG_PATH
    cfg = load_json(cfg_path, {})
    cfg.update({
        "project": PROJECT,
        "notebook_alias": NOTEBOOK_ALIAS,
        "notebook_id": nb_id,
        "notebook_title": NOTEBOOK_TITLE,
    })
    write_json_atomic(cfg_path, cfg)
    print(f"Wrote {cfg_path.relative_to(repo_root()).as_posix()} (git-ignored: contains a user-specific id)")
    return 0


# --------------------------------------------------------------------- sync

def notebook_ref() -> str:
    cfg = load_json(context_dir() / CONFIG_PATH, {})
    ref = cfg.get("notebook_id") or cfg.get("notebook_alias")
    if not ref:
        raise SystemExit("No notebook configured. Run: python sync-context.py --setup")
    return str(ref)


def remote_sources(ref: str) -> dict[str, str]:
    """Map source id -> title for the notebook."""
    rc, payload, err = nlm("source", "list", ref)
    if rc != 0:
        raise SystemExit(f"nlm source list failed: {err or payload}")
    items = payload
    if isinstance(payload, dict):
        for k in ("sources", "results", "data", "items"):
            if isinstance(payload.get(k), list):
                items = payload[k]
                break
    out: dict[str, str] = {}
    if isinstance(items, list):
        for s in items:
            if isinstance(s, dict):
                sid = s.get("id") or s.get("source_id") or s.get("sourceId")
                if sid:
                    out[str(sid)] = str(s.get("title") or s.get("name") or "")
    return out


def _added_source_id(payload) -> str:
    if isinstance(payload, dict):
        for k in ("source_id", "sourceId", "id"):
            if payload.get(k):
                return str(payload[k])
        for k in ("source", "result", "data"):
            inner = payload.get(k)
            if isinstance(inner, dict):
                for kk in ("source_id", "sourceId", "id"):
                    if inner.get(kk):
                        return str(inner[kk])
            if isinstance(inner, list) and inner and isinstance(inner[0], dict):
                for kk in ("source_id", "sourceId", "id"):
                    if inner[0].get(kk):
                        return str(inner[0][kk])
    return ""


def cmd_sync(args) -> int:
    if not args.no_generate:
        print("Regenerating local snapshot...")
        regenerate()

    manifest = load_json(context_dir() / "manifest.json", {"version": 1, "sources": {}})
    manifest.setdefault("sources", {})
    local = local_hashes()

    pending = [n for n in ALL_DOCS
               if n in local and (args.force or manifest["sources"].get(n, {}).get("sha256") != local[n])]

    if not pending:
        print("\nAll documents already match the manifest. Nothing to upload.")
        _clear_dirty()
        return 0

    print(f"\n{len(pending)} document(s) need uploading:")
    for n in pending:
        old = manifest["sources"].get(n, {}).get("sha256")
        print(f"  {n}  {'(new)' if not old else f'{old[:12]} -> {local[n][:12]}'}")

    if args.dry_run:
        print("\n--dry-run: nothing was uploaded.")
        return 0

    ok, msg = check_auth()
    if not ok:
        print("\nNOT AUTHENTICATED.\n" + msg)
        print("Run `nlm login` in your terminal, then re-run this script.")
        return 2

    ref = notebook_ref()
    manifest["notebook_id"] = ref
    cd = context_dir()
    failures = 0

    for name in pending:
        path = (cd / name).resolve()
        print(f"\n-> {name}")
        rc, payload, err = nlm("source", "add", ref, "--file", str(path),
                               "--title", name, "--wait")
        if rc != 0:
            print(f"   upload FAILED: {err or payload}")
            failures += 1
            continue
        new_id = _added_source_id(payload)
        if not new_id:
            print(f"   upload returned no source id; response: {payload}")
            failures += 1
            continue
        print(f"   uploaded as {new_id}")

        # Step 5: verify the new source really exists before retiring the old one.
        try:
            present = remote_sources(ref)
        except SystemExit as e:
            print(f"   verification failed ({e}); keeping the old source")
            failures += 1
            continue
        if new_id not in present:
            print("   new source not visible in the notebook yet; keeping the old source")
            failures += 1
            continue
        print("   verified present")

        old = manifest["sources"].get(name, {})
        old_id = old.get("source_id")

        # Step 7: record the new source BEFORE deleting the old one, so a crash
        # between the two leaves a redundant source rather than a lost one.
        manifest["sources"][name] = {
            "filename": name,
            "sha256": local[name],
            "source_id": new_id,
            "last_synced": now(),
        }
        write_json_atomic(cd / "manifest.json", manifest)

        # Step 6/8: only ever delete an id this manifest itself recorded.
        if old_id and old_id != new_id:
            if old_id in present:
                rc, payload, err = nlm("source", "delete", old_id, "--confirm")
                print(f"   retired superseded source {old_id}"
                      if rc == 0 else f"   could not delete {old_id}: {err or payload}")
            else:
                print(f"   superseded source {old_id} is already gone")

    manifest["last_run"] = now()
    manifest["git_sha"] = git_info()["sha"]
    write_json_atomic(cd / "manifest.json", manifest)

    if failures:
        print(f"\nCompleted with {failures} failure(s). The manifest reflects only what succeeded.")
        return 1
    print("\nSync complete.")
    _clear_dirty()
    return 0


def _clear_dirty() -> None:
    d = context_dir() / DIRTY_PATH
    if d.exists():
        d.unlink()
        print("Cleared the .dirty marker.")


# ------------------------------------------------------------------- status

def cmd_status(args) -> int:
    cd = context_dir()
    cfg = load_json(cd / CONFIG_PATH, {})
    manifest = load_json(cd / "manifest.json", {"sources": {}})
    local = local_hashes()
    g = git_info()

    tree = "working tree clean" if g["dirty_count"] == 0 else f"{g['dirty_count']} changed path(s)"
    print(f"Project     {PROJECT}")
    print(f"Git         {g['branch']} @ {g['short_sha']}  ({tree})")
    print(f"Notebook    {cfg.get('notebook_title', '(not configured)')}"
          f"  alias={cfg.get('notebook_alias', '-')}  id={cfg.get('notebook_id', '-')}")
    print(f"Dirty flag  {'SET' if (cd / DIRTY_PATH).exists() else 'not set'}")
    print(f"Last sync   {manifest.get('last_run', 'never')}  (at git {manifest.get('git_sha', '-')[:12]})")

    print("\nDocument                          local sha    manifest sha  state")
    stale = 0
    for name in ALL_DOCS:
        lh = local.get(name)
        mh = manifest.get("sources", {}).get(name, {}).get("sha256")
        if lh is None:
            state = "MISSING LOCALLY"
        elif mh is None:
            state = "NEVER UPLOADED"
            stale += 1
        elif lh != mh:
            state = "STALE"
            stale += 1
        else:
            state = "current"
        print(f"  {name:<32} {(lh or '-')[:12]}  {(mh or '-')[:12]}  {state}")

    ok, msg = check_auth()
    print(f"\nNotebookLM auth  {'OK' if ok else 'NOT AUTHENTICATED'}")
    if not ok:
        print("  " + msg.replace("\n", "\n  "))

    if not cfg.get("notebook_id"):
        print("\nOverall: UNAVAILABLE — no notebook configured (run --setup).")
        return 2
    if not ok:
        print("\nOverall: UNAVAILABLE — NotebookLM authentication is missing or expired.")
        return 2
    if stale:
        print(f"\nOverall: STALE — {stale} document(s) differ from what NotebookLM holds.")
        return 1
    print("\nOverall: CURRENT")
    return 0


# --------------------------------------------------------------------- main

def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--setup", action="store_true", help="find or create the notebook and write config.json")
    ap.add_argument("--status", action="store_true", help="report state; change nothing")
    ap.add_argument("--dry-run", action="store_true", help="show what would upload; touch nothing remote")
    ap.add_argument("--force", action="store_true", help="re-upload every document regardless of hash")
    ap.add_argument("--no-generate", action="store_true", help="skip regeneration; sync what is on disk")
    args = ap.parse_args()

    if args.setup:
        return cmd_setup(args)
    if args.status:
        return cmd_status(args)
    return cmd_sync(args)


if __name__ == "__main__":
    raise SystemExit(main())
