import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeRefillVariant,
  priceForProductVariant,
  refillPriceEur,
  refillSizeFromVariant,
  refillVariant,
} from "./refill-pricing.ts";

test("refill sizes map to the requested prices", () => {
  assert.equal(refillPriceEur("100 g"), 30);
  assert.equal(refillPriceEur("245 g"), 38);
});

test("refill cart variants preserve size and scent and normalize legacy values", () => {
  assert.equal(refillVariant("100 g", "Thé"), "100 g / Thé");
  assert.equal(normalizeRefillVariant("Small / Thé"), "100 g / Thé");
  assert.equal(normalizeRefillVariant("Big / Thé"), "245 g / Thé");
  assert.equal(refillSizeFromVariant("245 g / Cedar Salad"), "245 g");
});

test("only refill variants override the catalog price", () => {
  assert.equal(priceForProductVariant("refill", 38, "100 g / Thé"), 30);
  assert.equal(priceForProductVariant("refill", 38, "245 g / Thé"), 38);
  assert.equal(priceForProductVariant("barrique", 68, "100 g / Thé"), 68);
});
