import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    const result = await prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.findUnique({ where: { id } });

      if (!reservation) {
        return { status: 404, body: { error: "Reservation not found" } } as const;
      }

      if (reservation.status !== "PENDING") {
        return { status: 400, body: { error: "Reservation not pending" } } as const;
      }

      const rows = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT * FROM inventory WHERE "productId" = ${reservation.productId} AND "warehouseId" = ${reservation.warehouseId} FOR UPDATE
      `;

      const inventory = rows[0];

      if (!inventory) {
        return { status: 500, body: { error: "Inventory not found" } } as const;
      }

      await tx.inventory.update({ where: { id: inventory.id }, data: { reservedStock: { decrement: reservation.quantity } } });

      await tx.reservation.update({ where: { id }, data: { status: "RELEASED" } });

      return { status: 200, body: { success: true } } as const;
    });

    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to release reservation" }, { status: 500 });
  }
}
