<#
Simple Conventional Commit helper for PowerShell
Usage: .\git-commit.ps1 -Type feat -Scope api
#>
param(
    [Parameter(Mandatory=$true)][string]$Type,
    [string]$Scope
)

$summary = Read-Host "Short summary (imperative, present tense)"
if ([string]::IsNullOrWhiteSpace($summary)) {
    Write-Error "Aborting: empty summary"
    exit 1
}

if ([string]::IsNullOrWhiteSpace($Scope)) {
    $header = "$Type: $summary"
} else {
    $header = "$Type($Scope): $summary"
}

Write-Host "Staging all changes..."
git add -A

Write-Host "Commit message: $header"
$confirm = Read-Host "Proceed with commit? [y/N]"
if ($confirm -match '^[Yy]') {
    git commit -m $header
    Write-Host "Committed: $header"
} else {
    Write-Host "Aborted by user."
}
