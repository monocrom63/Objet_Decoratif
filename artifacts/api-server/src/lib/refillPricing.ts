type RefillSize = "100 g" | "245 g";

function refillSizeFromVariant(variant: string): RefillSize | undefined {
  const size = variant.split("/")[0]?.trim().toLowerCase().replace(/\s+/g, "");
  if (size === "100g" || size === "small") return "100 g";
  if (size === "245g" || size === "big") return "245 g";
  return undefined;
}

export function orderItemPriceCents(
  productId: string,
  catalogPriceCents: number,
  variant: string,
): number {
  if (productId !== "refill") return catalogPriceCents;
  const size = refillSizeFromVariant(variant);
  if (size === "100 g") return 3_000;
  if (size === "245 g") return 3_800;
  return catalogPriceCents;
}
