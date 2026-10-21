import assert from "node:assert/strict";
import test from "node:test";

import { isCatalogUploadCleanupEnabled } from "./catalogUploadCleanupGuard.ts";

test("catalog upload cleanup is disabled unless explicitly opted in", () => {
  assert.equal(isCatalogUploadCleanupEnabled(undefined), false);
  assert.equal(isCatalogUploadCleanupEnabled(""), false);
  assert.equal(isCatalogUploadCleanupEnabled("false"), false);
  assert.equal(isCatalogUploadCleanupEnabled("TRUE"), false);
  assert.equal(isCatalogUploadCleanupEnabled("true"), true);
});
