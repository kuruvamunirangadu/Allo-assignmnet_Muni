"use client";

import { useEffect, useState } from "react";

import { useParams, useRouter } from "next/navigation";

import toast from "react-hot-toast";

interface ReceiptReservation {
  id: string;
  quantity: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  product: { name: string; description?: string | null };
  warehouse: { name: string; location: string };
}

export default function ReceiptPage() {
  const params = useParams();
  const router = useRouter();
  const reservationId = params.id as string;

  const [reservation, setReservation] = useState<ReceiptReservation | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchReceipt() {
    try {
      const response = await fetch(`/api/reservations/${reservationId}`);
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error ?? "Failed to load receipt");
        return;
      }

      setReservation(data);
    } catch {
      toast.error("Failed to load receipt");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReceipt();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-10">
        <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center rounded-[2rem] border border-white/60 bg-white/80 p-10 shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-pulse rounded-full bg-slate-900/10" />
            <p className="text-lg font-medium text-slate-700">Loading receipt...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!reservation) {
    return (
      <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-white/60 bg-white/80 p-10 shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <p className="text-lg font-semibold text-slate-950">Receipt not found</p>
          <p className="mt-2 text-sm text-slate-600">The reservation may not exist anymore.</p>
        </div>
      </main>
    );
  }

  const confirmedAt = new Date(reservation.updatedAt).toLocaleString();
  const reservedAt = new Date(reservation.createdAt).toLocaleString();

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="overflow-hidden rounded-[2rem] border border-white/60 bg-white/85 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-8">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-white">
                Receipt confirmed
              </div>
              <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Receipt Details</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                Reservation confirmed successfully and stock has been deducted from inventory.
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-right shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Status</p>
              <p className="text-2xl font-black text-emerald-700">{reservation.status}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Receipt ID</p>
              <p className="mt-2 break-all text-base font-bold text-slate-950">{reservation.id}</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Quantity</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{reservation.quantity}</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Product</p>
              <p className="mt-2 text-lg font-bold text-slate-950">{reservation.product.name}</p>
              {reservation.product.description ? (
                <p className="mt-1 text-sm text-slate-600">{reservation.product.description}</p>
              ) : null}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Warehouse</p>
              <p className="mt-2 text-lg font-bold text-slate-950">{reservation.warehouse.name}</p>
              <p className="text-sm text-slate-600">{reservation.warehouse.location}</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Reserved At</p>
              <p className="mt-2 text-sm font-semibold text-slate-950">{reservedAt}</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Confirmed At</p>
              <p className="mt-2 text-sm font-semibold text-slate-950">{confirmedAt}</p>
            </div>
          </div>
        </section>

        <aside className="rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_20px_70px_rgba(15,23,42,0.18)] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/55">Receipt summary</p>
          <div className="mt-4 space-y-4">
            <div className="rounded-2xl bg-white/6 p-4 ring-1 ring-white/10">
              <p className="text-sm text-white/60">Outcome</p>
              <p className="mt-2 text-2xl font-black">Purchase complete</p>
              <p className="mt-1 text-sm text-white/70">Your inventory reservation has been converted into a confirmed order.</p>
            </div>

            <div className="grid gap-3 rounded-2xl bg-white/6 p-4 ring-1 ring-white/10">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">Product</span>
                <span className="font-medium">{reservation.product.name}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">Warehouse</span>
                <span className="font-medium">{reservation.warehouse.location}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">Quantity</span>
                <span className="font-medium">{reservation.quantity}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">Status</span>
                <span className="font-medium">{reservation.status}</span>
              </div>
            </div>

            <button
              onClick={() => router.push("/")}
              className="inline-flex w-full items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:bg-slate-100"
            >
              Back to Products
            </button>
          </div>
        </aside>
      </div>
    </main>
  );
}
