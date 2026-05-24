<#
Setup script for Windows (PowerShell).
Generates a CRON_SECRET, sets GitHub Actions secrets (DEPLOYMENT_URL and CRON_SECRET),
and optionally triggers the workflow. Requires `gh` CLI and `node` installed and logged in.

Usage: Open PowerShell in the repo root and run:
  .\scripts\setup-cron-secrets.ps1

This script will NOT ask for or transmit your Vercel token. To add the Vercel env var, run the shown `vercel` command locally.
#>

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Error "Node.js is required but not found in PATH. Install Node.js and try again."
  exit 1
}
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  Write-Error "GitHub CLI (gh) is required but not found in PATH. Install and run 'gh auth login' first."
  exit 1
}

$repoDefault = 'kuruvamunirangadu/Allo-assignmnet_Muni'
$repo = Read-Host "Enter GitHub repo (owner/repo) [$repoDefault]"
if ([string]::IsNullOrWhiteSpace($repo)) { $repo = $repoDefault }

$deploymentUrl = Read-Host "Enter your DEPLOYMENT_URL (e.g. https://your-app.vercel.app)"
if ([string]::IsNullOrWhiteSpace($deploymentUrl)) {
  Write-Error "DEPLOYMENT_URL is required."
  exit 1
}

$secret = node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
Write-Host "Generated CRON_SECRET: (hidden)"

Write-Host "Setting GitHub secrets for repository $repo..."
gh secret set DEPLOYMENT_URL --body $deploymentUrl --repo $repo
if ($LASTEXITCODE -ne 0) { Write-Error "Failed to set DEPLOYMENT_URL"; exit 1 }

gh secret set CRON_SECRET --body $secret --repo $repo
if ($LASTEXITCODE -ne 0) { Write-Error "Failed to set CRON_SECRET"; exit 1 }

Write-Host "GitHub secrets set successfully."

Write-Host "Next step: add the same CRON_SECRET to your Vercel project environment variables."
Write-Host "If you have the Vercel CLI installed and logged in, run this command and paste the generated secret when prompted:"
Write-Host "  vercel env add CRON_SECRET production"
Write-Host "Or add it via the Vercel Dashboard → Project → Settings → Environment Variables."

$run = Read-Host "Trigger the workflow now? (y/N)"
if ($run -match '^[Yy]') {
  gh workflow run cron-release-expired.yml --repo $repo
  if ($LASTEXITCODE -eq 0) { Write-Host "Workflow triggered." } else { Write-Error "Failed to trigger workflow." }
}

Write-Host "Done. Keep the generated secret safe; it is stored only in GitHub Secrets and your Vercel env var when you add it."
