"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import type { ReservationDetail } from "@/lib/reservations";

function formatRemaining(ms: number) {
  if (ms <= 0) {
    return "Expired";
  }

  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function ReservationDetailClient({ initialReservation }: { initialReservation: ReservationDetail }) {
  const router = useRouter();
  const [reservation, setReservation] = useState(initialReservation);
  const [now, setNow] = useState(Date.now());
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const remainingMs = useMemo(() => Date.parse(reservation.expiresAt) - now, [now, reservation.expiresAt]);
  const isExpired = remainingMs <= 0 || reservation.status === "EXPIRED";
  const isFinal = reservation.status === "CONFIRMED" || reservation.status === "RELEASED" || isExpired;

  async function mutateReservation(endpoint: "confirm" | "release") {
    setError(null);

    startTransition(async () => {
      const response = await fetch(`/api/reservations/${reservation.id}/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      });

      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error ?? "Reservation action failed");
        return;
      }

      setReservation(payload);
      router.refresh();
    });
  }

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-10 lg:px-10">
      <section className="rounded-[2.25rem] border border-white/10 bg-white/5 p-8 shadow-glow backdrop-blur-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-emerald-300">Reservation</p>
            <h1 className="mt-3 font-display text-4xl tracking-tight text-white">{reservation.product.name}</h1>
            {reservation.product.description ? (
              <p className="mt-3 max-w-2xl text-base leading-7 text-white/70">{reservation.product.description}</p>
            ) : null}
          </div>
          <div
            className={clsx(
              "rounded-3xl border px-5 py-4 text-sm",
              reservation.status === "CONFIRMED"
                ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-100"
                : reservation.status === "RELEASED"
                  ? "border-sky-400/25 bg-sky-400/10 text-sky-100"
                  : isExpired
                    ? "border-rose-400/25 bg-rose-400/10 text-rose-100"
                    : "border-white/10 bg-slate-950/60 text-white/80"
            )}
          >
            <div className="text-xs uppercase tracking-[0.3em] text-white/45">State</div>
            <div className="mt-1 text-2xl font-semibold">{reservation.status}</div>
            <div className="mt-2 text-sm text-white/70">Expires in {formatRemaining(remainingMs)}</div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <InfoCard label="Warehouse" value={`${reservation.warehouse.name} · ${reservation.warehouse.location}`} />
          <InfoCard label="Quantity" value={String(reservation.quantity)} />
          <InfoCard label="Expires at" value={new Date(reservation.expiresAt).toLocaleString()} />
          <InfoCard label="Available after hold" value={String(reservation.inventory.availableStock)} />
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        ) : null}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => mutateReservation("confirm")}
            disabled={isPending || isFinal}
            className={clsx(
              "rounded-2xl px-5 py-3 text-sm font-semibold transition",
              isPending || isFinal
                ? "cursor-not-allowed bg-white/10 text-white/35"
                : "bg-emerald-400 text-slate-950 hover:bg-emerald-300"
            )}
          >
            Confirm purchase
          </button>
          <button
            type="button"
            onClick={() => mutateReservation("release")}
            disabled={isPending || isFinal}
            className={clsx(
              "rounded-2xl px-5 py-3 text-sm font-semibold transition",
              isPending || isFinal
                ? "cursor-not-allowed bg-white/10 text-white/35"
                : "border border-white/10 bg-white/5 text-white hover:bg-white/10"
            )}
          >
            Cancel
          </button>
        </div>
      </section>
    </main>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
      <div className="text-xs uppercase tracking-[0.3em] text-white/40">{label}</div>
      <div className="mt-2 text-base font-medium text-white">{value}</div>
    </div>
  );
}
