import { isManagedCatalogUpload } from "./catalogMediaPolicy.ts";

export const ABANDONED_UPLOAD_AGE_MS = 24 * 60 * 60 * 1000;

export interface CatalogImageReferences {
  products: Array<{ imagePaths: string[] }>;
  scents: Array<{ imagePath: string | null }>;
}

export interface ManagedUpload {
  objectPath: string;
  createdAt: Date;
}

export function removedProductImagePaths(
  previousPaths: string[],
  currentPaths: string[],
): string[] {
  const current = new Set(currentPaths);
  return previousPaths.filter((path) => !current.has(path));
}

export function replacedScentImagePaths(
  previousPath: string | null | undefined,
  currentPath: string | null | undefined,
): string[] {
  return previousPath && previousPath !== currentPath ? [previousPath] : [];
}

export function referencedCatalogImagePaths({
  products,
  scents,
}: CatalogImageReferences): Set<string> {
  return new Set([
    ...products.flatMap((product) => product.imagePaths),
    ...scents.flatMap((scent) => (scent.imagePath ? [scent.imagePath] : [])),
  ]);
}

export function unreferencedManagedImagePaths(
  paths: Iterable<string>,
  referenced: ReadonlySet<string>,
): string[] {
  return Array.from(new Set(paths)).filter(
    (path) =>
      isManagedCatalogUpload(path) &&
      !referenced.has(path),
  );
}

export function abandonedCatalogUploads(
  uploads: ManagedUpload[],
  referenced: ReadonlySet<string>,
  now: number,
): ManagedUpload[] {
  return uploads.filter(
    ({ objectPath, createdAt }) =>
      !referenced.has(objectPath) &&
      now - createdAt.getTime() >= ABANDONED_UPLOAD_AGE_MS,
  );
}