import assert from "node:assert/strict";
import test from "node:test";

import { isCatalogUploadCleanupEnabled } from "./catalogUploadCleanupGuard.ts";

test("automatic catalog upload cleanup remains disabled to preserve CMS media", () => {
  assert.equal(isCatalogUploadCleanupEnabled(), false);
});
