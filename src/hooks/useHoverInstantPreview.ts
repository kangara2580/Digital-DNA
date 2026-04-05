"use client";

import { useCallback, useMemo, useRef } from "react";
import type { FeedVideo } from "@/data/videos";

const DEFAULT_SEGMENT_SEC = 3;

export function getPreviewSegmentCap(
  video: Pick<FeedVideo, "durationSec" | "previewDurationSec">,
): number {
  const target = video.previewDurationSec ?? DEFAULT_SEGMENT_SEC;
  if (video.durationSec != null && Number.isFinite(video.durationSec)) {
    return Math.min(
      Math.max(target, 0.35),
      Math.max(video.durationSec, 0.35),
    );
  }
  return Math.max(target, 0.35);
}

export function useHoverInstantPreview(
  enabled: boolean,
  video: Pick<FeedVideo, "durationSec" | "previewDurationSec">,
  reduceMotion: boolean,
) {
  const ref = useRef<HTMLVideoElement>(null);
  const hoveringRef = useRef(false);
  const cap = useMemo(() => getPreviewSegmentCap(video), [video]);

  const onTimeUpdate = useCallback(() => {
    if (!enabled) return;
    if (reduceMotion) return;
    const el = ref.current;
    if (!el || !hoveringRef.current) return;
    const dur = el.duration;
    const end =
      Number.isFinite(dur) && dur > 0
        ? Math.min(cap, dur - 0.04)
        : cap;
    if (el.currentTime >= end) {
      el.currentTime = 0;
    }
  }, [enabled, reduceMotion, cap]);

  const onEnter = useCallback(() => {
    if (enabled && reduceMotion) return;
    const el = ref.current;
    if (!el) return;
    hoveringRef.current = true;
    el.muted = true;
    if (enabled) {
      el.currentTime = 0;
    }
    void el.play().catch(() => {});
  }, [enabled, reduceMotion]);

  const onLeave = useCallback(() => {
    hoveringRef.current = false;
    const el = ref.current;
    if (!el) return;
    el.pause();
    el.currentTime = 0;
  }, []);

  return { ref, onTimeUpdate, onEnter, onLeave };
}
