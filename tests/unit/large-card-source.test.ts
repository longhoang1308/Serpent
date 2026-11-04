import { describe, expect, it } from "vitest";
import {
  LARGE_CARD_SOURCE_MAX_BYTES,
  isLargeCardSourceCandidate,
} from "../../src/shared/preview-policy";
import { cardNeedsSourceResolution } from "../../src/renderer/use-large-card-source";

describe("isLargeCardSourceCandidate", () => {
  const base = { fileName: "board.png", mediaType: "image" as const, byteSize: 4_000_000 };

  it("accepts browser-decodable stills", () => {
    for (const fileName of ["a.png", "a.JPG", "a.jpeg", "a.webp", "a.avif"]) {
      expect(isLargeCardSourceCandidate({ ...base, fileName })).toBe(true);
    }
  });

  it("leaves GIFs, non-native formats, and non-images on the thumbnail", () => {
    expect(isLargeCardSourceCandidate({ ...base, fileName: "a.gif" })).toBe(false);
    expect(isLargeCardSourceCandidate({ ...base, fileName: "a.psd" })).toBe(false);
    expect(isLargeCardSourceCandidate({ ...base, fileName: "a.tiff" })).toBe(false);
    expect(isLargeCardSourceCandidate({ ...base, mediaType: "video" })).toBe(false);
  });

  it("bounds the source size", () => {
    expect(isLargeCardSourceCandidate({ ...base, byteSize: 0 })).toBe(false);
    expect(
      isLargeCardSourceCandidate({ ...base, byteSize: LARGE_CARD_SOURCE_MAX_BYTES }),
    ).toBe(true);
    expect(
      isLargeCardSourceCandidate({ ...base, byteSize: LARGE_CARD_SOURCE_MAX_BYTES + 1 }),
    ).toBe(false);
  });
});

describe("cardNeedsSourceResolution", () => {
  it("keeps the thumbnail while it covers the drawn card", () => {
    expect(cardNeedsSourceResolution({ width: 300, height: 200, devicePixelRatio: 2 })).toBe(false);
    expect(cardNeedsSourceResolution({ width: 760, height: 400, devicePixelRatio: 1 })).toBe(false);
  });

  it("asks for the source once the card outgrows the thumbnail", () => {
    expect(cardNeedsSourceResolution({ width: 400, height: 260, devicePixelRatio: 2 })).toBe(true);
    expect(cardNeedsSourceResolution({ width: 1900, height: 1040, devicePixelRatio: 2 })).toBe(true);
    expect(cardNeedsSourceResolution({ width: 200, height: 900, devicePixelRatio: 1 })).toBe(true);
  });
});
