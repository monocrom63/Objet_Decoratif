export type RefillOption = {
  quantityGrams: number;
  priceCents: number;
};

export const DEFAULT_REFILL_OPTIONS: RefillOption[] = [
  { quantityGrams: 100, priceCents: 3_000 },
  { quantityGrams: 245, priceCents: 3_800 },
];

export type RefillSize = number;

export function refillOptionsForProduct(
  options?: readonly RefillOption[] | null,
): RefillOption[] {
  if (
    options?.length === 2 &&
    options.every(
      (option) =>
        Number.isSafeInteger(option.quantityGrams) &&
        option.quantityGrams > 0 &&
        Number.isSafeInteger(option.priceCents) &&
        option.priceCents >= 0,
    ) &&
    options[0]?.quantityGrams !== options[1]?.quantityGrams
  ) {
    return options as RefillOption[];
  }
  return DEFAULT_REFILL_OPTIONS;
}

export function refillSizeFromVariant(
  variant: string,
  options?: readonly RefillOption[] | null,
): RefillSize | undefined {
  const available = refillOptionsForProduct(options);
  const size = variant.split("/")[0]?.trim().toLowerCase().replace(/\s+/g, "");
  const grams = size?.match(/^(\d+)g$/)?.[1];
  if (grams) {
    const quantity = Number(grams);
    if (available.some((option) => option.quantityGrams === quantity)) {
      return quantity;
    }
    if (quantity === 100) return available[0]?.quantityGrams;
    if (quantity === 245) return available[1]?.quantityGrams;
  }
  if (size === "small") return available[0]?.quantityGrams;
  if (size === "big") return available[1]?.quantityGrams;
  return undefined;
}

export function normalizeRefillVariant(
  variant: string,
  options?: readonly RefillOption[] | null,
  previousOptions?: readonly RefillOption[] | null,
): string {
  let size = refillSizeFromVariant(variant, options);
  if (size === undefined && previousOptions?.length) {
    const previousSize = refillSizeFromVariant(variant, previousOptions);
    const previousIndex = refillOptionsForProduct(previousOptions).findIndex(
      (option) => option.quantityGrams === previousSize,
    );
    if (previousIndex >= 0) {
      size = refillOptionsForProduct(options)[previousIndex]?.quantityGrams;
    }
  }
  if (size === undefined) return variant;

  const separator = variant.indexOf("/");
  const scent = separator >= 0 ? variant.slice(separator + 1).trim() : "";
  return scent ? `${size} g / ${scent}` : `${size} g`;
}

export function refillVariant(size: RefillSize, scent: string): string {
  return `${size} g / ${scent}`;
}

export function refillPriceEur(
  size: RefillSize,
  options?: readonly RefillOption[] | null,
): number {
  const available = refillOptionsForProduct(options);
  return (
    available.find((option) => option.quantityGrams === size)?.priceCents ??
    available[0]!.priceCents
  ) / 100;
}

export function priceForProductVariant(
  productId: string,
  catalogPriceEur: number,
  variant: string,
  refillOptions?: readonly RefillOption[] | null,
): number {
  if (productId !== "refill") return catalogPriceEur;
  const available = refillOptionsForProduct(refillOptions);
  const size = refillSizeFromVariant(variant, available);
  return size === undefined
    ? catalogPriceEur
    : refillPriceEur(size, available);
}
