import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { createReservationSchema } from "@/schemas/reservation.schema";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = createReservationSchema.parse(body);

    const { productId, warehouseId, quantity } = validated;

    const reservation = await prisma.$transaction(async (tx) => {
      const inventoryRows = await tx.$queryRaw<
        Array<{
          id: string;
          productId: string;
          warehouseId: string;
          totalStock: number;
          reservedStock: number;
        }>
      >`
        SELECT *
        FROM "inventory"
        WHERE "productId" = ${productId}
          AND "warehouseId" = ${warehouseId}
        FOR UPDATE
      `;

      const inventory = inventoryRows[0];

      if (!inventory) {
        throw new Error("INVENTORY_NOT_FOUND");
      }

      const availableStock = inventory.totalStock - inventory.reservedStock;

      if (availableStock < quantity) {
        throw new Error("INSUFFICIENT_STOCK");
      }

      await tx.inventory.update({
        where: { id: inventory.id },
        data: {
          reservedStock: {
            increment: quantity
          }
        }
      });

      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      return tx.reservation.create({
        data: {
          productId,
          warehouseId,
          quantity,
          status: "PENDING",
          expiresAt
        }
      });
    }, {
      maxWait: 10_000,
      timeout: 15_000
    });

    return NextResponse.json(reservation, { status: 201 });
  } catch (error) {
    console.error(error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message === "INVENTORY_NOT_FOUND") {
      return NextResponse.json(
        { error: "Inventory not found" },
        { status: 404 }
      );
    }

    if (error instanceof Error && error.message === "INSUFFICIENT_STOCK") {
      return NextResponse.json(
        { error: "Not enough stock available" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create reservation" },
      { status: 500 }
    );
  }
}
