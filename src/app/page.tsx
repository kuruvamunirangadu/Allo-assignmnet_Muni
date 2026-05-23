"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import toast from "react-hot-toast";

import type { Product } from "@/types/product";

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  async function fetchProducts() {
    try {
      const response = await fetch("/api/products");
      const data = await response.json();

      setProducts(data);
    } catch (error) {
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
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          productId,
          warehouseId,
          quantity: 1
        })
      });

      const data = await response.json();

      if (response.status === 409) {
        toast.error(data.error);
        return;
      }

      if (!response.ok) {
        toast.error("Failed to reserve product");
        return;
      }

      toast.success("Reservation created");
      fetchProducts();
      router.push(`/reservation/${data.id}`);
    } catch (error) {
      toast.error("Something went wrong");
    }
  }

  if (loading) {
    return <main className="p-10">Loading...</main>;
  }

  return (
    <main className="p-10">
      <h1 className="mb-8 text-4xl font-bold">Allo Inventory System</h1>

      <div className="grid gap-6">
        {products.map((product) => (
          <div key={product.id} className="rounded-xl border p-6 shadow-sm">
            <h2 className="text-2xl font-semibold">{product.name}</h2>

            <p className="mb-4 text-gray-600">{product.description}</p>

            <div className="space-y-3">
              {product.inventory.map((inventory) => (
                <div
                  key={inventory.warehouseId}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <p className="font-medium">{inventory.warehouseName}</p>

                    <p className="text-sm text-gray-500">{inventory.location}</p>

                    <p className="mt-1">
                      Available Stock:{" "}
                      <span className="font-bold">{inventory.availableStock}</span>
                    </p>
                  </div>

                  <button
                    onClick={() => reserveProduct(product.id, inventory.warehouseId)}
                    disabled={inventory.availableStock <= 0}
                    className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
                  >
                    Reserve
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
