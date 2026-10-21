import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { productFallbackFiles, scentFallbackFiles } from "./catalog-fallbacks.ts";

const publicProductImages = new URL("../../public/images/products/", import.meta.url);

test("each supported product has at least one local media fallback", () => {
  for (const productId of ["barrique", "milano", "boite", "chateu", "elephant", "sakura", "refill"]) {
    assert.ok(productFallbackFiles[productId]?.length, `${productId} has a fallback`);
  }
});

test("every configured product and scent fallback exists in the published assets", () => {
  const productFiles = Object.values(productFallbackFiles).flat();
  const scentFiles = Object.values(scentFallbackFiles);
  for (const file of [...productFiles, ...scentFiles]) {
    assert.ok(
      existsSync(fileURLToPath(new URL(file, publicProductImages))),
      `missing fallback image ${file}`,
    );
  }
});
