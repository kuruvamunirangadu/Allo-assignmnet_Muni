**Automating GitHub secrets + workflow (safe, local steps)**

- What these scripts do:
  - Generate a cryptographically-secure `CRON_SECRET` locally.
  - Set GitHub Actions repository secrets `DEPLOYMENT_URL` and `CRON_SECRET` using the `gh` CLI.
  - Optionally trigger the `cron-release-expired` workflow.

- Files added:
  - `scripts/setup-cron-secrets.ps1` — PowerShell script for Windows.
  - `scripts/setup-cron-secrets.sh` — Bash script for macOS/Linux/WSL.

- Prerequisites:
  - `node` installed (for generating random secret)
  - `gh` (GitHub CLI) installed and authenticated via `gh auth login`
  - (Optional) `vercel` CLI for adding Vercel env var, or use Vercel Dashboard

- Usage (Windows PowerShell):
  - Open PowerShell in the repository root and run:
    - `.\	emplates\scripts\setup-cron-secrets.ps1` (or copy the path `scripts/setup-cron-secrets.ps1`)

- Usage (macOS/Linux/WSL):
  - Make script executable and run:
    - `chmod +x scripts/setup-cron-secrets.sh`
    - `./scripts/setup-cron-secrets.sh`

- Vercel env var (manual step):
  - After the scripts set GitHub secrets, add the same `CRON_SECRET` to Vercel:
    - Using Vercel CLI: `vercel env add CRON_SECRET production` and paste the secret when prompted.
    - Using the Dashboard: Project → Settings → Environment Variables → Add `CRON_SECRET`.

If you want, run the appropriate script now and reply "done" when complete; I'll verify the workflow run logs and help troubleshoot any errors.
