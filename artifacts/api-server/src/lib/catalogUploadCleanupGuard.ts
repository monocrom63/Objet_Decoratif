/**
 * Upload cleanup is destructive and catalog databases can differ by environment
 * while sharing the same App Storage namespace. Keep it opt-in until storage is
 * isolated or cleanup can account for references from every environment.
 */
export function isCatalogUploadCleanupEnabled(
  value = process.env.CATALOG_UPLOAD_CLEANUP_ENABLED,
): boolean {
  return value === "true";
}
