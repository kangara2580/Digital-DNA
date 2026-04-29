"use client";

import { Eye, Heart, Volume2, VolumeX } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePurchasedVideos } from "@/context/PurchasedVideosContext";
import { getMetricsForVideoDetail } from "@/data/trendingStats";
import { getCommerceMeta } from "@/data/videoCommerce";
import type { FeedVideo } from "@/data/videos";
import { safePlayVideo } from "@/lib/safeVideoPlay";
import { sellerProfileHrefFromVideo } from "@/lib/sellerProfile";
import { sanitizePosterSrc } from "@/lib/videoPoster";

function formatCompactWon(n: number): string {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`;
  if (n >= 10_000) return `${Math.round(n / 10_000)}만`;
  return `${n.toLocaleString("ko-KR")}원`;
}

function formatCompactCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${(n / 10_000).toFixed(1)}만`;
  if (n >= 1_000) return `${(n / 1000).toFixed(1)}k`;
  return `${n}`;
}

type ReelSlideProps = {
  video: FeedVideo;
  scrollRootRef: React.RefObject<HTMLDivElement | null>;
  /** 탐색 세션 전체에서 공유 — 영상 넘겨도 유지 */
  muted: boolean;
  onMutedChange: (muted: boolean) => void;
};

/** 데스크톱: 틱톡 웹 우측 컬럼 — 마켓 수치 + 상세 이동 */
function ReelDesktopRail({
  video,
  className,
}: {
  video: FeedVideo;
  className?: string;
}) {
  const router = useRouter();
  const { hasPurchased, markPurchased } = usePurchasedVideos();
  const metrics = useMemo(() => getMetricsForVideoDetail(video.id), [video.id]);
  const commerce = useMemo(() => getCommerceMeta(video.id), [video.id]);

  return (
    <aside
      className={`flex w-[min(5.75rem,14vw)] shrink-0 flex-col items-center gap-5 pb-6 pt-4 [html[data-theme='light']_&]:text-zinc-800 ${className ?? ""}`}
      aria-label="판매·반응 정보"
    >
      <Link
        href={`/video/${video.id}`}
        className="inline-flex items-center justify-center rounded-full border border-reels-crimson/60 bg-reels-crimson px-3.5 py-1.5 text-[12px] font-extrabold text-white shadow-reels-crimson transition hover:brightness-110"
      >
        구매
      </Link>

      <div className="flex flex-col items-center gap-1 text-center">
        <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
          가격
        </span>
        {video.priceWon != null ? (
          <span className="text-[13px] font-extrabold tabular-nums text-[#9DB9FF]">
            {video.priceWon.toLocaleString("ko-KR")}
          </span>
        ) : (
          <span className="text-[11px] text-zinc-500">—</span>
        )}
      </div>

      <div className="flex flex-col items-center gap-1 text-center">
        <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
          누적 수익
        </span>
        <span className="max-w-[5rem] text-[11px] font-bold leading-tight text-zinc-200 [html[data-theme='light']_&]:text-zinc-900">
          {formatCompactWon(metrics.cumulativeRevenueWon)}
        </span>
      </div>

      <div className="flex flex-col items-center gap-1">
        <Eye className="h-5 w-5 text-zinc-400 [html[data-theme='light']_&]:text-zinc-600" strokeWidth={1.75} aria-hidden />
        <span className="font-mono text-[11px] font-bold tabular-nums text-zinc-300 [html[data-theme='light']_&]:text-zinc-800">
          {formatCompactCount(metrics.totalViews)}
        </span>
      </div>

      <div className="flex flex-col items-center gap-1">
        <Heart
          className="h-5 w-5 text-white/90 [html[data-theme='light']_&]:text-zinc-800"
          strokeWidth={1.75}
          aria-hidden
        />
        <span className="font-mono text-[11px] font-bold tabular-nums text-zinc-300 [html[data-theme='light']_&]:text-zinc-800">
          {formatCompactCount(metrics.totalLikes)}
        </span>
      </div>

      <div className="flex flex-col items-center gap-0.5 text-center">
        <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
          복제
        </span>
        <span className="text-[11px] font-bold tabular-nums text-zinc-200 [html[data-theme='light']_&]:text-zinc-900">
          {commerce.salesCount.toLocaleString("ko-KR")}
        </span>
      </div>
    </aside>
  );
}

/** 모바일: 하단 한 줄 요약 (쇼츠·릴스 하단 메타와 유사) */
function ReelMobileCommerceBar({ video }: { video: FeedVideo }) {
  const router = useRouter();
  const { hasPurchased, markPurchased } = usePurchasedVideos();
  const metrics = useMemo(() => getMetricsForVideoDetail(video.id), [video.id]);
  const commerce = useMemo(() => getCommerceMeta(video.id), [video.id]);

  return (
    <div className="flex shrink-0 items-center justify-between gap-2 border-t border-white/10 bg-black/50 px-3 py-2.5 backdrop-blur-md [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white/90">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-bold text-zinc-300 [html[data-theme='light']_&]:text-zinc-700">
          수익 {formatCompactWon(metrics.cumulativeRevenueWon)} · 복제{" "}
          {commerce.salesCount.toLocaleString("ko-KR")}
        </p>
        <p className="truncate font-mono text-[10px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
          조회 {formatCompactCount(metrics.totalViews)} · 반응 {formatCompactCount(metrics.totalLikes)}
        </p>
      </div>
      <span className="shrink-0 rounded-full border border-reels-cyan/30 bg-reels-cyan/10 px-3 py-1.5 text-[11px] font-bold text-reels-cyan">
        재생 중
      </span>
    </div>
  );
}

export function ExploreReelSlide({
  video,
  scrollRootRef,
  muted,
  onMutedChange,
}: ReelSlideProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const blockRef = useRef<HTMLDivElement>(null);
  const progressRailRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [volume, setVolume] = useState(0.75);
  const [volumeUiVisible, setVolumeUiVisible] = useState(false);
  const previewSrc = video.previewSrc ?? video.src;
  const isPexelsBlockedVideo = /^https?:\/\/videos\.pexels\.com\//i.test(previewSrc);
  const posterSrc = sanitizePosterSrc(video.poster);
  const posterFallback =
    posterSrc ?? (video.poster?.trim() || undefined);
  const sellerHref = useMemo(() => sellerProfileHrefFromVideo(video), [video]);

  useEffect(() => {
    const block = blockRef.current;
    const root = scrollRootRef.current;
    if (!block) return;

    const io = new IntersectionObserver(
      (entries) => {
        const el = videoRef.current;
        if (!el) return;
        const e = entries[0];
        if (!e) return;
        if (e.isIntersecting && e.intersectionRatio >= 0.38) {
          safePlayVideo(el);
        } else {
          try {
            el.pause();
          } catch {
            /* noop */
          }
        }
      },
      { root: root ?? undefined, threshold: [0, 0.35, 0.55, 0.85, 1] },
    );
    io.observe(block);
    return () => io.disconnect();
  }, [scrollRootRef, video.id]);

  const onTimeUpdate = useCallback(() => {
    if (isScrubbing) return;
    const el = videoRef.current;
    if (!el?.duration) return;
    setProgress(el.currentTime / el.duration);
  }, [isScrubbing]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    let rafId = 0;
    const sync = () => {
      if (!isScrubbing && el.duration) {
        setProgress(el.currentTime / el.duration);
      }
      if (!el.paused && !el.ended) {
        rafId = window.requestAnimationFrame(sync);
      }
    };
    const onPlay = () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(sync);
    };
    const onPauseLike = () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      rafId = 0;
    };
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPauseLike);
    el.addEventListener("ended", onPauseLike);
    if (!el.paused && !el.ended) onPlay();
    return () => {
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPauseLike);
      el.removeEventListener("ended", onPauseLike);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [isScrubbing]);

  const toggleMute = useCallback(() => {
    setVolumeUiVisible(true);
    onMutedChange(!muted);
  }, [muted, onMutedChange]);

  const onVolumeChange = useCallback(
    (nextValue: number) => {
      const safe = Number.isFinite(nextValue) ? Math.min(1, Math.max(0, nextValue)) : 0;
      setVolume(safe);
      setVolumeUiVisible(true);
      onMutedChange(safe <= 0.001);
    },
    [onMutedChange],
  );

  const togglePlayPause = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      safePlayVideo(el);
      return;
    }
    try {
      el.pause();
    } catch {
      /* noop */
    }
  }, []);

  const syncProgressFromVideo = useCallback(() => {
    const el = videoRef.current;
    if (!el?.duration) return;
    setProgress(el.currentTime / el.duration);
  }, []);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.volume = volume;
    el.muted = muted;
  }, [muted, volume]);

  const seekByClientX = useCallback((clientX: number) => {
    const rail = progressRailRef.current;
    const el = videoRef.current;
    if (!rail || !el?.duration) return;
    const rect = rail.getBoundingClientRect();
    if (rect.width <= 0) return;
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    setProgress(ratio);
    el.currentTime = ratio * el.duration;
  }, []);

  useEffect(() => {
    if (!isScrubbing) return;
    const onPointerMove = (e: PointerEvent) => seekByClientX(e.clientX);
    const onPointerUp = () => {
      setIsScrubbing(false);
    };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [isScrubbing, seekByClientX]);

  useEffect(() => {
    if (!volumeUiVisible) return;
    const timer = window.setTimeout(() => {
      setVolumeUiVisible(false);
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [volumeUiVisible, muted, volume]);

  return (
    <div
      ref={blockRef}
      className="flex h-[calc(100dvh-var(--header-height,4.5rem))] w-full shrink-0 snap-start snap-always flex-col bg-[#050508] [html[data-theme='light']_&]:bg-zinc-100"
    >
      <div className="flex min-h-0 w-full flex-1 items-center justify-center px-2 pt-2 md:px-4 md:pt-0">
        {/*
          영상 열에 명시적 max-width를 두어 aspect-[9/16] + w-full 이 0으로 무너지지 않게 함.
          레일은 같은 flex 줄에서 영상 바로 옆에만 붙음(가운데 단독 정렬 방지).
        */}
        <div className="flex w-full max-w-[min(56rem,calc(100vw-var(--reels-rail-w,0px)-1.5rem))] flex-row items-center justify-center gap-2 md:gap-3 lg:gap-4">
          <div className="relative w-[min(100%,min(420px,calc(100vw-var(--reels-rail-w,0px)-8.5rem)))] shrink-0">
            <div
              className="relative aspect-[9/16] w-full max-h-[min(78dvh,calc(100dvh-var(--header-height)-7rem))] overflow-hidden rounded-2xl border border-white/12 bg-black shadow-[0_24px_80px_-30px_rgba(0,0,0,0.85)] md:max-h-[min(92dvh,calc(100dvh-var(--header-height)-2rem))] [html[data-theme='light']_&]:border-zinc-200"
            >
            <video
              ref={videoRef}
              className="absolute inset-0 z-0 h-full w-full cursor-pointer object-cover"
              poster={posterFallback || undefined}
              src={isPexelsBlockedVideo ? undefined : previewSrc}
              muted={muted}
              playsInline
              loop
              preload={isPexelsBlockedVideo ? "none" : "metadata"}
              onTimeUpdate={onTimeUpdate}
              onLoadedMetadata={syncProgressFromVideo}
              onCanPlay={syncProgressFromVideo}
              onClick={togglePlayPause}
            />
            <div
              className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-black/85 via-black/10 to-black/35"
              aria-hidden
            />

            <button
              type="button"
              onClick={toggleMute}
              className="pointer-events-auto absolute right-3 top-3 z-[3] flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/45 text-white backdrop-blur-md transition hover:bg-black/60"
              aria-label={muted ? "소리 켜기" : "음소거"}
            >
              {muted ? (
                <VolumeX className="h-4 w-4" strokeWidth={2} aria-hidden />
              ) : (
                <Volume2 className="h-4 w-4" strokeWidth={2} aria-hidden />
              )}
            </button>
            {volumeUiVisible ? (
              <div className="pointer-events-auto absolute right-[0.7rem] top-[3.6rem] z-[3] flex h-28 w-9 items-center justify-center rounded-full border border-white/15 bg-black/45 backdrop-blur-md">
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={muted ? 0 : volume}
                  onChange={(e) => onVolumeChange(e.currentTarget.valueAsNumber)}
                  className="h-6 w-20 -rotate-90 cursor-pointer appearance-none bg-transparent [&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-white/30 [&::-webkit-slider-thumb]:-mt-[5px] [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#9DB9FF] [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(157,185,255,0.85)] [&::-moz-range-track]:h-1.5 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-white/30 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-[#9DB9FF]"
                  aria-label="볼륨 조절"
                />
              </div>
            ) : null}

            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] space-y-2 p-4 pb-5">
              <Link
                href={sellerHref}
                className="pointer-events-auto inline-flex text-[13px] font-semibold text-white/90 underline-offset-2 hover:text-reels-cyan hover:underline"
              >
                {video.creator}
              </Link>
              <p className="line-clamp-3 text-left text-[15px] font-bold leading-snug text-white sm:text-[16px]">
                {video.title}
              </p>
            </div>

            {/* 진행 바 (틱톡 스타일) */}
            <div
              ref={progressRailRef}
              className="pointer-events-auto absolute inset-x-0 bottom-0 z-[4] h-[5px] cursor-ew-resize bg-transparent"
              onPointerDown={(e) => {
                setIsScrubbing(true);
                seekByClientX(e.clientX);
              }}
              aria-label="재생 구간 이동"
              role="slider"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round((progress || 0) * 100)}
            >
              <div
                className="h-full rounded-r-full"
                style={{
                  width: `${progress > 0 ? Math.max(0.8, Math.min(100, progress * 100)) : 0}%`,
                  background:
                    "linear-gradient(90deg, #7F8FA8 0%, #F4F2E8 38%, #D6DFEE 66%, #8C9DB8 100%)",
                  boxShadow: "0 0 10px rgba(214,223,238,0.45)",
                  transition: isScrubbing ? "none" : "width 90ms linear",
                }}
              />
            </div>
          </div>
          </div>

          <ReelDesktopRail video={video} className="hidden shrink-0 md:flex" />
        </div>
      </div>

      <div className="md:hidden">
        <ReelMobileCommerceBar video={video} />
      </div>
    </div>
  );
}
