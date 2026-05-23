import { Prisma, ReservationStatus, type Inventory, type Reservation, type Product, type Warehouse } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const reservationRequestSchema = z.object({
  productId: z.string().min(1),
  warehouseId: z.string().min(1),
  quantity: z.number().int().positive().default(1)
});

export type ReservationRequestInput = z.infer<typeof reservationRequestSchema>;

const idempotentScopes = {
  reserve: "reserve",
  confirm: "confirm"
} as const;

type CatalogInventoryRow = Inventory & {
  warehouse: Warehouse;
};

type CatalogProductRow = Product & {
  inventory: CatalogInventoryRow[];
};

type ReservationWithDetails = Pick<
  Reservation,
  | "id"
  | "productId"
  | "warehouseId"
  | "quantity"
  | "status"
  | "expiresAt"
  | "createdAt"
  | "updatedAt"
> & {
  product: Product;
  warehouse: Warehouse;
  inventory: InventoryLockRow;
  confirmedAt?: Date | null;
  releasedAt?: Date | null;
};

type LockedReservationBundle = {
  reservation: ReservationLockRow;
  product: Product;
  warehouse: Warehouse;
  inventory: Inventory;
};

type InventoryLockRow = {
  id: string;
  productId: string;
  warehouseId: string;
  totalStock: number;
  reservedStock: number;
};

type ReservationLockRow = {
  id: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  status: ReservationStatus;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type ProductWarehouseStock = {
  warehouseId: string;
  warehouseName: string;
  location: string;
  totalStock: number;
  reservedStock: number;
  availableStock: number;
};

export type ProductCatalogItem = {
  id: string;
  name: string;
  description: string | null;
  totalStock: number;
  reservedStock: number;
  availableStock: number;
  warehouses: ProductWarehouseStock[];
};

export type ReservationDetail = {
  id: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  status: ReservationStatus;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  confirmedAt: string | null;
  releasedAt: string | null;
  product: {
    id: string;
    name: string;
    description: string | null;
  };
  warehouse: {
    id: string;
    name: string;
    location: string;
  };
  inventory: {
    id: string;
    totalStock: number;
    reservedStock: number;
    availableStock: number;
  };
};

export type CatalogResponse = {
  products: ProductCatalogItem[];
  warehouses: Array<{
    id: string;
    name: string;
    location: string;
  }>;
};

export class ReservationError extends Error {
  status: number;
  code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function toIso(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

function toReservationDetail(reservation: ReservationWithDetails): ReservationDetail {
  return {
    id: reservation.id,
    productId: reservation.productId,
    warehouseId: reservation.warehouseId,
    quantity: reservation.quantity,
    status: reservation.status,
    expiresAt: reservation.expiresAt.toISOString(),
    createdAt: reservation.createdAt.toISOString(),
    updatedAt: reservation.updatedAt.toISOString(),
    confirmedAt: toIso(reservation.confirmedAt),
    releasedAt: toIso(reservation.releasedAt),
    product: {
      id: reservation.product.id,
      name: reservation.product.name,
      description: reservation.product.description
    },
    warehouse: {
      id: reservation.warehouse.id,
      name: reservation.warehouse.name,
      location: reservation.warehouse.location
    },
    inventory: {
      id: reservation.inventory.id,
      totalStock: reservation.inventory.totalStock,
      reservedStock: reservation.inventory.reservedStock,
      availableStock: reservation.inventory.totalStock - reservation.inventory.reservedStock
    }
  };
}

function bundleToReservationDetail(bundle: LockedReservationBundle): ReservationDetail {
  const { reservation, product, warehouse, inventory } = bundle;

  return {
    id: reservation.id,
    productId: reservation.productId,
    warehouseId: reservation.warehouseId,
    quantity: reservation.quantity,
    status: reservation.status,
    expiresAt: reservation.expiresAt.toISOString(),
    createdAt: reservation.createdAt.toISOString(),
    updatedAt: reservation.updatedAt.toISOString(),
    confirmedAt: toIso(reservation.confirmedAt),
    releasedAt: toIso(reservation.releasedAt),
    product: {
      id: product.id,
      name: product.name,
      description: product.description
    },
    warehouse: {
      id: warehouse.id,
      name: warehouse.name,
      location: warehouse.location
    },
    inventory: {
      id: inventory.id,
      totalStock: inventory.totalStock,
      reservedStock: inventory.reservedStock,
      availableStock: inventory.totalStock - inventory.reservedStock
    }
  };
}

function catalogFromRows(products: CatalogProductRow[], warehouses: CatalogResponse["warehouses"]): CatalogResponse {
  return {
    products: products.map((product) => {
      const stockRows = product.inventory.map((row) => ({
        warehouseId: row.warehouseId,
        warehouseName: row.warehouse.name,
        location: row.warehouse.location,
        totalStock: row.totalStock,
        reservedStock: row.reservedStock,
        availableStock: row.totalStock - row.reservedStock
      }));

      const totalStock = stockRows.reduce((sum, row) => sum + row.totalStock, 0);
      const reservedStock = stockRows.reduce((sum, row) => sum + row.reservedStock, 0);

      return {
        id: product.id,
        name: product.name,
        description: product.description,
        totalStock,
        reservedStock,
        availableStock: totalStock - reservedStock,
        warehouses: stockRows
      } satisfies ProductCatalogItem;
    }),
    warehouses
  };
}

function requestHash(input: ReservationRequestInput) {
  return JSON.stringify(input);
}

async function cleanupExpiredReservationsInTx(tx: Prisma.TransactionClient) {
  const expiredReservations = await tx.$queryRaw<
    Array<{
      id: string;
      productId: string;
      warehouseId: string;
      quantity: number;
    }>
  >`
    SELECT id, "productId", "warehouseId", quantity
    FROM "reservations"
    WHERE status = 'PENDING'
      AND "expiresAt" < NOW()
    FOR UPDATE SKIP LOCKED
  `;

  if (expiredReservations.length === 0) {
    return 0;
  }

  for (const reservation of expiredReservations) {
    await tx.reservation.update({
      where: { id: reservation.id },
      data: {
        status: "EXPIRED"
      }
    });

    const inventory = await findInventoryForReservation(tx, {
      productId: reservation.productId,
      warehouseId: reservation.warehouseId
    });

    if (!inventory) {
      throw new ReservationError("Reservation inventory not found", 404, "INVENTORY_NOT_FOUND");
    }

    await tx.inventory.update({
      where: { id: inventory.id },
      data: {
        reservedStock: {
          decrement: reservation.quantity
        }
      }
    });
  }

  return expiredReservations.length;
}

export async function cleanupExpiredReservations() {
  return prisma.$transaction((tx) => cleanupExpiredReservationsInTx(tx));
}

export async function getCatalog(): Promise<CatalogResponse> {
  return prisma.$transaction(async (tx) => {
    await cleanupExpiredReservationsInTx(tx);

    const [products, warehouses] = await Promise.all([
      tx.product.findMany({
        orderBy: { name: "asc" },
        include: {
          inventory: {
            orderBy: { warehouse: { name: "asc" } },
            include: { warehouse: true }
          }
        }
      }),
      tx.warehouse.findMany({
        orderBy: { name: "asc" }
      })
    ]);

    return catalogFromRows(products as CatalogProductRow[], warehouses);
  });
}

export async function getWarehouses() {
  return prisma.warehouse.findMany({
    orderBy: { name: "asc" }
  });
}

export async function getReservationById(reservationId: string): Promise<ReservationDetail | null> {
  return prisma.$transaction(async (tx) => {
    const reservation = await tx.reservation.findUnique({
      where: { id: reservationId },
      include: {
        product: true,
        warehouse: true
      }
    });

    if (!reservation) {
      return null;
    }

    const inventory = await findInventoryForReservation(tx, {
      productId: reservation.productId,
      warehouseId: reservation.warehouseId
    });

    if (!inventory) {
      throw new ReservationError("Reservation inventory not found", 404, "INVENTORY_NOT_FOUND");
    }

    if (reservation.status === "PENDING" && reservation.expiresAt < new Date()) {
      await tx.reservation.update({
        where: { id: reservation.id },
        data: {
          status: "EXPIRED"
        }
      });

      await tx.inventory.update({
        where: { id: inventory.id },
        data: {
          reservedStock: {
            decrement: reservation.quantity
          }
        }
      });

      const expiredInventory = {
        ...inventory,
        reservedStock: inventory.reservedStock - reservation.quantity
      };

      return {
        ...toReservationDetail({
          ...reservation,
          inventory: expiredInventory
        }),
        status: "EXPIRED",
        releasedAt: new Date().toISOString(),
        inventory: {
          id: expiredInventory.id,
          totalStock: expiredInventory.totalStock,
          reservedStock: expiredInventory.reservedStock,
          availableStock: expiredInventory.totalStock - expiredInventory.reservedStock
        }
      };
    }

    return toReservationDetail({
      ...reservation,
      inventory
    });
  });
}
async function findInventoryForReservation(tx: Prisma.TransactionClient, input: ReservationRequestInput) {
  const [inventory] = await tx.$queryRaw<InventoryLockRow[]>`
    SELECT id, "productId", "warehouseId", "totalStock", "reservedStock"
    FROM "inventory"
    WHERE "productId" = ${input.productId}
      AND "warehouseId" = ${input.warehouseId}
    FOR UPDATE
  `;

  return inventory ?? null;
}

async function createIdempotencyRecord(
  tx: Prisma.TransactionClient,
  scope: string,
  key: string,
  payload: ReservationRequestInput
) {
  return tx.idempotencyRecord.create({
    data: {
      scope,
      key,
      requestHash: requestHash(payload)
    }
  });
}

async function replayIdempotentReservation(key: string, payload: ReservationRequestInput) {
  const record = await prisma.idempotencyRecord.findUnique({
    where: {
      scope_key: {
        scope: idempotentScopes.reserve,
        key
      }
    }
  });

  if (!record) {
    return null;
  }

  if (record.requestHash !== requestHash(payload)) {
    throw new ReservationError("Idempotency key was already used for a different request", 409, "IDEMPOTENCY_KEY_MISMATCH");
  }

  if (record.responseBody) {
    return record.responseBody as ReservationDetail;
  }

  return null;
}

export async function createReservation(input: ReservationRequestInput, idempotencyKey?: string) {
  if (idempotencyKey) {
    const replay = await replayIdempotentReservation(idempotencyKey, input);
    if (replay) {
      return replay;
    }
  }

  try {
    return await prisma.$transaction(async (tx) => {
      if (idempotencyKey) {
        await createIdempotencyRecord(tx, idempotentScopes.reserve, idempotencyKey, input);
      }

      const inventory = await findInventoryForReservation(tx, input);
      if (!inventory) {
        throw new ReservationError("Inventory not found for the selected product and warehouse", 404, "INVENTORY_NOT_FOUND");
      }

      const availableStock = inventory.totalStock - inventory.reservedStock;
      if (availableStock < input.quantity) {
        throw new ReservationError("Not enough stock available", 409, "INSUFFICIENT_STOCK");
      }

      await tx.inventory.update({
        where: { id: inventory.id },
        data: {
          reservedStock: {
            increment: input.quantity
          }
        }
      });

      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      const reservation = await tx.reservation.create({
        data: {
          productId: input.productId,
          warehouseId: input.warehouseId,
          quantity: input.quantity,
          status: "PENDING",
          expiresAt
        },
        include: {
          product: true,
          warehouse: true
        }
      });

      const payload = toReservationDetail({
        ...reservation,
        inventory
      });

      if (idempotencyKey) {
        await tx.idempotencyRecord.update({
          where: {
            scope_key: {
              scope: idempotentScopes.reserve,
              key: idempotencyKey
            }
          },
          data: {
            responseStatus: 201,
            responseBody: payload
          }
        });
      }

      return payload;
    });
  } catch (error) {
    if (idempotencyKey && error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const replay = await replayIdempotentReservation(idempotencyKey, input);
      if (replay) {
        return replay;
      }
    }

    if (error instanceof ReservationError) {
      throw error;
    }

    throw new ReservationError("Failed to create reservation", 500, "RESERVATION_CREATE_FAILED");
  }
}

async function lockReservation(tx: Prisma.TransactionClient, reservationId: string) {
  const [reservation] = await tx.$queryRaw<ReservationLockRow[]>`
    SELECT id, "productId", "warehouseId", quantity, status, "expiresAt", "createdAt", "updatedAt"
    FROM "reservations"
    WHERE id = ${reservationId}
    FOR UPDATE
  `;

  if (!reservation) {
    return null;
  }

  const [inventory] = await tx.$queryRaw<InventoryLockRow[]>`
    SELECT id, "productId", "warehouseId", "totalStock", "reservedStock"
    FROM "inventory"
    WHERE "productId" = ${reservation.productId}
      AND "warehouseId" = ${reservation.warehouseId}
    FOR UPDATE
  `;

  if (!inventory) {
    throw new ReservationError("Reservation inventory not found", 404, "INVENTORY_NOT_FOUND");
  }

  const [product, warehouse] = await Promise.all([
    tx.product.findUnique({ where: { id: reservation.productId } }),
    tx.warehouse.findUnique({ where: { id: reservation.warehouseId } })
  ]);

  if (!product || !warehouse) {
    throw new ReservationError("Reservation relations are missing", 500, "RELATION_INTEGRITY_ERROR");
  }

  return {
    reservation,
    product,
    warehouse,
    inventory
  } satisfies LockedReservationBundle;
}

async function releaseReservationStock(tx: Prisma.TransactionClient, reservation: ReservationLockRow, inventory: InventoryLockRow) {
  await tx.inventory.update({
    where: { id: inventory.id },
    data: {
      reservedStock: {
        decrement: reservation.quantity
      }
    }
  });
}

async function settleExpiredReservation(
  tx: Prisma.TransactionClient,
  bundle: LockedReservationBundle
) {
  const { reservation, inventory } = bundle;

  await tx.reservation.update({
    where: { id: reservation.id },
    data: {
      status: "EXPIRED"
    }
  });
  await releaseReservationStock(tx, reservation, inventory);
}

export async function confirmReservation(reservationId: string, idempotencyKey?: string) {
  try {
    return await prisma.$transaction(async (tx) => {
      if (idempotencyKey) {
        await tx.idempotencyRecord.create({
          data: {
            scope: idempotentScopes.confirm,
            key: idempotencyKey,
            requestHash: reservationId
          }
        });
      }

      const bundle = await lockReservation(tx, reservationId);
      if (!bundle) {
        throw new ReservationError("Reservation not found", 404, "RESERVATION_NOT_FOUND");
      }

      const { reservation, product, warehouse, inventory } = bundle;

      if (reservation.status === "CONFIRMED") {
        return bundleToReservationDetail(bundle);
      }

      if (reservation.status !== "PENDING") {
        throw new ReservationError("Reservation is no longer pending", 410, "RESERVATION_NOT_PENDING");
      }

      if (reservation.expiresAt < new Date()) {
        await settleExpiredReservation(tx, bundle);
        throw new ReservationError("Reservation expired", 410, "RESERVATION_EXPIRED");
      }

      await tx.reservation.update({
        where: { id: reservation.id },
        data: {
          status: "CONFIRMED"
        }
      });
      await releaseReservationStock(tx, reservation, inventory);

      const payload = bundleToReservationDetail({
        reservation: {
          ...reservation,
          status: "CONFIRMED",
          confirmedAt: new Date()
        },
        product,
        warehouse,
        inventory: {
          ...inventory,
          reservedStock: inventory.reservedStock - reservation.quantity
        }
      });

      if (idempotencyKey) {
        await tx.idempotencyRecord.update({
          where: {
            scope_key: {
              scope: idempotentScopes.confirm,
              key: idempotencyKey
            }
          },
          data: {
            responseStatus: 200,
            responseBody: payload
          }
        });
      }

      return payload;
    });
  } catch (error) {
    if (idempotencyKey && error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const record = await prisma.idempotencyRecord.findUnique({
        where: {
          scope_key: {
            scope: idempotentScopes.confirm,
            key: idempotencyKey
          }
        }
      });

      if (record?.requestHash === reservationId && record.responseBody) {
        return record.responseBody as ReservationDetail;
      }
    }

    if (error instanceof ReservationError) {
      throw error;
    }

    throw new ReservationError("Failed to confirm reservation", 500, "RESERVATION_CONFIRM_FAILED");
  }
}

export async function releaseReservation(reservationId: string) {
  return prisma.$transaction(async (tx) => {
    const bundle = await lockReservation(tx, reservationId);
    if (!bundle) {
      throw new ReservationError("Reservation not found", 404, "RESERVATION_NOT_FOUND");
    }

    const { reservation, product, warehouse, inventory } = bundle;

    if (reservation.status === "CONFIRMED") {
      return bundleToReservationDetail(bundle);
    }

    if (reservation.status === "RELEASED") {
      return bundleToReservationDetail(bundle);
    }

    if (reservation.status === "EXPIRED" || reservation.expiresAt < new Date()) {
      if (reservation.status === "PENDING") {
        await settleExpiredReservation(tx, bundle);
      }
      throw new ReservationError("Reservation expired", 410, "RESERVATION_EXPIRED");
    }

    await tx.reservation.update({
      where: { id: reservation.id },
      data: {
          status: "RELEASED"
      }
    });
    await releaseReservationStock(tx, reservation, inventory);

    return bundleToReservationDetail({
      reservation: {
        ...reservation,
        status: "RELEASED",
        releasedAt: new Date()
      },
      product,
      warehouse,
      inventory: {
        ...inventory,
        reservedStock: inventory.reservedStock - reservation.quantity
      }
    });
  });
}
