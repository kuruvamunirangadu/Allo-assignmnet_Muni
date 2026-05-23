const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.count();
  const warehouses = await prisma.warehouse.count();
  const inventory = await prisma.inventory.count();
  const reservations = await prisma.reservation.count();

  console.log('products_count=' + products);
  console.log('warehouses_count=' + warehouses);
  console.log('inventory_count=' + inventory);
  console.log('reservations_count=' + reservations);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
