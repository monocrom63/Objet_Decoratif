import assert from "node:assert/strict";
import test from "node:test";
import { orderItemPriceCents } from "./refillPricing.ts";

test("refill orders use the price of the selected size", () => {
  assert.equal(orderItemPriceCents("refill", 3_800, "100 g / Thé"), 3_000);
  assert.equal(orderItemPriceCents("refill", 3_800, "245 g / Thé"), 3_800);
});

test("legacy refill size names and non-refill prices remain supported", () => {
  assert.equal(orderItemPriceCents("refill", 3_800, "Small / Thé"), 3_000);
  assert.equal(orderItemPriceCents("refill", 3_800, "Big / Thé"), 3_800);
  assert.equal(orderItemPriceCents("barrique", 6_800, "100 g / Thé"), 6_800);
});
