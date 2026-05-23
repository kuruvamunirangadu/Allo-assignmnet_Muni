import { getCatalog } from "@/lib/reservations";
import { ProductCatalogClient } from "@/components/product-catalog-client";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const catalog = await getCatalog();

  return <ProductCatalogClient initialCatalog={catalog} />;
}
