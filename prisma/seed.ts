import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Clear old data
  await prisma.reservation.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.product.deleteMany();
  await prisma.warehouse.deleteMany();

  // Create Products
  const iphone = await prisma.product.create({
    data: {
      name: "iPhone 15",
      description: "Apple flagship smartphone",
    },
  });

  const nikeShoes = await prisma.product.create({
    data: {
      name: "Nike Air Max",
      description: "Running shoes",
    },
  });

  const macbook = await prisma.product.create({
    data: {
      name: "MacBook Pro",
      description: "Apple laptop",
    },
  });

  // Create Warehouses
  const hyderabadWarehouse = await prisma.warehouse.create({
    data: {
      name: "Hyderabad Warehouse",
      location: "Hyderabad",
    },
  });

  const mumbaiWarehouse = await prisma.warehouse.create({
    data: {
      name: "Mumbai Warehouse",
      location: "Mumbai",
    },
  });

  // Create Inventory
  await prisma.inventory.createMany({
    data: [
      {
        productId: iphone.id,
        warehouseId: hyderabadWarehouse.id,
        totalStock: 10,
        reservedStock: 0,
      },
      {
        productId: iphone.id,
        warehouseId: mumbaiWarehouse.id,
        totalStock: 5,
        reservedStock: 0,
      },
      {
        productId: nikeShoes.id,
        warehouseId: hyderabadWarehouse.id,
        totalStock: 20,
        reservedStock: 0,
      },
      {
        productId: nikeShoes.id,
        warehouseId: mumbaiWarehouse.id,
        totalStock: 15,
        reservedStock: 0,
      },
      {
        productId: macbook.id,
        warehouseId: hyderabadWarehouse.id,
        totalStock: 7,
        reservedStock: 0,
      },
      {
        productId: macbook.id,
        warehouseId: mumbaiWarehouse.id,
        totalStock: 3,
        reservedStock: 0,
      },
    ],
  });

  console.log("✅ Seed data inserted successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
