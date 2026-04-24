$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $repoRoot

if (-not (Test-Path -LiteralPath '.git')) {
  throw 'This workspace is not initialized as a Git repository.'
}

$branch = (git symbolic-ref --quiet --short HEAD).Trim()
if (-not $branch) {
  $branch = 'main'
}

git add -A

$hasChanges = $LASTEXITCODE -eq 0 -and ((git status --porcelain) | Measure-Object).Count -gt 0
if (-not $hasChanges) {
  Write-Output 'No changes to back up.'
  exit 0
}

$timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
$commitMessage = "Daily backup $timestamp"

git commit -m $commitMessage
git push origin $branch

Write-Output "Backup pushed to origin/$branch with commit: $commitMessage"
