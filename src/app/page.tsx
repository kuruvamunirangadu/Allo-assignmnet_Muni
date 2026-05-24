"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import toast from "react-hot-toast";

import type { Product } from "@/types/product";

export default function HomePage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const totalWarehouses = new Set(products.flatMap((product) => product.inventory.map((item) => item.warehouseId))).size;
  const totalAvailableStock = products.reduce((sum, product) => sum + product.inventory.reduce((inventorySum, item) => inventorySum + item.availableStock, 0), 0);
  const lowStockCount = products.reduce((count, product) => count + product.inventory.filter((item) => item.availableStock <= 5).length, 0);

  async function fetchProducts() {
    try {
      const response = await fetch("/api/products");
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error ?? "Failed to load products");
        return;
      }

      setProducts(data);
    } catch {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  async function reserveProduct(productId: string, warehouseId: string) {
    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, warehouseId, quantity: 1 }),
      });

      const data = await response.json();

      if (response.status === 409) {
        toast.error(data.error);
        return;
      }

      if (!response.ok) {
        toast.error(data.error ?? "Failed to reserve product");
        return;
      }

      toast.success("Reservation created");
      fetchProducts();
      router.push(`/reservation/${data.id}`);
    } catch {
      toast.error("Something went wrong");
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-10">
        <div className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center rounded-[2rem] border border-white/50 bg-white/70 p-10 shadow-[0_30px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <div className="text-center">
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg">
              AI
            </div>
            <p className="text-lg font-medium text-slate-700">Loading inventory...</p>
            <p className="mt-2 text-sm text-slate-500">Fetching live warehouse stock from Neon.</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <section className="mb-8 overflow-hidden rounded-[2rem] border border-white/60 bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(255,255,255,0.7))] p-6 shadow-[0_30px_90px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-8 lg:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-600 shadow-sm">
                Live reservations dashboard
              </div>

              <h1 className="max-w-xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                Allo Inventory
                <span className="block text-slate-500">Reservation System</span>
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                Browse stock by warehouse, reserve one unit instantly, and move from reservation to receipt with a clean checkout flow.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[26rem] lg:grid-cols-1">
              <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Products</p>
                <p className="mt-2 text-3xl font-black text-slate-950">{products.length}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Warehouses</p>
                <p className="mt-2 text-3xl font-black text-slate-950">{totalWarehouses}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Available stock</p>
                <p className="mt-2 text-3xl font-black text-slate-950">{totalAvailableStock}</p>
              </div>
            </div>
          </div>
        </section>

        <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-slate-600">
          <span className="rounded-full bg-white/80 px-3 py-1 shadow-sm ring-1 ring-slate-200">Realtime Neon data</span>
          <span className="rounded-full bg-white/80 px-3 py-1 shadow-sm ring-1 ring-slate-200">1-click reserve</span>
          <span className="rounded-full bg-white/80 px-3 py-1 shadow-sm ring-1 ring-slate-200">Receipt handoff</span>
          <span className="rounded-full bg-slate-900 px-3 py-1 font-semibold text-white shadow-sm ring-1 ring-slate-900">Build source: repo root</span>
          <span className="rounded-full bg-emerald-600 px-3 py-1 font-semibold text-white shadow-sm ring-1 ring-emerald-700">Deploy target locked</span>
          {lowStockCount > 0 ? (
            <span className="rounded-full bg-amber-100 px-3 py-1 font-medium text-amber-900 shadow-sm ring-1 ring-amber-200">
              {lowStockCount} low-stock locations
            </span>
          ) : null}
        </div>

        <div className="grid gap-6">
          {products.length === 0 ? (
            <div className="rounded-[1.5rem] border border-white/60 bg-white/80 p-10 text-sm text-slate-600 shadow-[0_20px_60px_rgba(15,23,42,0.06)] backdrop-blur">
              No products available yet.
            </div>
          ) : (
            products.map((product) => (
              <div key={product.id} className="overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/85 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.09)] backdrop-blur-xl sm:p-7">
                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Product</p>
                    <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">{product.name}</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">{product.description}</p>
                  </div>

                  <div className="rounded-2xl bg-slate-950 px-4 py-3 text-white shadow-lg shadow-slate-950/15">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/60">Inventory locations</p>
                    <p className="mt-1 text-xl font-bold">{product.inventory.length}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {product.inventory.map((inventory) => (
                    <div key={inventory.warehouseId} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50/90 p-4 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-lg font-semibold text-slate-950">{inventory.warehouseName}</p>
                          <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                            {inventory.location}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                          <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">Total: <strong className="text-slate-950">{inventory.totalStock}</strong></span>
                          <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">Reserved: <strong className="text-slate-950">{inventory.reservedStock}</strong></span>
                          <span className="rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700 ring-1 ring-emerald-200">Available: <strong>{inventory.availableStock}</strong></span>
                        </div>
                      </div>

                      <button
                        onClick={() => reserveProduct(product.id, inventory.warehouseId)}
                        disabled={inventory.availableStock <= 0}
                        className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                      >
                        Reserve now
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}