# Deployment Guide — Vercel

This file describes exactly what to set in Vercel and the steps to deploy the `deploy-ready` branch.

## Required Environment Variables (set these in the Vercel project settings)

- `DATABASE_URL` — full Postgres connection string for the production database (example: `postgresql://user:pass@host:5432/neondb?schema=public`).
- `SHADOW_DATABASE_URL` (optional) — required only if you run migrations with Prisma on Vercel builds.
- `CRON_SECRET` — a random secret string used by the cron endpoint to authenticate requests.
- `NODE_ENV` — should be `production` (Vercel sets this automatically).

Optional / Useful:
- `VERCEL_TOKEN` — only if you plan to run `vercel` CLI from CI or locally; do NOT store it in the public repo.

## Vercel Project Settings

1. Create a new Vercel project and connect the GitHub repository `Allo-assignmnet_Muni`.
2. Under **Settings → Environment Variables**, add the variables above for both `Preview` and `Production` as appropriate.
3. Ensure the `Root Directory` is the repository root (where `package.json` lives).

## Build & Migrations

There are two common approaches to apply Prisma migrations and seed the production DB:

A) Manual approach (recommended for control):

1. Deploy the project on Vercel (it will run the build).
2. From a local machine (or CI runner) with access to the production `DATABASE_URL`, run:

```bash
# Install deps (if needed)
npm ci

# Generate Prisma client
npx prisma generate

# Apply migrations to production DB
npx prisma migrate deploy --schema=prisma/schema.prisma

# Run seed (if your seed script is configured)
npx prisma db seed --schema=prisma/schema.prisma
```

B) Automate during the Vercel build (use with caution):

Set the project `Build Command` (in Vercel settings) to:

```bash
npm run build && npx prisma migrate deploy --schema=prisma/schema.prisma && npx prisma db seed --schema=prisma/schema.prisma
```

Note: Running migrations during the build can lengthen builds and may fail if the build environment cannot reach the DB. Use approach A if you prefer safety.

## Cron (Vercel Scheduler)

This repo includes `vercel.json` with a cron schedule for `GET /api/cron/release-expired`. Verify the schedule in the Vercel dashboard after deployment:

- Project → Settings → Cron Jobs (or use the Vercel CLI to create schedules). Ensure `CRON_SECRET` is set and that the cron job calls the URL with that secret if required.

## Post-deploy verification

1. Open the deployed URL (Production) and verify the product catalog loads.
2. Call the cron route to confirm expiry cleanup (use the `CRON_SECRET` if configured):

```bash
curl -s "https://<your-deploy-url>/api/cron/release-expired?secret=$CRON_SECRET" | jq
```

3. Verify DB state (a sample check):

```sql
-- check reservations released
SELECT status, count(*) FROM reservations GROUP BY status;
```

## Creating the `deploy-ready` branch (local)

Run these commands locally in the repo root:

```bash
git checkout -b deploy-ready
git add DEPLOYMENT.md
git commit -m "chore: add deployment instructions"
git push -u origin deploy-ready
```

If you want me to push the branch for you, provide a GitHub token or give permission; otherwise push from your machine.

## Notes & Security

- Never commit secrets to the repository. Use Vercel's Environment Variables UI.
- Prefer manual migrations (approach A) for production safety.
- If your DB is hosted on Neon/Supabase, ensure network access/allowlist permits Vercel's build servers or your CI runner to connect.

---
If you want, I can also create a small `vercel-deploy.sh` script and attempt an automated push+deploy (requires `VERCEL_TOKEN`).
