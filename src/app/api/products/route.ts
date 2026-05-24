import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        inventory: {
          include: {
            warehouse: true,
          },
        },
      },
    });

    const mapped = products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      inventory: p.inventory.map((i) => ({
        warehouseId: i.warehouseId,
        warehouseName: i.warehouse.name,
        location: i.warehouse.location,
        totalStock: i.totalStock,
        reservedStock: i.reservedStock,
        availableStock: i.totalStock - i.reservedStock,
      })),
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
  }
}
