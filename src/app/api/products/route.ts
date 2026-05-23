import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        inventory: {
          include: {
            warehouse: true
          }
        }
      }
    });

    const formattedProducts = products.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      inventory: product.inventory.map((item) => ({
        warehouseId: item.warehouse.id,
        warehouseName: item.warehouse.name,
        location: item.warehouse.location,
        totalStock: item.totalStock,
        reservedStock: item.reservedStock,
        availableStock: item.totalStock - item.reservedStock
      }))
    }));

    return NextResponse.json(formattedProducts);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Failed to fetch products"
      },
      {
        status: 500
      }
    );
  }
}
