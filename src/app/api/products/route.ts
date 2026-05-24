import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import type { Product } from "@/types/product";

type ProductRow = {
  id: string;
  name: string;
  description: string | null;
  inventory: Array<{
    warehouseId: string;
    warehouse: {
      name: string;
      location: string;
    };
    totalStock: number;
    reservedStock: number;
  }>;
};

export async function GET() {
  try {
    const products = (await prisma.product.findMany({
      include: {
        inventory: {
          include: {
            warehouse: true,
          },
        },
      },
    })) as ProductRow[];

    const mapped: Product[] = products.map((product: ProductRow) => ({
      id: product.id,
      name: product.name,
      description: product.description ?? undefined,
      inventory: product.inventory.map((item) => ({
        warehouseId: item.warehouseId,
        warehouseName: item.warehouse.name,
        location: item.warehouse.location,
        totalStock: item.totalStock,
        reservedStock: item.reservedStock,
        availableStock: item.totalStock - item.reservedStock,
      })),
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to load products" },
      { status: 500 }
    );
  }
}