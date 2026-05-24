# Allo Reservations

Reservation-first inventory for multiple warehouses built with Next.js, Prisma, and Postgres.

## Live deployment

- App: [allo-assignmnet-muni-fresh.vercel.app](https://allo-assignmnet-muni-fresh.vercel.app)
- Cron source: GitHub Actions workflow at `.github/workflows/cron-release-expired.yml`
- Required secrets: `DEPLOYMENT_URL` and `CRON_SECRET`

## What it does

- Lists products with per-warehouse availability.
- Creates atomic reservations with row-level locking.
- Confirms or releases reservations.
- Expires stale holds automatically through cleanup.
- Supports `Idempotency-Key` for reserve and confirm.

## Local setup

```bash
npm install
npm run prisma:generate
npm run dev
```

If you need the database first:

```bash
npx prisma migrate deploy
npm run db:seed
```

## Environment

- `DATABASE_URL`: Postgres connection string.
- `CRON_SECRET`: required for the secured cleanup route.

## Cron setup

1. Set `CRON_SECRET` in Vercel and GitHub.
2. Set `DEPLOYMENT_URL` in GitHub to the live app URL above.
3. Keep the secured cron route at `/api/cron/release-expired`.

## Repository layout

- `src/`: app routes, UI, and reservation logic.
- `prisma/`: schema, seed data, and migrations.
- `public/`: static assets.
- `scripts/`: local helper scripts.
- `allo-assessment/`: nested copy of the assessment app and its own README.

## Notes

- The root app is the main working copy.
- The reservation flow uses PostgreSQL transactions and `SELECT ... FOR UPDATE` for correctness.
```bash
npx prisma migrate deploy
npm run db:seed
```

## Environment

- `DATABASE_URL`: Postgres connection string.
- `CRON_SECRET`: required for the secured cleanup route.

## Cron setup

1. Set `CRON_SECRET` in Vercel and GitHub.
2. Set `DEPLOYMENT_URL` in GitHub to the live app URL above.
3. Keep the secured cron route at `/api/cron/release-expired`.

## Repository layout

- `src/`: app routes, UI, and reservation logic.
- `prisma/`: schema, seed data, and migrations.
- `public/`: static assets.
- `scripts/`: local helper scripts.
- `allo-assessment/`: nested copy of the assessment app and its own README.

## Notes

- The root app is the main working copy.
- The reservation flow uses PostgreSQL transactions and `SELECT ... FOR UPDATE` for correctness.