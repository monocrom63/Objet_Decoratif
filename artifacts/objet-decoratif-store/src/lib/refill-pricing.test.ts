import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_REFILL_OPTIONS,
  normalizeRefillVariant,
  priceForProductVariant,
  refillOptionsForProduct,
  refillPriceEur,
  refillSizeFromVariant,
  refillVariant,
} from "./refill-pricing.ts";

test("refill sizes map to the requested prices", () => {
  assert.equal(refillPriceEur(100), 30);
  assert.equal(refillPriceEur(245), 38);
});

test("refill cart variants preserve size and scent and normalize legacy values", () => {
  assert.equal(refillVariant(100, "Thé"), "100 g / Thé");
  assert.equal(normalizeRefillVariant("Small / Thé"), "100 g / Thé");
  assert.equal(normalizeRefillVariant("Big / Thé"), "245 g / Thé");
  assert.equal(refillSizeFromVariant("245 g / Cedar Salad"), 245);
});

test("only refill variants override the catalog price", () => {
  assert.equal(priceForProductVariant("refill", 38, "100 g / Thé"), 30);
  assert.equal(priceForProductVariant("refill", 38, "245 g / Thé"), 38);
  assert.equal(priceForProductVariant("barrique", 68, "100 g / Thé"), 68);
});

test("CMS-configured amounts and prices drive refill selectors and cart variants", () => {
  const options = [
    { quantityGrams: 90, priceCents: 3_200 },
    { quantityGrams: 250, priceCents: 4_100 },
  ];
  assert.equal(refillPriceEur(90, options), 32);
  assert.equal(refillPriceEur(250, options), 41);
  assert.equal(
    priceForProductVariant("refill", 41, "90 g / Thé", options),
    32,
  );
  assert.equal(
    priceForProductVariant("refill", 41, "250 g / Thé", options),
    41,
  );
  assert.equal(
    normalizeRefillVariant("100 g / Thé", options),
    "90 g / Thé",
  );
  assert.equal(
    normalizeRefillVariant(
      "220 g / Thé",
      options,
      [
        { quantityGrams: 80, priceCents: 2_900 },
        { quantityGrams: 220, priceCents: 3_900 },
      ],
    ),
    "250 g / Thé",
  );
  assert.deepEqual(refillOptionsForProduct([]), DEFAULT_REFILL_OPTIONS);
});
