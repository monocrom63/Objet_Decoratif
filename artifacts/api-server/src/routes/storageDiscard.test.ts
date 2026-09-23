import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import test from "node:test";
import express from "express";

import {
  createDiscardUploadRouter,
  type DiscardManagedUploadDependencies,
} from "./storageDiscard.ts";

const managedPath = "/objects/uploads/00000000-0000-4000-8000-000000000001";

async function withRoute(
  role: string | null,
  referenced: boolean,
  run: (baseUrl: string, deleted: string[]) => Promise<void>,
) {
  const deleted: string[] = [];
  const dependencies: DiscardManagedUploadDependencies = {
    currentUser: async () => (role ? { role } : null),
    isManagedUploadPath: (path) =>
      /^\/objects\/uploads\/[0-9a-f-]+$/i.test(path),
    isCatalogImageReferenced: async () => referenced,
    deleteManagedUpload: async (path) => {
      deleted.push(path);
    },
  };
  const app = express();
  app.use(express.json());
  app.use(createDiscardUploadRouter(dependencies));
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  try {
    const { port } = server.address() as AddressInfo;
    await run(`http://127.0.0.1:${port}`, deleted);
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
}

function discard(baseUrl: string, body: unknown) {
  return fetch(`${baseUrl}/storage/uploads/discard`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

for (const reference of ["product", "scent"]) {
  test(`admin receives 409 for an upload referenced by a ${reference}`, async () => {
    await withRoute("admin", true, async (baseUrl, deleted) => {
      const response = await discard(baseUrl, { objectPath: managedPath });
      assert.equal(response.status, 409);
      assert.deepEqual(await response.json(), {
        error: "Upload is referenced by the catalog",
      });
      assert.deepEqual(deleted, []);
    });
  });
}

test("admin can discard an unreferenced managed upload", async () => {
  await withRoute("admin", false, async (baseUrl, deleted) => {
    const response = await discard(baseUrl, { objectPath: managedPath });
    assert.equal(response.status, 204);
    assert.deepEqual(deleted, [managedPath]);
  });
});

for (const [description, body] of [
  ["invalid", {}],
  ["static", { objectPath: "/storage/public-objects/catalog/image.webp" }],
  ["non-managed", { objectPath: "/objects/catalog/image.webp" }],
] as const) {
  test(`admin receives 400 for a ${description} path`, async () => {
    await withRoute("admin", false, async (baseUrl, deleted) => {
      const response = await discard(baseUrl, body);
      assert.equal(response.status, 400);
      assert.deepEqual(deleted, []);
    });
  });
}

for (const role of [null, "customer"] as const) {
  test(`${role ?? "unauthenticated"} requests remain forbidden`, async () => {
    await withRoute(role, false, async (baseUrl, deleted) => {
      const response = await discard(baseUrl, { objectPath: managedPath });
      assert.equal(response.status, 403);
      assert.deepEqual(deleted, []);
    });
  });
}