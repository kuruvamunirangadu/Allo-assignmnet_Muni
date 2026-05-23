import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.reservation.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.product.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.idempotencyRecord.deleteMany();

  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: "Aster Hoodie",
        description: "Heavyweight unisex hoodie in multiple sizes."
      }
    }),
    prisma.product.create({
      data: {
        name: "Arc Water Bottle",
        description: "Insulated bottle built for desk and gym use."
      }
    }),
    prisma.product.create({
      data: {
        name: "Signal Tote",
        description: "Reinforced canvas tote with side pocket."
      }
    })
  ]);

  const warehouses = await Promise.all([
    prisma.warehouse.create({
      data: {
        name: "Mumbai West",
        location: "Andheri"
      }
    }),
    prisma.warehouse.create({
      data: {
        name: "Bengaluru South",
        location: "Koramangala"
      }
    })
  ]);

  await prisma.inventory.createMany({
    data: [
      {
        productId: products[0].id,
        warehouseId: warehouses[0].id,
        totalStock: 8,
        reservedStock: 1
      },
      {
        productId: products[0].id,
        warehouseId: warehouses[1].id,
        totalStock: 4,
        reservedStock: 0
      },
      {
        productId: products[1].id,
        warehouseId: warehouses[0].id,
        totalStock: 15,
        reservedStock: 3
      },
      {
        productId: products[1].id,
        warehouseId: warehouses[1].id,
        totalStock: 9,
        reservedStock: 2
      },
      {
        productId: products[2].id,
        warehouseId: warehouses[0].id,
        totalStock: 12,
        reservedStock: 1
      },
      {
        productId: products[2].id,
        warehouseId: warehouses[1].id,
        totalStock: 6,
        reservedStock: 0
      }
    ]
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
