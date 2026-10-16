import assert from "node:assert/strict";
import test from "node:test";
import {
  FREE_SHIPPING_THRESHOLD_EUR,
  freeShippingProgress,
  shippingForSubtotal,
} from "./commerce-pricing.ts";

test("cart progress and checkout shipping use the same free-shipping threshold", () => {
  assert.equal(shippingForSubtotal(99.99), 8);
  assert.equal(shippingForSubtotal(FREE_SHIPPING_THRESHOLD_EUR), 0);
  assert.deepEqual(freeShippingProgress(65), {
    remaining: 35,
    percent: 65,
    reached: false,
  });
  assert.deepEqual(freeShippingProgress(103), {
    remaining: 0,
    percent: 100,
    reached: true,
  });
});
