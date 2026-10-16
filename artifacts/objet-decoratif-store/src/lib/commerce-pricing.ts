export const FREE_SHIPPING_THRESHOLD_EUR = 100;
export const STANDARD_SHIPPING_EUR = 8;

export function shippingForSubtotal(subtotal: number): number {
  return subtotal >= FREE_SHIPPING_THRESHOLD_EUR
    ? 0
    : STANDARD_SHIPPING_EUR;
}

export function freeShippingProgress(subtotal: number) {
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD_EUR - subtotal);
  return {
    remaining,
    percent: Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD_EUR) * 100),
    reached: remaining === 0,
  };
}
