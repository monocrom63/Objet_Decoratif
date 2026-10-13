export function catalogUploadExtension(
  contentType: string,
  size: number,
): "" | ".mp4" | ".webm" | null {
  if (!Number.isSafeInteger(size) || size <= 0) return null;
  if (/^image\/(jpeg|png|webp|gif|avif|svg\+xml)$/.test(contentType)) {
    return size <= 10 * 1024 * 1024 ? "" : null;
  }
  if (size > 100 * 1024 * 1024) return null;
  if (contentType === "video/mp4") return ".mp4";
  if (contentType === "video/webm") return ".webm";
  return null;
}

export function isManagedCatalogUpload(path: string): boolean {
  return /^\/objects\/uploads\/[0-9a-f-]+(?:\.(?:mp4|webm))?$/i.test(path);
}

export function byteRange(
  header: string,
  size: number,
): { start: number; end: number } | null {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header);
  if (!match || (!match[1] && !match[2]) || size <= 0) return null;
  const start = match[1]
    ? Number(match[1])
    : Math.max(0, size - Number(match[2]));
  const end =
    match[1] && match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
  if (
    !Number.isSafeInteger(start) ||
    !Number.isSafeInteger(end) ||
    start >= size ||
    end < start
  )
    return null;
  return { start, end };
}
