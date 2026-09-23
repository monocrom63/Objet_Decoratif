import { db, productsTable, scentsTable } from "@workspace/db";

import { logger } from "./logger";
import { ObjectStorageService } from "./objectStorage";
import {
  CLEANUP_FAILURE_ALERT_THRESHOLD,
  recordCatalogUploadCleanupFailure,
  recordCatalogUploadCleanupSuccess,
} from "./catalogImageCleanupHealth";
import {
  abandonedCatalogUploads,
  referencedCatalogImagePaths as collectReferencedCatalogImagePaths,
  unreferencedManagedImagePaths,
} from "./catalogImageCleanupPolicy";

const storage = new ObjectStorageService();
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

  return collectReferencedCatalogImagePaths({ products, scents });
}

export async function isCatalogImageReferenced(
  objectPath: string,
): Promise<boolean> {
  return (await referencedCatalogImagePaths()).has(objectPath);
}

export async function deleteUnreferencedCatalogImages(
  candidatePaths: Iterable<string>,
): Promise<string[]> {
  const referenced = await referencedCatalogImagePaths();
  const candidates = unreferencedManagedImagePaths(candidatePaths, referenced);
  if (candidates.length === 0) return [];

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
  const candidates = abandonedCatalogUploads(uploads, referenced, now);
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

  recordCatalogUploadCleanupSuccess(result);
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
      const health = recordCatalogUploadCleanupFailure(error);
      logger.error(
        {
          err: error,
          alert: health.status === "degraded",
          cleanupHealth: health,
          failureThreshold: CLEANUP_FAILURE_ALERT_THRESHOLD,
          action:
            "Check object storage access and database connectivity; run the admin cleanup endpoint after recovery.",
        },
        health.status === "degraded"
          ? "ALERT: Catalog upload cleanup repeatedly failing"
          : "Catalog upload cleanup failed",
      );
    });
  };

  runCleanup();
  const timer = setInterval(runCleanup, intervalMs);
  timer.unref();
  logger.info({ intervalMs }, "Catalog upload cleanup scheduled");
  return timer;
}
