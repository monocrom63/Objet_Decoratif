import { db, productsTable, scentsTable } from "@workspace/db";

import { ObjectStorageService } from "./objectStorage";

const storage = new ObjectStorageService();
const ABANDONED_UPLOAD_AGE_MS = 24 * 60 * 60 * 1000;
const SWEEP_INTERVAL_MS = 60 * 60 * 1000;
let lastSweepAt = 0;

async function referencedCatalogImagePaths(): Promise<Set<string>> {
  const [products, scents] = await Promise.all([
    db.select({ imagePaths: productsTable.imagePaths }).from(productsTable),
    db.select({ imagePath: scentsTable.imagePath }).from(scentsTable),
  ]);

  return new Set(
    [
      ...products.flatMap((product) => product.imagePaths),
      ...scents.map((scent) => scent.imagePath),
    ].filter((path): path is string => Boolean(path)),
  );
}

function managedUploadPaths(paths: Iterable<string>): string[] {
  return Array.from(new Set(paths)).filter((path) =>
    path.startsWith("/objects/uploads/"),
  );
}

export async function deleteUnreferencedCatalogImages(
  candidatePaths: Iterable<string>,
): Promise<string[]> {
  const candidates = managedUploadPaths(candidatePaths);
  if (candidates.length === 0) return [];

  const referenced = await referencedCatalogImagePaths();
  const deleted: string[] = [];
  for (const path of candidates) {
    if (referenced.has(path)) continue;
    if (await storage.deleteObjectEntity(path)) deleted.push(path);
  }
  return deleted;
}

export async function sweepAbandonedCatalogUploads(): Promise<string[]> {
  const now = Date.now();
  if (now - lastSweepAt < SWEEP_INTERVAL_MS) return [];
  lastSweepAt = now;

  const [uploads, referenced] = await Promise.all([
    storage.listUploadedObjectEntities(),
    referencedCatalogImagePaths(),
  ]);
  const staleUnreferenced = uploads
    .filter(
      ({ objectPath, updatedAt }) =>
        !referenced.has(objectPath) &&
        updatedAt !== null &&
        now - updatedAt.getTime() >= ABANDONED_UPLOAD_AGE_MS,
    )
    .map(({ objectPath }) => objectPath);

  return deleteUnreferencedCatalogImages(staleUnreferenced);
}
