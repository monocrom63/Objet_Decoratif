import assert from "node:assert/strict";
import { test } from "node:test";
import {
  localizedProductDescription,
  localizedProductExplanation,
} from "./product-copy.ts";

const translate = (text: string) => `translated:${text}`;
const product = {
  description: "Compact, soft and perfectly balanced",
  descriptionDe: "Kompakt, weich und perfekt ausbalanciert",
  explanation: "Made to stay on the shelf.",
  explanationDe: "Dafür gemacht, lange zu bleiben.",
};

test("uses German CMS descriptions and explanations in the German shop", () => {
  assert.equal(
    localizedProductDescription(product, "de-DE", translate),
    product.descriptionDe,
  );
  assert.equal(
    localizedProductExplanation(product, "DE", translate),
    product.explanationDe,
  );
});

test("keeps English copy in the English shop", () => {
  assert.equal(
    localizedProductDescription(product, "en-GB", translate),
    "translated:Compact, soft and perfectly balanced",
  );
});

test("falls back to existing translations when a German CMS field is blank", () => {
  assert.equal(
    localizedProductDescription({ ...product, descriptionDe: "  " }, "DE", translate),
    "translated:Compact, soft and perfectly balanced",
  );
});

test("returns the German text exactly as entered instead of translating or trimming it", () => {
  const exactCopy = "\nNatürlich weich und ausgewogen.\n";
  assert.equal(
    localizedProductDescription(
      { ...product, descriptionDe: exactCopy },
      "DE",
      translate,
    ),
    exactCopy,
  );
});
