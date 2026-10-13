export const CATALOG_MEDIA_ACCEPT =
  "image/png,image/jpeg,image/webp,video/mp4,video/webm,.mp4,.webm";

export function isVideoPath(path: string | null | undefined): boolean {
  return !!path && /\.(mp4|webm)(?:[?#]|$)/i.test(path);
}

export function catalogFileType(file: File): string {
  if (file.type) return file.type;
  if (/\.mp4$/i.test(file.name)) return "video/mp4";
  if (/\.webm$/i.test(file.name)) return "video/webm";
  return "";
}

export function validateCatalogFile(file: File): string {
  const contentType = catalogFileType(file);
  const video = contentType === "video/mp4" || contentType === "video/webm";
  if (!video && !/^image\/(png|jpeg|webp)$/.test(contentType)) {
    throw new Error("Bitte PNG, JPEG, WebP, MP4 oder WebM auswählen.");
  }
  if (file.size <= 0 || file.size > (video ? 100 : 10) * 1024 * 1024) {
    throw new Error(
      video
        ? "Videos dürfen maximal 100 MB groß sein."
        : "Bilder dürfen maximal 10 MB groß sein.",
    );
  }
  return contentType;
}
