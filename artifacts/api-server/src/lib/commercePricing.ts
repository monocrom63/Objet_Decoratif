export const FREE_SHIPPING_THRESHOLD_CENTS = 10_000;
export const STANDARD_SHIPPING_CENTS = 800;

export function shippingCentsForSubtotal(subtotalCents: number): number {
  return subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS
    ? 0
    : STANDARD_SHIPPING_CENTS;
}
