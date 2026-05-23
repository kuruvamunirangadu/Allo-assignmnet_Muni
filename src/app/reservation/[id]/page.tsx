"use client";

import { useEffect, useState } from "react";

import { useParams, useRouter } from "next/navigation";

import toast from "react-hot-toast";

export const dynamic = "force-dynamic";

interface Reservation {
  id: string;
  quantity: number;
  status: string;
  expiresAt: string;
  product: {
    name: string;
  };
  warehouse: {
    name: string;
    location: string;
  };
}

export default function ReservationPage() {
  const params = useParams();
  const router = useRouter();
  const reservationId = params.id as string;

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState("");
  const isExpired = timeLeft === "Expired" || reservation?.status === "EXPIRED";

  async function fetchReservation() {
    try {
      const response = await fetch(`/api/reservations/${reservationId}`);
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error);
        return;
      }

      setReservation(data);
    } catch (error) {
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
      const response = await fetch(`/api/reservations/${reservationId}/confirm`, {
        method: "POST"
      });

      const data = await response.json();

      if (response.status === 410) {
        toast.error(data.error);
        return;
      }

      if (!response.ok) {
        toast.error(data.error);
        return;
      }

      toast.success("Purchase confirmed");
      fetchReservation();
    } catch (error) {
      toast.error("Failed to confirm reservation");
    }
  }

  async function cancelReservation() {
    try {
      const response = await fetch(`/api/reservations/${reservationId}/release`, {
        method: "POST"
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error);
        return;
      }

      toast.success("Reservation cancelled");
      router.push("/");
    } catch (error) {
      toast.error("Failed to cancel reservation");
    }
  }

  if (loading) {
    return <main className="p-10">Loading...</main>;
  }

  if (!reservation) {
    return <main className="p-10">Reservation not found</main>;
  }

  return (
    <main className="p-10">
      <div className="mx-auto max-w-xl rounded-xl border p-8 shadow-sm">
        <h1 className="mb-6 text-3xl font-bold">Reservation Details</h1>

        <div className="space-y-4">
          <div>
            <p className="text-gray-500">Product</p>
            <p className="font-semibold">{reservation.product.name}</p>
          </div>

          <div>
            <p className="text-gray-500">Warehouse</p>
            <p className="font-semibold">{reservation.warehouse.name}</p>
          </div>

          <div>
            <p className="text-gray-500">Quantity</p>
            <p className="font-semibold">{reservation.quantity}</p>
          </div>

          <div>
            <p className="text-gray-500">Status</p>
            <p className="font-semibold">{reservation.status}</p>
          </div>

          <div>
            <p className="text-gray-500">Time Remaining</p>
            <p className="text-2xl font-bold text-red-500">{timeLeft}</p>
          </div>
        </div>

        {reservation.status === "PENDING" && !isExpired && (
          <div className="mt-8 flex gap-4">
            <button
              onClick={confirmReservation}
              className="rounded-lg bg-green-600 px-5 py-3 text-white"
            >
              Confirm Purchase
            </button>

            <button
              onClick={cancelReservation}
              className="rounded-lg bg-red-600 px-5 py-3 text-white"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
