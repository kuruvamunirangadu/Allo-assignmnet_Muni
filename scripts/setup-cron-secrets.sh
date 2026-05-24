#!/usr/bin/env bash
# Setup script for POSIX shells (Linux / macOS / WSL).
# Generates a CRON_SECRET, sets GitHub Actions secrets (DEPLOYMENT_URL and CRON_SECRET),
# and optionally triggers the workflow. Requires `gh` CLI and `node` installed and logged in.

set -euo pipefail

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required but not found in PATH. Install Node.js and try again." >&2
  exit 1
fi
if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI (gh) is required but not found in PATH. Install and run 'gh auth login' first." >&2
  exit 1
fi

repo_default="kuruvamunirangadu/Allo-assignmnet_Muni"
read -rp "Enter GitHub repo (owner/repo) [${repo_default}]: " repo
repo=${repo:-$repo_default}

read -rp "Enter your DEPLOYMENT_URL (e.g. https://your-app.vercel.app): " deployment_url
if [ -z "$deployment_url" ]; then
  echo "DEPLOYMENT_URL is required." >&2
  exit 1
fi

secret=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo "Generated CRON_SECRET: (hidden)"

echo "Setting GitHub secrets for repository $repo..."
gh secret set DEPLOYMENT_URL --body "$deployment_url" --repo "$repo"
gh secret set CRON_SECRET --body "$secret" --repo "$repo"

echo "GitHub secrets set successfully."
echo "Next step: add the same CRON_SECRET to your Vercel project environment variables."
echo "If you have the Vercel CLI installed and logged in, run this command and paste the generated secret when prompted:" 
echo "  vercel env add CRON_SECRET production"
echo "Or add it via the Vercel Dashboard → Project → Settings → Environment Variables."

read -rp "Trigger the workflow now? (y/N): " run
if [[ "$run" =~ ^[Yy]$ ]]; then
  gh workflow run cron-release-expired.yml --repo "$repo"
  echo "Workflow triggered. Check GitHub Actions for run logs." 
fi

echo "Done. Keep the generated secret safe; it is stored only in GitHub Secrets and your Vercel env var when you add it."
