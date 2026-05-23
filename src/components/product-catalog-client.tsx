"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import type { CatalogResponse, ProductCatalogItem } from "@/lib/reservations";
import type { FormEvent } from "react";

function currencylessCount(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}

function WarehouseReserveForm({
  product,
  warehouse
}: {
  product: ProductCatalogItem;
  warehouse: ProductCatalogItem["warehouses"][number];
}) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleReserve(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          productId: product.id,
          warehouseId: warehouse.warehouseId,
          quantity
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error ?? "Failed to reserve stock");
        return;
      }

      router.push(`/reservation/${payload.id}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleReserve} className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-white">{warehouse.warehouseName}</p>
          <p className="text-xs text-white/55">{warehouse.location}</p>
        </div>
        <div className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
          {currencylessCount(warehouse.availableStock)} available
        </div>
      </div>

      <div className="mt-4 flex items-end gap-3">
        <label className="flex-1 text-sm text-white/75">
          Quantity
          <input
            className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-white outline-none transition focus:border-emerald-400"
            type="number"
            min={1}
            max={warehouse.availableStock}
            value={quantity}
            onChange={(event) => setQuantity(Number(event.target.value))}
            disabled={isPending}
          />
        </label>
        <button
          type="submit"
          disabled={isPending || warehouse.availableStock < 1}
          className={clsx(
            "rounded-xl px-4 py-2 text-sm font-semibold transition",
            isPending || warehouse.availableStock < 1
              ? "cursor-not-allowed bg-white/10 text-white/35"
              : "bg-emerald-400 text-slate-950 hover:bg-emerald-300"
          )}
        >
          Reserve
        </button>
      </div>

      {error ? (
        <p className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </p>
      ) : null}
    </form>
  );
}

function ProductCard({ product }: { product: ProductCatalogItem }) {
  return (
    <article className="rounded-[2rem] border border-white/10 bg-card/80 p-6 shadow-glow backdrop-blur-sm">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-2xl tracking-tight text-white">{product.name}</h2>
          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/70">
            {currencylessCount(product.availableStock)} available total
          </div>
        </div>
        {product.description ? <p className="max-w-2xl text-sm leading-6 text-white/70">{product.description}</p> : null}
      </div>

      <div className="mt-6 grid gap-3 lg:grid-cols-2">
        {product.warehouses.map((warehouse) => (
          <WarehouseReserveForm key={warehouse.warehouseId} product={product} warehouse={warehouse} />
        ))}
      </div>
    </article>
  );
}

export function ProductCatalogClient({ initialCatalog }: { initialCatalog: CatalogResponse }) {
  const [catalog] = useState(initialCatalog);

  const warehouseSummary = useMemo(() => catalog.warehouses.length, [catalog.warehouses.length]);

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-6 py-10 lg:px-10">
      <section className="rounded-[2.25rem] border border-white/10 bg-white/5 p-8 shadow-glow backdrop-blur-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-emerald-300">Allo Engineering Exercise</p>
            <h1 className="mt-4 font-display text-4xl tracking-tight text-white md:text-6xl">
              Reservation-first inventory for multi-warehouse stock.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/70 md:text-lg">
              Reserve stock atomically at checkout, hold it for ten minutes, and release it automatically if payment
              never completes.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-5 text-sm text-white/70">
            <div className="text-3xl font-semibold text-white">{warehouseSummary}</div>
            <div className="mt-1">warehouses in the current catalog</div>
            <div className="mt-4 text-xs uppercase tracking-[0.3em] text-white/40">Concurrency-safe reservation flow</div>
          </div>
        </div>
      </section>

      <section className="mt-10 grid gap-6">
        {catalog.products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </section>
    </main>
  );
}
