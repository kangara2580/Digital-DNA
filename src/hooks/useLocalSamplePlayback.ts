"use client";

import { useCallback, useLayoutEffect, useRef } from "react";
import {
  isLocalPublicVideo,
  localHighlightStartSec,
  localPreviewSegmentSec,
} from "@/lib/localVideoHighlight";

type Options = {
  /** 호버 시 하이라이트 구간 루프 재생 */
  enableHoverLoop: boolean;
  reduceMotion: boolean;
};

/** 정지 썸네일: 항상 초반 몇 프레임만 사용 (metadata 프리로드만으로도 디코드 가능) */
const THUMB_SEEK_CAP_SEC = 0.15;

function thumbSeekSec(loopStartSec: number): number {
  const t = Number.isFinite(loopStartSec) ? loopStartSec : 0.08;
  return Math.min(THUMB_SEEK_CAP_SEC, Math.max(0.04, t));
}

/**
 * 로컬 public 영상: 보이는 video 요소 하나만 사용.
 * - 정지 화면: 초반 구간으로 시크 (버퍼 부족으로 검은 썸네일 방지)
 * - 호버: 하이라이트 구간만 루프 재생
 */
export function useLocalSamplePlayback(
  videoId: string,
  src: string,
  { enableHoverLoop, reduceMotion }: Options,
) {
  const ref = useRef<HTMLVideoElement>(null);
  const hoveringRef = useRef(false);
  /** 호버 루프 시작(하이라이트) */
  const loopStartRef = useRef(0);
  /** 카드 정지 썸네일·호버 종료 후 복귀 시각 — 항상 초반 근처 */
  const thumbSeekRef = useRef(0.08);
  const cap = localPreviewSegmentSec();

  useLayoutEffect(() => {
    if (!isLocalPublicVideo(src)) return;

    let cancelled = false;
    let raf = 0;
    let attempts = 0;

    const attach = () => {
      if (cancelled) return;
      const el = ref.current;
      if (!el) {
        if (attempts++ < 120) {
          raf = requestAnimationFrame(attach);
        }
        return;
      }

      /** metadata만 있으면 시크해도 디코드가 안 되어 검은 썸네일이 남을 수 있음 → 첫 프레임 데이터 이후 시크 */
      const applyThumbSeek = () => {
        if (cancelled) return;
        const dur = Number.isFinite(el.duration) ? el.duration : 0;
        const loopStart = localHighlightStartSec(videoId, dur);
        loopStartRef.current = loopStart;
        const thumb = thumbSeekSec(loopStart);
        thumbSeekRef.current = thumb;
        const afterSeek = () => {
          if (cancelled) return;
          el.pause();
        };
        el.addEventListener("seeked", afterSeek, { once: true });
        el.currentTime = thumb;
      };

      const whenReadyForFrame = () => {
        if (cancelled) return;
        // HAVE_CURRENT_DATA 이상이면 시크 시 한 프레임을 그릴 수 있음
        if (el.readyState >= 2) applyThumbSeek();
        else el.addEventListener("loadeddata", applyThumbSeek, { once: true });
      };

      if (el.readyState >= 1) whenReadyForFrame();
      else el.addEventListener("loadedmetadata", whenReadyForFrame, { once: true });
    };

    attach();

    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
    };
  }, [videoId, src]);

  const onTimeUpdate = useCallback(() => {
    if (!enableHoverLoop || reduceMotion) return;
    const el = ref.current;
    if (!el || !hoveringRef.current) return;
    const start = loopStartRef.current;
    const end = start + cap;
    if (el.currentTime >= end - 0.04) {
      el.currentTime = start;
    }
  }, [enableHoverLoop, reduceMotion, cap]);

  const onEnter = useCallback(() => {
    if (!enableHoverLoop || reduceMotion) return;
    const el = ref.current;
    if (!el) return;
    hoveringRef.current = true;
    el.muted = true;
    el.currentTime = loopStartRef.current;
    void el.play().catch(() => {});
  }, [enableHoverLoop, reduceMotion]);

  const onLeave = useCallback(() => {
    hoveringRef.current = false;
    const el = ref.current;
    if (!el) return;
    el.pause();
    el.currentTime = thumbSeekRef.current;
  }, []);

  return {
    ref,
    onTimeUpdate: enableHoverLoop ? onTimeUpdate : undefined,
    onEnter: enableHoverLoop ? onEnter : undefined,
    onLeave: enableHoverLoop ? onLeave : undefined,
  };
}
