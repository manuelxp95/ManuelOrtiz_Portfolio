<#
.SYNOPSIS
    Regenerate the Manuel Ortiz Portfolio project-memory Markdown snapshot.

.DESCRIPTION
    Thin wrapper over generate-context.py. Filesystem-derived only: it reads
    package.json, framework/tooling config, docs/, CLAUDE.md, the file tree and
    git. It never touches the network.

.PARAMETER Check
    Report whether anything would change and exit 1 if so. Writes nothing.

.EXAMPLE
    ./generate-context.ps1
    ./generate-context.ps1 -Check
#>
[CmdletBinding()]
param(
    [switch]$Check
)

$ErrorActionPreference = 'Stop'
$script = Join-Path $PSScriptRoot 'generate-context.py'

$python = (Get-Command python -ErrorAction SilentlyContinue).Source
if (-not $python) { $python = (Get-Command py -ErrorAction SilentlyContinue).Source }
if (-not $python) { throw 'Python was not found on PATH.' }

$argv = @($script)
if ($Check) { $argv += '--check' }

& $python @argv
exit $LASTEXITCODE
