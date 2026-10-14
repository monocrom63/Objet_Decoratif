import { isVideoPath } from "./media.ts";

/** Keep legacy still images, but never reuse a product's portrait video automatically. */
export function scentShowcaseSource(scent: { image?: string; showcaseMedia?: string }): string | undefined {
  return scent.showcaseMedia || (isVideoPath(scent.image) ? undefined : scent.image);
}
