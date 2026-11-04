export const REFILL_SIZES = ["100 g", "245 g"] as const;

export type RefillSize = (typeof REFILL_SIZES)[number];

const refillPrices: Record<RefillSize, number> = {
  "100 g": 30,
  "245 g": 38,
};

export function refillSizeFromVariant(variant: string): RefillSize | undefined {
  const size = variant.split("/")[0]?.trim().toLowerCase().replace(/\s+/g, "");
  if (size === "100g" || size === "small") return "100 g";
  if (size === "245g" || size === "big") return "245 g";
  return undefined;
}

export function normalizeRefillVariant(variant: string): string {
  const size = refillSizeFromVariant(variant);
  if (!size) return variant;

  const separator = variant.indexOf("/");
  const scent = separator >= 0 ? variant.slice(separator + 1).trim() : "";
  return scent ? `${size} / ${scent}` : size;
}

export function refillVariant(size: RefillSize, scent: string): string {
  return `${size} / ${scent}`;
}

export function refillPriceEur(size: RefillSize): number {
  return refillPrices[size];
}

export function priceForProductVariant(
  productId: string,
  catalogPriceEur: number,
  variant: string,
): number {
  if (productId !== "refill") return catalogPriceEur;
  const size = refillSizeFromVariant(variant);
  return size ? refillPriceEur(size) : catalogPriceEur;
}
