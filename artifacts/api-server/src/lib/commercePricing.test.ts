import assert from "node:assert/strict";
import test from "node:test";
import {
  FREE_SHIPPING_THRESHOLD_CENTS,
  shippingCentsForSubtotal,
} from "./commercePricing.ts";

test("free shipping starts at the advertised 100 euro threshold", () => {
  assert.equal(shippingCentsForSubtotal(9_999), 800);
  assert.equal(
    shippingCentsForSubtotal(FREE_SHIPPING_THRESHOLD_CENTS),
    0,
  );
  assert.equal(shippingCentsForSubtotal(10_600), 0);
});
