# Allo Assessment

This folder contains the assessment app variant of the Allo reservations project.

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

## Layout

- `src/`: Next.js app code.
- `prisma/`: schema, migrations, and seed data.
- `public/`: static assets.

## Notes

- This folder mirrors the reservation workflow used in the main repo root.
