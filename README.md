# Allo Assessment

This folder contains the assessment app variant of the Allo reservations project.

## Live deployment

- App: [allo-assignmnet-muni-fresh.vercel.app](https://allo-assignmnet-muni-fresh.vercel.app)
- Cron source: GitHub Actions workflow at `.github/workflows/cron-release-expired.yml`
- Required secrets: `DEPLOYMENT_URL` and `CRON_SECRET`

## Local setup

```bash
npm install
npm run prisma:generate
npm run dev
```

If the database is empty:

```bash
npx prisma migrate deploy
npm run seed
```

## Cron setup

1. Set `CRON_SECRET` in Vercel and GitHub.
2. Set `DEPLOYMENT_URL` in GitHub to the live app URL above.
3. Keep the secured cron route at `/api/cron/release-expired`.

## Layout

- `src/`: Next.js app code.
- `prisma/`: schema, migrations, and seed data.
- `public/`: static assets.

## Notes

- This folder mirrors the reservation workflow used in the main repo root.
