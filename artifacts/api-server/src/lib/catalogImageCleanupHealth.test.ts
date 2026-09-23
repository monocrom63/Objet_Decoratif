import assert from "node:assert/strict";
import test from "node:test";

import {
  getCatalogUploadCleanupHealth,
  recordCatalogUploadCleanupFailure,
  recordCatalogUploadCleanupSuccess,
  resetCatalogUploadCleanupHealth,
} from "./catalogImageCleanupHealth.ts";

test.beforeEach(() => resetCatalogUploadCleanupHealth());

test("repeated failures degrade cleanup health and retain the latest counts", () => {
  recordCatalogUploadCleanupSuccess(
    { scanned: 12, retained: 9, deleted: 3 },
    new Date("2026-09-23T10:00:00.000Z"),
  );

  recordCatalogUploadCleanupFailure(
    new Error("storage unavailable"),
    new Date("2026-09-23T11:00:00.000Z"),
  );
  recordCatalogUploadCleanupFailure(new Error("storage unavailable"));
  const health = recordCatalogUploadCleanupFailure(new Error("storage unavailable"));

  assert.equal(health.status, "degraded");
  assert.equal(health.consecutiveFailures, 3);
  assert.deepEqual(health.latestCounts, {
    scanned: 12,
    retained: 9,
    deleted: 3,
  });
  assert.equal(health.lastFailureMessage, "storage unavailable");
});

test("a successful run clears failure state and publishes its counts", () => {
  recordCatalogUploadCleanupFailure(new Error("database unavailable"));
  recordCatalogUploadCleanupFailure(new Error("database unavailable"));
  recordCatalogUploadCleanupFailure(new Error("database unavailable"));

  const health = recordCatalogUploadCleanupSuccess(
    { scanned: 8, retained: 7, deleted: 1 },
    new Date("2026-09-23T12:00:00.000Z"),
  );

  assert.deepEqual(health, {
    status: "ok",
    consecutiveFailures: 0,
    latestCounts: { scanned: 8, retained: 7, deleted: 1 },
    lastSuccessAt: "2026-09-23T12:00:00.000Z",
    lastFailureAt: null,
    lastFailureMessage: null,
  });
  assert.deepEqual(getCatalogUploadCleanupHealth(), health);
});