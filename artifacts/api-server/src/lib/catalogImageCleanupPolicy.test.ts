import assert from "node:assert/strict";
import test from "node:test";

import {
  ABANDONED_UPLOAD_AGE_MS,
  abandonedCatalogUploads,
  removedProductImagePaths,
  replacedScentImagePaths,
  referencedCatalogImagePaths,
  unreferencedManagedImagePaths,
} from "./catalogImageCleanupPolicy.ts";

const shared = "/objects/uploads/00000000-0000-4000-8000-000000000001";
const replacement = "/objects/uploads/00000000-0000-4000-8000-000000000002";

test("product routes submit only removed images after replacement and all images after deletion", () => {
  assert.deepEqual(
    removedProductImagePaths([shared, replacement], [replacement]),
    [shared],
  );
  assert.deepEqual(
    removedProductImagePaths([shared, replacement], []),
    [shared, replacement],
  );
  assert.deepEqual(
    removedProductImagePaths([shared], [shared]),
    [],
  );
});

test("scent routes submit the previous image after replacement or deletion", () => {
  assert.deepEqual(replacedScentImagePaths(shared, replacement), [shared]);
  assert.deepEqual(replacedScentImagePaths(shared, null), [shared]);
  assert.deepEqual(replacedScentImagePaths(shared, shared), []);
  assert.deepEqual(replacedScentImagePaths(null, replacement), []);
});

test("product replacement retains a shared image until its final product reference is removed", () => {
  const afterFirstReplacement = referencedCatalogImagePaths({
    products: [{ imagePaths: [replacement] }, { imagePaths: [shared] }],
    scents: [],
  });
  assert.deepEqual(
    unreferencedManagedImagePaths([shared], afterFirstReplacement),
    [],
  );

  const afterFinalReplacement = referencedCatalogImagePaths({
    products: [{ imagePaths: [replacement] }, { imagePaths: [replacement] }],
    scents: [],
  });
  assert.deepEqual(
    unreferencedManagedImagePaths([shared], afterFinalReplacement),
    [shared],
  );
});

test("product deletion retains a shared image until the final product is deleted", () => {
  const afterFirstDeletion = referencedCatalogImagePaths({
    products: [{ imagePaths: [shared] }],
    scents: [],
  });
  assert.deepEqual(
    unreferencedManagedImagePaths([shared], afterFirstDeletion),
    [],
  );

  const afterFinalDeletion = referencedCatalogImagePaths({
    products: [],
    scents: [],
  });
  assert.deepEqual(
    unreferencedManagedImagePaths([shared], afterFinalDeletion),
    [shared],
  );
});

test("scent replacement retains a shared image until its final scent reference is removed", () => {
  const afterFirstReplacement = referencedCatalogImagePaths({
    products: [],
    scents: [{ imagePath: replacement }, { imagePath: shared }],
  });
  assert.deepEqual(
    unreferencedManagedImagePaths([shared], afterFirstReplacement),
    [],
  );

  const afterFinalReplacement = referencedCatalogImagePaths({
    products: [],
    scents: [{ imagePath: replacement }, { imagePath: null }],
  });
  assert.deepEqual(
    unreferencedManagedImagePaths([shared], afterFinalReplacement),
    [shared],
  );
});

test("scent deletion retains a shared image until the final scent is deleted", () => {
  const afterFirstDeletion = referencedCatalogImagePaths({
    products: [],
    scents: [{ imagePath: shared }],
  });
  assert.deepEqual(
    unreferencedManagedImagePaths([shared], afterFirstDeletion),
    [],
  );

  const afterFinalDeletion = referencedCatalogImagePaths({
    products: [],
    scents: [],
  });
  assert.deepEqual(
    unreferencedManagedImagePaths([shared], afterFinalDeletion),
    [shared],
  );
});

test("references are shared across products and scents", () => {
  const afterProductDeletion = referencedCatalogImagePaths({
    products: [],
    scents: [{ imagePath: shared }],
  });
  assert.deepEqual(
    unreferencedManagedImagePaths([shared], afterProductDeletion),
    [],
  );

  const afterScentDeletion = referencedCatalogImagePaths({
    products: [],
    scents: [],
  });
  assert.deepEqual(
    unreferencedManagedImagePaths([shared], afterScentDeletion),
    [shared],
  );
});

test("static and non-managed image paths are never selected for deletion", () => {
  assert.deepEqual(
    unreferencedManagedImagePaths(
      [
        "/images/seeded-product.webp",
        "/storage/public-objects/catalog/seeded-scent.webp",
        "/objects/catalog/not-an-upload.webp",
        "/objects/uploads/seeded/static-product.webp",
        "https://example.com/catalog/external.webp",
      ],
      new Set(),
    ),
    [],
  );
});

test("duplicate managed paths are selected only once", () => {
  assert.deepEqual(
    unreferencedManagedImagePaths([shared, shared], new Set()),
    [shared],
  );
});

test("abandoned cleanup protects recent and referenced uploads", () => {
  const now = Date.UTC(2026, 8, 23, 12);
  const oldUnreferenced = {
    objectPath: shared,
    createdAt: new Date(now - ABANDONED_UPLOAD_AGE_MS),
  };
  const recentUnreferenced = {
    objectPath: replacement,
    createdAt: new Date(now - ABANDONED_UPLOAD_AGE_MS + 1),
  };
  const oldReferenced = {
    objectPath: "/objects/uploads/00000000-0000-4000-8000-000000000003",
    createdAt: new Date(now - ABANDONED_UPLOAD_AGE_MS - 1),
  };

  assert.deepEqual(
    abandonedCatalogUploads(
      [oldUnreferenced, recentUnreferenced, oldReferenced],
      new Set([oldReferenced.objectPath]),
      now,
    ),
    [oldUnreferenced],
  );
});