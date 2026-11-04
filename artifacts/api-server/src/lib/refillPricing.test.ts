import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_REFILL_OPTIONS,
  isValidRefillOptions,
  orderItemPriceCents,
} from "./refillPricing.ts";

test("refill orders use the price of the selected size", () => {
  assert.equal(orderItemPriceCents("refill", 3_800, "100 g / Thé"), 3_000);
  assert.equal(orderItemPriceCents("refill", 3_800, "245 g / Thé"), 3_800);
});

test("legacy refill size names and non-refill prices remain supported", () => {
  assert.equal(orderItemPriceCents("refill", 3_800, "Small / Thé"), 3_000);
  assert.equal(orderItemPriceCents("refill", 3_800, "Big / Thé"), 3_800);
  assert.equal(orderItemPriceCents("barrique", 6_800, "100 g / Thé"), 6_800);
});

test("configured CMS quantities and prices determine the order price", () => {
  const configured = [
    { quantityGrams: 90, priceCents: 3_200 },
    { quantityGrams: 250, priceCents: 4_100 },
  ];
  assert.equal(
    orderItemPriceCents("refill", 3_800, "90 g / Thé", configured),
    3_200,
  );
  assert.equal(
    orderItemPriceCents("refill", 3_800, "250 g / Thé", configured),
    4_100,
  );
  assert.equal(
    orderItemPriceCents("refill", 3_800, "100 g / Thé", configured),
    3_200,
  );
  assert.deepEqual(DEFAULT_REFILL_OPTIONS, [
    { quantityGrams: 100, priceCents: 3_000 },
    { quantityGrams: 245, priceCents: 3_800 },
  ]);
});

test("only two positive refill quantities with non-negative prices are valid", () => {
  assert.equal(isValidRefillOptions(DEFAULT_REFILL_OPTIONS), true);
  assert.equal(
    isValidRefillOptions([
      { quantityGrams: 100, priceCents: 3_000 },
      { quantityGrams: 100, priceCents: 3_800 },
    ]),
    false,
  );
  assert.equal(
    isValidRefillOptions([
      { quantityGrams: 0, priceCents: 3_000 },
      { quantityGrams: 245, priceCents: -1 },
    ]),
    false,
  );
});
