import { useEffect, useState, type RefObject } from "react";

import { CARD_THUMBNAIL_LONG_EDGE_PX } from "../shared/preview-policy";

/**
 * Upscaling the bounded thumbnail past this factor reads as visibly soft, so
 * the card swaps in the original file once it is drawn that large.
 */
export const LARGE_CARD_UPSCALE_LIMIT = 1.5;

export function cardNeedsSourceResolution(input: {
  width: number;
  height: number;
  devicePixelRatio: number;
}): boolean {
  const longEdge = Math.max(input.width, input.height) * input.devicePixelRatio;
  return longEdge > CARD_THUMBNAIL_LONG_EDGE_PX * LARGE_CARD_UPSCALE_LIMIT;
}

// One observer for every mounted card; a virtual window can mount hundreds.
const listeners = new Map<Element, (entry: ResizeObserverEntry) => void>();
let sharedObserver: ResizeObserver | null = null;

function observe(
  element: Element,
  listener: (entry: ResizeObserverEntry) => void,
): () => void {
  sharedObserver ??= new ResizeObserver((entries) => {
    for (const entry of entries) listeners.get(entry.target)?.(entry);
  });
  listeners.set(element, listener);
  sharedObserver.observe(element);
  return () => {
    listeners.delete(element);
    sharedObserver?.unobserve(element);
  };
}

/** Whether the card host is drawn larger than its thumbnail can cover. */
export function useLargeCardSource(
  hostRef: RefObject<HTMLElement | null>,
  enabled: boolean,
): boolean {
  const [needsSource, setNeedsSource] = useState(false);
  useEffect(() => {
    const host = hostRef.current;
    if (!enabled || !host || typeof ResizeObserver === "undefined") {
      setNeedsSource(false);
      return;
    }
    return observe(host, (entry) => {
      const { width, height } = entry.contentRect;
      setNeedsSource(
        cardNeedsSourceResolution({
          width,
          height,
          devicePixelRatio: window.devicePixelRatio || 1,
        }),
      );
    });
  }, [enabled, hostRef]);
  return enabled && needsSource;
}
