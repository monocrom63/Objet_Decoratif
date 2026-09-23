import { db, productsTable, scentsTable } from "@workspace/db";

import { logger } from "./logger";
import { ObjectStorageService } from "./objectStorage";

const storage = new ObjectStorageService();
const ABANDONED_UPLOAD_AGE_MS = 24 * 60 * 60 * 1000;
const DEFAULT_CLEANUP_INTERVAL_MS = 6 * 60 * 60 * 1000;
const MINIMUM_CLEANUP_INTERVAL_MS = 60 * 1000;

export interface CatalogUploadCleanupResult {
  scanned: number;
  retained: number;
  deleted: number;
}

let cleanupInFlight: Promise<CatalogUploadCleanupResult> | null = null;

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

export async function isCatalogImageReferenced(
  objectPath: string,
): Promise<boolean> {
  return (await referencedCatalogImagePaths()).has(objectPath);
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

async function performAbandonedCatalogUploadCleanup(): Promise<CatalogUploadCleanupResult> {
  const now = Date.now();
  const [uploads, referenced] = await Promise.all([
    storage.listManagedUploads(),
    referencedCatalogImagePaths(),
  ]);
  const candidates = uploads
    .filter(
      ({ objectPath, createdAt }) =>
        !referenced.has(objectPath) &&
        now - createdAt.getTime() >= ABANDONED_UPLOAD_AGE_MS,
    );
  const deleted = (
    await Promise.all(
      candidates.map(({ objectPath }) => storage.deleteManagedUpload(objectPath)),
    )
  ).filter(Boolean).length;
  const result = {
    scanned: uploads.length,
    retained: uploads.length - deleted,
    deleted,
  };

  logger.info(result, "Catalog upload cleanup completed");
  return result;
}

export function cleanupAbandonedCatalogUploads(): Promise<CatalogUploadCleanupResult> {
  if (cleanupInFlight) {
    return cleanupInFlight;
  }

  cleanupInFlight = performAbandonedCatalogUploadCleanup().finally(() => {
    cleanupInFlight = null;
  });
  return cleanupInFlight;
}

function cleanupIntervalMs(): number {
  const configured = Number(process.env.CATALOG_UPLOAD_CLEANUP_INTERVAL_MS);
  if (
    Number.isFinite(configured) &&
    configured >= MINIMUM_CLEANUP_INTERVAL_MS
  ) {
    return configured;
  }
  return DEFAULT_CLEANUP_INTERVAL_MS;
}

export function startCatalogUploadCleanupSchedule(): NodeJS.Timeout {
  const intervalMs = cleanupIntervalMs();
  const runCleanup = () => {
    void cleanupAbandonedCatalogUploads().catch((error: unknown) => {
      logger.error({ err: error }, "Catalog upload cleanup failed");
    });
  };

  runCleanup();
  const timer = setInterval(runCleanup, intervalMs);
  timer.unref();
  logger.info({ intervalMs }, "Catalog upload cleanup scheduled");
  return timer;
}
