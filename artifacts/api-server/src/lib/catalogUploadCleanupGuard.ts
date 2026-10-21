/**
 * Catalog uploads are durable CMS content and storage may be shared by
 * development and production. Automatic deletion stays disabled even if an old
 * deployment still defines the legacy opt-in variable.
 */
export function isCatalogUploadCleanupEnabled(): boolean {
  return false;
}
