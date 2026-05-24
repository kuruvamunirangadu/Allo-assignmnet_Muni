import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { productId, warehouseId, quantity = 1 } = body;

    if (!productId || !warehouseId) {
      return NextResponse.json({ error: "Missing params" }, { status: 400 });
    }

    const reservation = await prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<Array<{ id: string; totalStock: number; reservedStock: number }>>`
        SELECT * FROM inventory WHERE "productId" = ${productId} AND "warehouseId" = ${warehouseId} FOR UPDATE
      `;

      const inventory = rows[0];

      if (!inventory) {
        return { conflict: false, message: "Inventory not found" } as const;
      }

      const available = inventory.totalStock - inventory.reservedStock;

      if (available < quantity) {
        return { conflict: true, message: "Not enough stock available" } as const;
      }

      await tx.inventory.update({
        where: { id: inventory.id },
        data: { reservedStock: { increment: quantity } },
      });

      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      const r = await tx.reservation.create({
        data: {
          productId,
          warehouseId,
          quantity,
          expiresAt,
        },
      });

      return r;
    });

    if ("conflict" in reservation && reservation.conflict) {
      return NextResponse.json({ error: reservation.message }, { status: 409 });
    }

    return NextResponse.json(reservation, { status: 201 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error?.message || "Failed to create reservation" }, { status: 500 });
  }
}
