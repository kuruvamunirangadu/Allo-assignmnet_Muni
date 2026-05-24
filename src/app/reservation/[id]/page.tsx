"use client";

import { useEffect, useState } from "react";

import { useParams, useRouter } from "next/navigation";

import toast from "react-hot-toast";

interface Reservation {
  id: string;
  quantity: number;
  status: string;
  expiresAt: string;
  product: { name: string };
  warehouse: { name: string; location: string };
}

export default function ReservationPage() {
  const params = useParams();
  const router = useRouter();
  const reservationId = params.id as string;

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState("");

  async function fetchReservation() {
    try {
      const response = await fetch(`/api/reservations/${reservationId}`);
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error ?? "Failed to load reservation");
        return;
      }

      setReservation(data);
    } catch {
      toast.error("Failed to load reservation");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReservation();
  }, []);

  useEffect(() => {
    if (!reservation) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const expiry = new Date(reservation.expiresAt).getTime();
      const difference = expiry - now;

      if (difference <= 0) {
        clearInterval(interval);
        setTimeLeft("Expired");
        return;
      }

      const minutes = Math.floor(difference / 1000 / 60);
      const seconds = Math.floor((difference / 1000) % 60);
      setTimeLeft(`${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(interval);
  }, [reservation]);

  async function confirmReservation() {
    try {
      const response = await fetch(`/api/reservations/${reservationId}/confirm`, { method: "POST" });

      const data = await response.json();

      if (response.status === 410) {
        toast.error(data.error);
        return;
      }

      if (!response.ok) {
        toast.error(data.error ?? "Failed to confirm reservation");
        return;
      }

      toast.success("Purchase confirmed");
      router.push(`/receipt/${reservationId}`);
    } catch {
      toast.error("Failed to confirm reservation");
    }
  }

  async function cancelReservation() {
    try {
      const response = await fetch(`/api/reservations/${reservationId}/release`, { method: "POST" });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error ?? "Failed to cancel reservation");
        return;
      }

      toast.success("Reservation cancelled");
      router.push("/");
    } catch {
      toast.error("Failed to cancel reservation");
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-10">
        <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center rounded-[2rem] border border-white/60 bg-white/80 p-10 shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-pulse rounded-full bg-slate-900/10" />
            <p className="text-lg font-medium text-slate-700">Loading reservation...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!reservation) {
    return (
      <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-white/60 bg-white/80 p-10 shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <p className="text-lg font-semibold text-slate-950">Reservation not found</p>
          <p className="mt-2 text-sm text-slate-600">The reservation may have expired or the link is invalid.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="overflow-hidden rounded-[2rem] border border-white/60 bg-white/85 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-8">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-white">
                Reservation details
              </div>
              <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Secure your reservation</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                Confirm before the timer expires or cancel to release stock back into the warehouse.
              </p>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-right shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">Time remaining</p>
              <p className="text-2xl font-black text-amber-700">{timeLeft}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Product</p>
              <p className="mt-2 text-lg font-bold text-slate-950">{reservation.product.name}</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Warehouse</p>
              <p className="mt-2 text-lg font-bold text-slate-950">{reservation.warehouse.name}</p>
              <p className="text-sm text-slate-600">{reservation.warehouse.location}</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Quantity</p>
              <p className="mt-2 text-lg font-bold text-slate-950">{reservation.quantity}</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Status</p>
              <p className="mt-2 inline-flex rounded-full bg-slate-950 px-3 py-1 text-sm font-semibold text-white">{reservation.status}</p>
            </div>
          </div>

          {reservation.status === "PENDING" && (
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button onClick={confirmReservation} className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:-translate-y-0.5 hover:bg-emerald-500">
                Confirm Purchase
              </button>

              <button onClick={cancelReservation} className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50">
                Cancel Reservation
              </button>
            </div>
          )}
        </section>

        <aside className="rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_20px_70px_rgba(15,23,42,0.18)] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/55">Checkout summary</p>
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-sm text-white/60">Reservation ID</p>
              <p className="mt-1 break-all font-mono text-sm text-white">{reservation.id}</p>
            </div>

            <div className="rounded-2xl bg-white/6 p-4 ring-1 ring-white/10">
              <p className="text-sm text-white/60">Timing</p>
              <p className="mt-2 text-2xl font-black">10 minute hold</p>
              <p className="mt-1 text-sm text-white/70">Stock remains reserved until you confirm or cancel.</p>
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
                <span className="text-white/60">Requested qty</span>
                <span className="font-medium">{reservation.quantity}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
