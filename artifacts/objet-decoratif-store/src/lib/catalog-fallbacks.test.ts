import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  additionalRecoveredProductFiles,
  productFallbackFiles,
  scentFallbackFiles,
} from "./catalog-fallbacks.ts";

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

test("all supplied product photos beyond the current gallery counts are included", () => {
  assert.deepEqual(
    additionalRecoveredProductFiles("barrique", 3),
    ["recovered/barrique-recovered-04.webp", "recovered/barrique-recovered-05.webp"],
  );
  assert.deepEqual(
    additionalRecoveredProductFiles("chateu", 3),
    ["recovered/chateu-recovered-04.webp"],
  );
  assert.deepEqual(additionalRecoveredProductFiles("elephant", 6), []);
});
