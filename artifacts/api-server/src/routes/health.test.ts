import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import test from "node:test";
import express from "express";

import {
  recordCatalogUploadCleanupFailure,
  recordCatalogUploadCleanupSuccess,
  resetCatalogUploadCleanupHealth,
  runCatalogUploadCleanupWithHealth,
} from "../lib/catalogImageCleanupHealth.ts";
import healthRouter from "./health.ts";

test.beforeEach(() => resetCatalogUploadCleanupHealth());

interface HealthResponseBody {
  status: "ok" | "degraded";
  catalogUploadCleanup: {
    status: "ok" | "degraded";
    consecutiveFailures: number;
    lastFailureMessage: string | null;
    latestCounts: {
      scanned: number;
      retained: number;
      deleted: number;
    };
  };
}

async function withHealthRoute(
  run: (baseUrl: string) => Promise<void>,
): Promise<void> {
  const app = express();
  app.use(healthRouter);
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address() as AddressInfo;
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
}

test("healthy cleanup state returns 200 with operational counts", async () => {
  recordCatalogUploadCleanupSuccess({
    scanned: 12,
    retained: 9,
    deleted: 3,
  });

  await withHealthRoute(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/healthz`);
    const body = (await response.json()) as HealthResponseBody;

    assert.equal(response.status, 200);
    assert.deepEqual(body.catalogUploadCleanup.latestCounts, {
      scanned: 12,
      retained: 9,
      deleted: 3,
    });
  });
});

test("repeated cleanup failures return 503 with the latest counts", async () => {
  recordCatalogUploadCleanupSuccess({
    scanned: 8,
    retained: 7,
    deleted: 1,
  });
  recordCatalogUploadCleanupFailure(new Error("storage unavailable"));
  recordCatalogUploadCleanupFailure(new Error("storage unavailable"));
  recordCatalogUploadCleanupFailure(new Error("storage unavailable"));

  await withHealthRoute(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/healthz`);
    const body = (await response.json()) as HealthResponseBody;

    assert.equal(response.status, 503);
    assert.deepEqual(body.catalogUploadCleanup.latestCounts, {
      scanned: 8,
      retained: 7,
      deleted: 1,
    });
  });
});

test("real cleanup runs trigger the health alert and clear it after recovery", async () => {
  const failure = new Error("storage unavailable");
  const counts = { scanned: 8, retained: 7, deleted: 1 };

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await assert.rejects(
      runCatalogUploadCleanupWithHealth(
        async () => {
          throw failure;
        },
        new Date(Date.UTC(2026, 9, 16, 12, 0, attempt)),
      ),
      failure,
    );
  }

  await withHealthRoute(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/healthz`);
    const body = (await response.json()) as HealthResponseBody;

    assert.equal(response.status, 503);
    assert.equal(body.status, "degraded");
    assert.equal(body.catalogUploadCleanup.status, "degraded");
    assert.equal(body.catalogUploadCleanup.consecutiveFailures, 3);
    assert.equal(body.catalogUploadCleanup.lastFailureMessage, failure.message);
  });

  const result = await runCatalogUploadCleanupWithHealth(
    async () => counts,
    new Date(Date.UTC(2026, 9, 16, 12, 1)),
  );
  assert.deepEqual(result, counts);

  await withHealthRoute(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/healthz`);
    const body = (await response.json()) as HealthResponseBody;

    assert.equal(response.status, 200);
    assert.equal(body.status, "ok");
    assert.equal(body.catalogUploadCleanup.status, "ok");
    assert.equal(body.catalogUploadCleanup.consecutiveFailures, 0);
    assert.equal(body.catalogUploadCleanup.lastFailureMessage, null);
    assert.deepEqual(body.catalogUploadCleanup.latestCounts, counts);
  });
});