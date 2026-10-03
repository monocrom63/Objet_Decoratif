import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import { initialProducts, initialScents } from "./catalogDefaults.ts";

test("initial catalog preserves the original seven products, prices and four scents", () => {
  assert.deepEqual(
    initialProducts.map(({ id, priceCents }) => [id, priceCents]),
    [
      ["barrique", 6800],
      ["milano", 8200],
      ["boite", 8600],
      ["chateu", 8800],
      ["elephant", 9400],
      ["sakura", 8200],
      ["refill", 3800],
    ],
  );
  assert.deepEqual(
    initialScents.map(({ id }) => id),
    ["the", "santal-cruz", "tropicale", "cedar-salad"],
  );
  const scentIds = initialScents.map(({ id }) => id);
  for (const product of initialProducts) {
    assert.equal(product.active, true);
    assert.equal(product.published, true);
    assert.deepEqual(product.scentIds, scentIds);
  }
});

test("all original catalog image files are included in the storefront", () => {
  const paths = [
    ...initialProducts.flatMap(({ imagePaths }) => imagePaths ?? []),
    ...initialScents
      .map(({ imagePath }) => imagePath)
      .filter((path): path is string => !!path),
  ];
  for (const path of paths) {
    assert.ok(
      existsSync(
        new URL(
          `../../../objet-decoratif-store/public${path}`,
          import.meta.url,
        ),
      ),
      `Missing image: ${path}`,
    );
  }
});
