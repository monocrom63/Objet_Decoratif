import type { CatalogUploadCleanupResult } from "./catalogImageCleanup";

export const CLEANUP_FAILURE_ALERT_THRESHOLD = 3;

export interface CatalogUploadCleanupHealth {
  status: "ok" | "degraded";
  consecutiveFailures: number;
  latestCounts: CatalogUploadCleanupResult;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  lastFailureMessage: string | null;
}

const initialCounts: CatalogUploadCleanupResult = {
  scanned: 0,
  retained: 0,
  deleted: 0,
};

let health: CatalogUploadCleanupHealth = {
  status: "ok",
  consecutiveFailures: 0,
  latestCounts: initialCounts,
  lastSuccessAt: null,
  lastFailureAt: null,
  lastFailureMessage: null,
};

export function recordCatalogUploadCleanupSuccess(
  result: CatalogUploadCleanupResult,
  occurredAt = new Date(),
): CatalogUploadCleanupHealth {
  health = {
    status: "ok",
    consecutiveFailures: 0,
    latestCounts: { ...result },
    lastSuccessAt: occurredAt.toISOString(),
    lastFailureAt: null,
    lastFailureMessage: null,
  };
  return getCatalogUploadCleanupHealth();
}

export function recordCatalogUploadCleanupFailure(
  error: unknown,
  occurredAt = new Date(),
): CatalogUploadCleanupHealth {
  const consecutiveFailures = health.consecutiveFailures + 1;
  health = {
    ...health,
    status:
      consecutiveFailures >= CLEANUP_FAILURE_ALERT_THRESHOLD
        ? "degraded"
        : "ok",
    consecutiveFailures,
    lastFailureAt: occurredAt.toISOString(),
    lastFailureMessage: error instanceof Error ? error.message : String(error),
  };
  return getCatalogUploadCleanupHealth();
}

export function getCatalogUploadCleanupHealth(): CatalogUploadCleanupHealth {
  return {
    ...health,
    latestCounts: { ...health.latestCounts },
  };
}

export function resetCatalogUploadCleanupHealth(): void {
  health = {
    status: "ok",
    consecutiveFailures: 0,
    latestCounts: { ...initialCounts },
    lastSuccessAt: null,
    lastFailureAt: null,
    lastFailureMessage: null,
  };
}