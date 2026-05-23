import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const { id } = await context.params;

    const result = await prisma.$transaction(
      async (tx) => {
        const reservationRows = await tx.$queryRaw<
          Array<{
            id: string;
            productId: string;
            warehouseId: string;
            quantity: number;
            status: string;
            expiresAt: Date;
          }>
        >`
          SELECT *
          FROM "reservations"
          WHERE id = ${id}
          FOR UPDATE
        `;

        const reservation = reservationRows[0];

        if (!reservation) {
          throw new Error("RESERVATION_NOT_FOUND");
        }

        if (reservation.status !== "PENDING") {
          throw new Error("INVALID_RESERVATION_STATUS");
        }

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
          WHERE "productId" = ${reservation.productId}
            AND "warehouseId" = ${reservation.warehouseId}
          FOR UPDATE
        `;

        const inventory = inventoryRows[0];

        if (!inventory) {
          throw new Error("INVENTORY_NOT_FOUND");
        }

        await tx.inventory.update({
          where: {
            id: inventory.id
          },
          data: {
            reservedStock: {
              decrement: reservation.quantity
            }
          }
        });

        return tx.reservation.update({
          where: {
            id
          },
          data: {
            status: "RELEASED"
          }
        });
      },
      {
        maxWait: 10_000,
        timeout: 15_000
      }
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);

    if (error instanceof Error && error.message === "RESERVATION_NOT_FOUND") {
      return NextResponse.json(
        {
          error: "Reservation not found"
        },
        {
          status: 404
        }
      );
    }

    if (
      error instanceof Error &&
      error.message === "INVALID_RESERVATION_STATUS"
    ) {
      return NextResponse.json(
        {
          error: "Reservation already processed"
        },
        {
          status: 400
        }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to release reservation"
      },
      {
        status: 500
      }
    );
  }
}
