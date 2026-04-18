"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getTikTokManualRanking,
  manualTikTokRankingToFeedVideos,
} from "@/data/tiktokData";
import { getTrendingMetrics } from "@/data/trendingStats";
import { type FeedVideo } from "@/data/videos";
import { usePassVerticalWheelToPage } from "@/hooks/usePassVerticalWheelToPage";
import { SectionMoreLink } from "./SectionMoreLink";
import { TrendingVideoStatsFooter } from "./TrendingVideoStatsFooter";
import { VideoCard } from "./VideoCard";

/** Top 10 + 끝 더보기 — 가로 스크롤 (lg+: 한 화면에 카드 5개 분량) */
const TRENDING_STRIP =
  "no-scrollbar -mx-4 flex w-full snap-x snap-proximity items-stretch gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:gap-3 sm:px-0 md:gap-3 lg:gap-4";

/** 모바일·태블릿은 좁게, lg 이상은 (100% - 4×gap) / 5 로 정확히 5열 분량 */
const CARD_SLOT =
  "relative shrink-0 snap-center " +
  "w-[min(48vw,260px)] min-w-[min(48vw,168px)] max-w-[260px] " +
  "sm:w-[min(42vw,280px)] sm:max-w-[280px] " +
  "lg:w-[calc((100%-3rem)/4)] lg:min-w-[calc((100%-3rem)/4)] lg:max-w-[calc((100%-3rem)/4)]";

const MORE_CELL =
  "relative shrink-0 snap-center " +
  "w-[min(48vw,260px)] min-w-[min(48vw,168px)] max-w-[260px] " +
  "sm:w-[min(42vw,280px)] sm:max-w-[280px] " +
  "lg:w-[calc((100%-3rem)/4)] lg:min-w-[calc((100%-3rem)/4)] lg:max-w-[calc((100%-3rem)/4)]";

const ARROW_BTN =
  "pointer-events-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-black/60 text-zinc-200 shadow-lg shadow-black/40 backdrop-blur-md transition hover:border-reels-cyan/35 hover:text-white active:scale-[0.97] motion-reduce:transition-none";

const RIGHT_MINI_ARROW_BTN =
  "pointer-events-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/30 bg-black text-white shadow-lg shadow-black/50 transition active:scale-[0.97] disabled:cursor-default disabled:border-white/15 disabled:bg-zinc-900 disabled:text-zinc-500 motion-reduce:transition-none";

function SkeletonRow() {
  return (
    <div className={TRENDING_STRIP} role="status" aria-live="polite" aria-label="인기순위 영상 불러오는 중">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={`skeleton-${i}`} className={CARD_SLOT}>
          <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
            <div className="aspect-[3/4] animate-pulse bg-zinc-800/70 [html[data-theme='light']_&]:bg-zinc-200" />
            <div className="space-y-2 px-3 py-3">
              <div className="h-3 w-3/4 animate-pulse rounded bg-zinc-700/80 [html[data-theme='light']_&]:bg-zinc-300" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-zinc-700/80 [html[data-theme='light']_&]:bg-zinc-300" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function TrendingRankSection() {
  const [trendingClips, setTrendingClips] = useState<FeedVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [liveStatsByVideoId, setLiveStatsByVideoId] = useState<
    Record<string, { playCount: number; diggCount: number }>
  >({});

  // 순위 고정: 새로고침(loadTrending) 시에만 목록을 갱신하고, 렌더 중에는 재정렬하지 않습니다.
  const rankedRows = useMemo(
    () =>
      trendingClips.map((video, rankIndex) => ({
        key: `fixed-${rankIndex}-${video.id}`,
        video,
        metrics: (() => {
          const base = getTrendingMetrics(video.id, rankIndex);
          const live = video.tiktokEmbedId
            ? liveStatsByVideoId[video.tiktokEmbedId]
            : undefined;
          if (!live) return base;
          return {
            ...base,
            totalViews: live.playCount,
            totalLikes: live.diggCount,
          };
        })(),
      })),
    [trendingClips, liveStatsByVideoId],
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  usePassVerticalWheelToPage(scrollRef);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const [atEnd, setAtEnd] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, clientWidth, scrollWidth } = el;
    const max = scrollWidth - clientWidth;
    setCanLeft(scrollLeft > 6);
    setCanRight(max > 6 && scrollLeft < max - 6);
    setAtEnd(max <= 6 || scrollLeft >= max - 8);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const ro = new ResizeObserver(() => updateScrollState());
    ro.observe(el);
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    updateScrollState();
    requestAnimationFrame(() => updateScrollState());

    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState]);

  const scrollByDir = (dir: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    if (max <= 0) return;
    const step = Math.min(Math.max(el.clientWidth * 0.32, 220), max / 3.15);
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  const loadTrending = useCallback(() => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const ranking = getTikTokManualRanking();
      const next = manualTikTokRankingToFeedVideos(ranking).map((v) => ({ ...v }));
      setTrendingClips(next);
      if (!next.length) {
        setErrorMessage(
          "표시할 영상이 없습니다. src/data/tiktokData.ts 의 FILE_RAW_MANUAL_TIKTOK_URLS 에 URL을 넣거나, Vercel에 NEXT_PUBLIC_TRENDING_TIKTOK_URLS 를 설정하세요.",
        );
      }
    } catch {
      setTrendingClips([]);
      setErrorMessage("목록을 불러오지 못했어요. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshLiveStats = useCallback(async () => {
    const ranking = getTikTokManualRanking();
    if (!ranking.length) return;

    const settled = await Promise.allSettled(
      ranking.map(async (row) => {
        const res = await fetch(
          `/api/tiktok/live-stats?url=${encodeURIComponent(row.url)}`,
          { cache: "no-store" },
        );
        if (!res.ok) return null;
        const j = (await res.json()) as {
          videoId?: string;
          playCount?: number;
          diggCount?: number;
        };
        if (
          !j.videoId ||
          typeof j.playCount !== "number" ||
          typeof j.diggCount !== "number"
        ) {
          return null;
        }
        return {
          videoId: j.videoId,
          playCount: j.playCount,
          diggCount: j.diggCount,
        };
      }),
    );

    const next: Record<string, { playCount: number; diggCount: number }> = {};
    for (const row of settled) {
      if (row.status !== "fulfilled" || !row.value) continue;
      next[row.value.videoId] = {
        playCount: row.value.playCount,
        diggCount: row.value.diggCount,
      };
    }
    if (Object.keys(next).length) setLiveStatsByVideoId(next);
  }, []);

  useEffect(() => {
    void loadTrending();
  }, [loadTrending]);

  useEffect(() => {
    void refreshLiveStats();
    const t = window.setInterval(() => {
      void refreshLiveStats();
    }, 45_000);
    return () => window.clearInterval(t);
  }, [refreshLiveStats]);

  return (
    <section className="border-t border-white/10 bg-transparent" aria-labelledby="trending-rank-heading">
      <div className="mx-auto max-w-[1800px] px-4 pb-16 pt-6 sm:px-6 sm:pb-20 sm:pt-7 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className="min-w-0 text-left">
            <h2
              id="trending-rank-heading"
              className="flex flex-wrap items-center gap-2.5 text-[22px] font-extrabold leading-snug tracking-tight text-zinc-100 sm:gap-3 sm:text-[26px] md:text-[28px]"
            >
              실시간 인기순위 영상
            </h2>
            {errorMessage ? (
              <p className="mt-1.5 text-[12px] font-medium text-rose-300 [html[data-theme='light']_&]:text-rose-600">
                {errorMessage}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-2 self-stretch sm:self-center">
            <SectionMoreLink
              category="best"
              className="shrink-0 self-stretch sm:self-center"
            />
          </div>
        </div>

        <div className="relative mt-3 sm:mt-4">
          {loading ? <SkeletonRow /> : null}

          {!loading && rankedRows.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-6 text-center [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white">
              <p className="text-[14px] font-medium text-zinc-300 [html[data-theme='light']_&]:text-zinc-700">
                표시할 인기 영상이 없습니다.
              </p>
              <div className="mt-3 flex items-center justify-center gap-2">
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-[12px] font-semibold text-zinc-200 transition-colors hover:border-white/35 hover:bg-white/10"
                  onClick={() => void loadTrending()}
                >
                  다시 불러오기
                </button>
              </div>
            </div>
          ) : null}

          {!loading && rankedRows.length > 0 ? (
            <>
          {canLeft ? (
            <div
              className="pointer-events-none absolute inset-y-2 left-0 z-10 w-11 bg-gradient-to-r from-[#050505] via-[#050505]/88 to-transparent"
              aria-hidden
            />
          ) : null}
          {canRight ? (
            <div
              className="pointer-events-none absolute inset-y-2 right-0 z-10 w-11 bg-gradient-to-l from-[#050505] via-[#050505]/88 to-transparent"
              aria-hidden
            />
          ) : null}

            <div
              ref={scrollRef}
              className={TRENDING_STRIP}
              role="list"
              aria-label="인기순위 영상 목록"
            >
              {rankedRows.map((entry, rankIndex) => (
                <div
                  key={entry.key}
                  className={CARD_SLOT}
                  role="listitem"
                >
                  <span
                    className="absolute left-1.5 top-1.5 z-[25] flex h-6 min-w-[1.5rem] items-center justify-center rounded-full border border-white/20 bg-white/10 px-1.5 text-[11px] font-extrabold tabular-nums text-zinc-100 shadow-lg shadow-reels-crimson/10 backdrop-blur-md sm:left-2 sm:top-2 sm:h-7 sm:min-w-[1.75rem] sm:px-2 sm:text-[12px] md:left-2.5 md:top-2.5 md:h-8 md:min-w-[2rem] md:text-[13px]"
                    aria-label={`${rankIndex + 1}위`}
                  >
                    {rankIndex + 1}
                  </span>
                  <VideoCard
                    video={entry.video}
                    reelLayout
                    reelStrip
                    disableHoverScale
                    preloadMode="none"
                    detailHref={
                      entry.video.tiktokEmbedId
                        ? `/video/tiktok-${entry.video.tiktokEmbedId}`
                        : `/video/${entry.video.id}`
                    }
                    className="h-full min-w-0"
                    footerExtension={
                      <TrendingVideoStatsFooter
                        metrics={entry.metrics}
                        salePriceWon={entry.video.priceWon}
                      />
                    }
                  />
                </div>
              ))}

              <div className={MORE_CELL} role="listitem">
                <Link
                  href="/category/best"
                  className={`reels-trending-more-label flex h-full min-h-[280px] w-full flex-col items-center justify-center gap-1 rounded-xl border border-white/15 bg-white/[0.04] px-3 py-4 text-center backdrop-blur-sm transition-colors hover:border-reels-cyan/35 hover:bg-white/[0.07] motion-reduce:transition-none ${
                    atEnd ? "reels-trending-more-sparkle" : ""
                  }`}
                  aria-label="인기순위 더 많은 영상 보기 — 전체 랭킹"
                >
                  <span className="text-[12px] font-extrabold leading-tight tracking-tight text-zinc-100 sm:text-[13px]">
                    더보기
                  </span>
                  <span className="text-[10px] font-medium leading-snug text-zinc-500 sm:text-[11px]">
                    전체 랭킹
                  </span>
                </Link>
              </div>
            </div>

          {canLeft ? (
            <button
              type="button"
              className={`${ARROW_BTN} absolute left-0 top-1/2 z-20 -translate-y-1/2`}
              aria-label="이전 인기 영상"
              onClick={() => scrollByDir(-1)}
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={2} aria-hidden />
            </button>
          ) : null}
          <button
            type="button"
            className={`${RIGHT_MINI_ARROW_BTN} absolute right-0 top-1/2 z-20 -translate-y-1/2`}
            aria-label="다음 인기 영상"
            onClick={() => scrollByDir(1)}
            disabled={!canRight}
          >
            <ChevronRight className="h-4 w-4" strokeWidth={2.4} aria-hidden />
          </button>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
