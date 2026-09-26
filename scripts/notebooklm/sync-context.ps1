<#
.SYNOPSIS
    Synchronise the Manuel Ortiz Portfolio project-memory snapshot to NotebookLM.

.DESCRIPTION
    Thin wrapper over sync-context.py. Regenerates the local Markdown, hashes
    each document, and uploads only the ones whose hash differs from the
    manifest. A superseded NotebookLM source is deleted only after its
    replacement has been uploaded and verified. Sources that this manifest did
    not create are never touched, and the notebook is never deleted.

.PARAMETER Setup
    Find or create the notebook `Manuel Ortiz Portfolio - Project Memory`, set the
    `portfolio` alias, and write .context/notebooklm/config.json.

.PARAMETER Status
    Report local vs manifest vs remote state. Changes nothing.
    Exit codes: 0 = CURRENT, 1 = STALE, 2 = UNAVAILABLE.

.PARAMETER DryRun
    Show what would be uploaded. Touches nothing remote.

.PARAMETER Force
    Re-upload every document regardless of its hash.

.PARAMETER NoGenerate
    Skip regeneration and sync whatever is already on disk.

.EXAMPLE
    ./sync-context.ps1 -Setup
    ./sync-context.ps1 -Status
    ./sync-context.ps1 -DryRun
    ./sync-context.ps1
#>
[CmdletBinding()]
param(
    [switch]$Setup,
    [switch]$Status,
    [switch]$DryRun,
    [switch]$Force,
    [switch]$NoGenerate
)

$ErrorActionPreference = 'Stop'
$script = Join-Path $PSScriptRoot 'sync-context.py'

$python = (Get-Command python -ErrorAction SilentlyContinue).Source
if (-not $python) { $python = (Get-Command py -ErrorAction SilentlyContinue).Source }
if (-not $python) { throw 'Python was not found on PATH.' }

# `nlm` installs into ~/.local/bin, which is not always on PATH in a fresh shell.
$localBin = Join-Path $HOME '.local\bin'
if ((Test-Path $localBin) -and ($env:PATH -notlike "*$localBin*")) {
    $env:PATH = "$localBin;$env:PATH"
}

$argv = @($script)
if ($Setup)      { $argv += '--setup' }
if ($Status)     { $argv += '--status' }
if ($DryRun)     { $argv += '--dry-run' }
if ($Force)      { $argv += '--force' }
if ($NoGenerate) { $argv += '--no-generate' }

& $python @argv
exit $LASTEXITCODE
