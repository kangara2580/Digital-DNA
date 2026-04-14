"use client";

import { useCallback, useMemo, useRef } from "react";
import type { FeedVideo } from "@/data/videos";
import { safePlayVideo } from "@/lib/safeVideoPlay";

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
  /** 첫 호버에서만 auto 프리로드(그리드 마운트 시 N개 동시 auto 방지) */
  const upgradedPreloadRef = useRef(false);
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
    if (!upgradedPreloadRef.current) {
      upgradedPreloadRef.current = true;
      try {
        el.preload = "auto";
      } catch {
        /* noop */
      }
    }
    if (enabled) {
      el.currentTime = 0;
    }
    safePlayVideo(el);
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
