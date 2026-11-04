import { JPEG_IMAGE_EXTENSIONS } from "./media-formats";

/**
 * Bounded source-direct policy for card previews.
 *
 * This is a presentation-route optimization, not an asset acceptance gate:
 * larger or higher-resolution local sources continue through the native
 * thumbnail pipeline and are never rejected because of these thresholds.
 */

export const SOURCE_DIRECT_MAX_LONG_EDGE_PX = 2048;
export const SOURCE_DIRECT_MAX_PIXELS = 2_000_000;
export const SOURCE_DIRECT_MAX_BYTES = 2 * 1024 * 1024;

export const SOURCE_DIRECT_IMAGE_EXTENSIONS = [
  ...JPEG_IMAGE_EXTENSIONS,
  ".png",
  ".webp",
  ".avif",
  ".gif",
] as const;

const SOURCE_DIRECT_EXTENSIONS = new Set<string>(SOURCE_DIRECT_IMAGE_EXTENSIONS);

function extensionFor(fileName: string): string {
  const lower = fileName.toLowerCase();
  const dot = lower.lastIndexOf(".");
  return dot >= 0 ? lower.slice(dot) : "";
}

export type SourceDirectPreviewInput = Readonly<{
  fileName: string;
  mediaType: "image" | "video" | "audio" | "text" | "model" | "document" | "font" | "other";
  byteSize: number;
  width: number | null | undefined;
  height: number | null | undefined;
}>;

/**
 * Return true only when the original can be mounted as a bounded card image.
 * Larger sources use the native thumbnail route; they remain valid assets.
 */
export function isSourceDirectPreview(
  input: SourceDirectPreviewInput,
): boolean {
  if (input.mediaType !== "image") return false;
  if (!SOURCE_DIRECT_EXTENSIONS.has(extensionFor(input.fileName))) return false;
  if (!Number.isSafeInteger(input.byteSize) || input.byteSize <= 0) return false;
  if (input.byteSize > SOURCE_DIRECT_MAX_BYTES) return false;
  if (
    typeof input.width !== "number"
    || typeof input.height !== "number"
    || !Number.isSafeInteger(input.width)
    || !Number.isSafeInteger(input.height)
  ) {
    return false;
  }
  if (input.width <= 0 || input.height <= 0) return false;
  if (Math.max(input.width, input.height) > SOURCE_DIRECT_MAX_LONG_EDGE_PX) return false;
  return input.width * input.height <= SOURCE_DIRECT_MAX_PIXELS;
}

/**
 * Grid thumbnails are bounded to this long edge. Cards drawn larger than it
 * (in device pixels) upscale the thumbnail and read as blurry.
 */
export const CARD_THUMBNAIL_LONG_EDGE_PX = 512;
export const LARGE_CARD_SOURCE_MAX_BYTES = 40 * 1024 * 1024;

/** Static formats Chromium decodes natively; GIF stays on its live path. */
const LARGE_CARD_SOURCE_EXTENSIONS = new Set<string>([
  ...JPEG_IMAGE_EXTENSIONS,
  ".png",
  ".webp",
  ".avif",
]);

/**
 * Return true when a card may swap its bounded thumbnail for the original
 * file once the card is drawn larger than the thumbnail can cover. Only the
 * few cards that are that large ever request the source, so the cost stays
 * bounded at small card sizes.
 */
export function isLargeCardSourceCandidate(input: {
  fileName: string;
  mediaType: SourceDirectPreviewInput["mediaType"];
  byteSize: number;
}): boolean {
  if (input.mediaType !== "image") return false;
  if (!LARGE_CARD_SOURCE_EXTENSIONS.has(extensionFor(input.fileName))) return false;
  if (!Number.isSafeInteger(input.byteSize) || input.byteSize <= 0) return false;
  return input.byteSize <= LARGE_CARD_SOURCE_MAX_BYTES;
}
