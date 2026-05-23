# Allo Reservations

A Next.js App Router implementation of a multi-warehouse inventory reservation flow. The core of the exercise is the reservation transaction: when two requests race for the last available unit, exactly one succeeds and the other returns `409 Conflict`.

## What is implemented

- Products and warehouses in Postgres via Prisma.
- Stock per product per warehouse, with `totalStock` and `reservedStock`.
- Reservation lifecycle: `PENDING`, `CONFIRMED`, `RELEASED`, `EXPIRED`.
- API endpoints for products, warehouses, reserve, confirm, release, and a cleanup cron route.
- Product list UI with per-warehouse reserve forms.
- Reservation checkout UI with a live countdown and confirm/cancel actions.
- Optional idempotency for reserve and confirm using the `Idempotency-Key` header.

## Concurrency model

The reservation endpoint uses a PostgreSQL transaction with `SELECT ... FOR UPDATE` on the inventory row. That makes stock reservation serializable at the row level, so only one request can reserve the last available unit.

Flow:

1. Lock the inventory row for the selected product and warehouse.
2. Compute `available = totalStock - reservedStock`.
3. Return `409` if there is not enough stock.
4. Increment `reservedStock`.
5. Create the reservation with an expiry time.
6. Commit the transaction.

That is the part that matters most for the exercise.

## Expiry mechanism

The app supports two expiry paths:

- A cron-friendly cleanup route at `POST /api/cron/release-expired` that can be wired to Vercel Cron to run every minute in production.
- Lazy cleanup on read for the product catalog and reservation detail views, so expired holds are released even if the cron job is delayed.

I would use the cron route in production and keep the lazy cleanup as a safety net.

## Idempotency

Reserve and confirm accept an `Idempotency-Key` header. The key is stored in Postgres alongside the request hash and the first successful response. Replays with the same key return the original response instead of repeating the side effect.

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create an environment file from the example and point it at a hosted Postgres database:

   ```bash
   cp .env.example .env
   ```

3. Run the Prisma migration and seed the database:

   ```bash
   npx prisma migrate deploy
   npm run db:seed
   ```

   For local development, `npx prisma migrate dev` also works if you want Prisma to create a new migration from the schema.

4. Start the app:

   ```bash
   npm run dev
   ```

## Environment variables

- `DATABASE_URL`: hosted Postgres connection string.
- `CRON_SECRET`: optional shared secret for the cleanup route.
- `UPSTASH_REDIS_REST_URL`: optional; reserved for distributed locking extensions.
- `UPSTASH_REDIS_REST_TOKEN`: optional; reserved for distributed locking extensions.

## Trade-offs

- The correctness guarantee comes from Postgres row locks rather than Redis. That keeps the critical path simple and avoids introducing a second source of truth.
- Expiry is handled both by cron and by lazy cleanup, which is practical for a take-home but not the highest-throughput design.
- The UI is intentionally focused on the reservation flow rather than on broad catalog features.

## Notes

- The app is seeded with sample products and warehouses so the flow can be demonstrated immediately after migration and seed.
- If I had more time, I would add stronger monitoring, background job retries, and broader idempotency coverage for release as well.
