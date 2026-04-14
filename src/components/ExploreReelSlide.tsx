"use client";

import {
  ExternalLink,
  Eye,
  Heart,
  Volume2,
  VolumeX,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getMetricsForVideoDetail } from "@/data/trendingStats";
import { getCommerceMeta } from "@/data/videoCommerce";
import type { FeedVideo } from "@/data/videos";
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
};

/** 데스크톱: 틱톡 웹 우측 컬럼 — 마켓 수치 + 상세 이동 */
function ReelDesktopRail({
  video,
  className,
}: {
  video: FeedVideo;
  className?: string;
}) {
  const metrics = useMemo(() => getMetricsForVideoDetail(video.id), [video.id]);
  const commerce = useMemo(() => getCommerceMeta(video.id), [video.id]);

  return (
    <aside
      className={`flex w-[min(5.75rem,14vw)] shrink-0 flex-col items-center gap-5 pb-6 pt-4 [html[data-theme='light']_&]:text-zinc-800 ${className ?? ""}`}
      aria-label="판매·반응 정보"
    >
      <div className="flex flex-col items-center gap-1 text-center">
        <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
          가격
        </span>
        {video.priceWon != null ? (
          <span className="text-[13px] font-extrabold tabular-nums text-reels-cyan">
            {video.priceWon.toLocaleString("ko-KR")}
          </span>
        ) : (
          <span className="text-[11px] text-zinc-500">—</span>
        )}
      </div>

      <div className="flex flex-col items-center gap-1 text-center">
        <Wallet className="h-5 w-5 text-reels-cyan/90" strokeWidth={1.75} aria-hidden />
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
        <Heart className="h-5 w-5 text-reels-crimson/90" strokeWidth={1.75} aria-hidden />
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

      <Link
        href={`/video/${video.id}`}
        className="mt-1 flex flex-col items-center gap-1 rounded-2xl border border-reels-cyan/35 bg-reels-cyan/10 px-2 py-2.5 text-[10px] font-bold text-reels-cyan transition hover:bg-reels-cyan/20"
      >
        <ExternalLink className="h-4 w-4" strokeWidth={2} aria-hidden />
        상세
      </Link>
    </aside>
  );
}

/** 모바일: 하단 한 줄 요약 (쇼츠·릴스 하단 메타와 유사) */
function ReelMobileCommerceBar({ video }: { video: FeedVideo }) {
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
          조회 {formatCompactCount(metrics.totalViews)} · ♥ {formatCompactCount(metrics.totalLikes)}
        </p>
      </div>
      <Link
        href={`/video/${video.id}`}
        className="shrink-0 rounded-full border border-reels-cyan/40 bg-reels-cyan/15 px-3 py-1.5 text-[11px] font-bold text-reels-cyan"
      >
        상세
      </Link>
    </div>
  );
}

export function ExploreReelSlide({ video, scrollRootRef }: ReelSlideProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const blockRef = useRef<HTMLDivElement>(null);
  const [muted, setMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const previewSrc = video.previewSrc ?? video.src;
  const posterSrc = sanitizePosterSrc(video.poster);
  const isPexelsBlockedVideo = /^https?:\/\/videos\.pexels\.com\//i.test(previewSrc);

  useEffect(() => {
    const block = blockRef.current;
    const root = scrollRootRef.current;
    if (!block) return;

    const io = new IntersectionObserver(
      (entries) => {
        const el = videoRef.current;
        if (!el) return;
        const e = entries[0];
        if (e.isIntersecting && e.intersectionRatio >= 0.38) {
          el.play().catch(() => {});
        } else {
          el.pause();
        }
      },
      { root: root ?? undefined, threshold: [0, 0.35, 0.55, 0.85, 1] },
    );
    io.observe(block);
    return () => io.disconnect();
  }, [scrollRootRef, video.id]);

  const onTimeUpdate = useCallback(() => {
    const el = videoRef.current;
    if (!el?.duration) return;
    setProgress(el.currentTime / el.duration);
  }, []);

  const toggleMute = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = !el.muted;
    setMuted(el.muted);
  }, []);

  return (
    <div
      ref={blockRef}
      className="flex h-[calc(100dvh-var(--header-height,4.5rem))] w-full shrink-0 snap-start snap-always flex-col bg-[#050508] [html[data-theme='light']_&]:bg-zinc-100"
    >
      <div className="flex min-h-0 w-full flex-1 flex-col md:flex-row md:items-center md:justify-center md:gap-6 md:px-6 lg:gap-10">
        <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 pt-2 md:px-0 md:pt-0">
          <div
            className="relative aspect-[9/16] w-full max-w-[min(420px,100%)] max-h-[min(78dvh,calc(100dvh-var(--header-height)-7rem))] overflow-hidden rounded-2xl border border-white/12 bg-black shadow-[0_24px_80px_-30px_rgba(0,0,0,0.85)] md:max-h-[min(92dvh,calc(100dvh-var(--header-height)-2rem))] [html[data-theme='light']_&]:border-zinc-200"
          >
            <video
              ref={videoRef}
              className="absolute inset-0 h-full w-full object-cover"
              poster={posterSrc}
              src={isPexelsBlockedVideo ? undefined : previewSrc}
              muted={muted}
              playsInline
              loop
              preload={isPexelsBlockedVideo ? "none" : "metadata"}
              onTimeUpdate={onTimeUpdate}
            />
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/35"
              aria-hidden
            />

            <button
              type="button"
              onClick={toggleMute}
              className="pointer-events-auto absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/45 text-white backdrop-blur-md transition hover:bg-black/60"
              aria-label={muted ? "소리 켜기" : "음소거"}
            >
              {muted ? (
                <VolumeX className="h-4 w-4" strokeWidth={2} aria-hidden />
              ) : (
                <Volume2 className="h-4 w-4" strokeWidth={2} aria-hidden />
              )}
            </button>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] space-y-2 p-4 pb-5">
              <p className="text-[13px] font-semibold text-white/90">{video.creator}</p>
              <p className="line-clamp-3 text-left text-[15px] font-bold leading-snug text-white sm:text-[16px]">
                {video.title}
              </p>
              <div className="pointer-events-auto flex flex-wrap items-center gap-2 pt-1">
                {video.priceWon != null ? (
                  <span className="rounded-full bg-black/50 px-2.5 py-1 text-[13px] font-extrabold tabular-nums text-reels-cyan backdrop-blur-sm">
                    {video.priceWon.toLocaleString("ko-KR")}원
                  </span>
                ) : null}
                <Link
                  href={`/video/${video.id}`}
                  className="rounded-full border border-white/30 bg-white/15 px-3 py-1.5 text-[12px] font-bold text-white backdrop-blur-sm transition hover:bg-white/25"
                >
                  구매·라이선스
                </Link>
              </div>
            </div>

            {/* 진행 바 (틱톡 스타일) */}
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-white/15"
              aria-hidden
            >
              <div
                className="h-full bg-reels-crimson/90 transition-[width] duration-150 ease-out"
                style={{ width: `${Math.min(100, progress * 100)}%` }}
              />
            </div>
          </div>
        </div>

        <ReelDesktopRail video={video} className="hidden md:flex" />
      </div>

      <div className="md:hidden">
        <ReelMobileCommerceBar video={video} />
      </div>
    </div>
  );
}
