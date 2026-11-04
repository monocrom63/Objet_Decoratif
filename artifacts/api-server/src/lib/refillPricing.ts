export type RefillOption = {
  quantityGrams: number;
  priceCents: number;
};

export const DEFAULT_REFILL_OPTIONS: RefillOption[] = [
  { quantityGrams: 100, priceCents: 3_000 },
  { quantityGrams: 245, priceCents: 3_800 },
];

export function refillOptionsForProduct(
  options?: RefillOption[] | null,
): RefillOption[] {
  return options?.length === 2 ? options : DEFAULT_REFILL_OPTIONS;
}

export function isValidRefillOptions(
  options: unknown,
): options is RefillOption[] {
  if (!Array.isArray(options) || options.length !== 2) return false;
  const normalized = options as RefillOption[];
  return (
    normalized.every(
      (option) =>
        Number.isSafeInteger(option?.quantityGrams) &&
        option.quantityGrams > 0 &&
        Number.isSafeInteger(option?.priceCents) &&
        option.priceCents >= 0,
    ) &&
    normalized[0].quantityGrams !== normalized[1].quantityGrams
  );
}

export function refillQuantityFromVariant(
  variant: string,
  options?: RefillOption[] | null,
): number | undefined {
  const available = refillOptionsForProduct(options);
  const size = variant.split("/")[0]?.trim().toLowerCase().replace(/\s+/g, "");
  const numericSize = size?.match(/^(\d+)g$/)?.[1];
  if (numericSize) {
    const grams = Number(numericSize);
    if (available.some((option) => option.quantityGrams === grams)) return grams;
    if (grams === 100) return available[0]?.quantityGrams;
    if (grams === 245) return available[1]?.quantityGrams;
  }
  if (size === "small") return available[0]?.quantityGrams;
  if (size === "big") return available[1]?.quantityGrams;
  return undefined;
}

export function orderItemPriceCents(
  productId: string,
  catalogPriceCents: number,
  variant: string,
  refillOptions?: RefillOption[] | null,
): number {
  if (productId !== "refill") return catalogPriceCents;
  const available = refillOptionsForProduct(refillOptions);
  const quantityGrams = refillQuantityFromVariant(variant, available);
  return (
    available.find((option) => option.quantityGrams === quantityGrams)
      ?.priceCents ?? catalogPriceCents
  );
}
