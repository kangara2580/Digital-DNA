"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getTikTokManualRanking,
  manualTikTokRankingToFeedVideos,
} from "@/data/tiktokData";
import { getMetricsForVideoDetail } from "@/data/trendingStats";
import { type FeedVideo } from "@/data/videos";
import { liveStatsKeyFromFeedVideo } from "@/lib/externalEmbed/parseUrl";
import { TrendingVideoStatsFooter } from "./TrendingVideoStatsFooter";
import { VideoCard } from "./VideoCard";

const TRENDING_RANK_SNAPSHOT_KEY = "ara-trending-rank-snapshot-v1";

function SkeletonGrid() {
  return (
    <div
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
      role="status"
      aria-live="polite"
      aria-label="인기순위 영상 불러오는 중"
    >
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={`skeleton-${i}`} className="relative">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
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
  const router = useRouter();
  const sectionRef = useRef<HTMLElement | null>(null);
  const gridAnchorRef = useRef<HTMLDivElement | null>(null);
  const [trendingClips, setTrendingClips] = useState<FeedVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previousRanksByVideoId, setPreviousRanksByVideoId] = useState<Record<string, number>>({});
  const [liveStatsByKey, setLiveStatsByKey] = useState<
    Record<string, { playCount: number; diggCount: number }>
  >({});
  const [visibleRows, setVisibleRows] = useState(1);
  const [pendingCollapseScroll, setPendingCollapseScroll] = useState(false);

  const ITEMS_PER_ROW = 5;
  const MAX_ROWS_BEFORE_NAVIGATE = 5;

  // 순위는 로딩 시(또는 새로고침 시) 수익 기준으로 확정하고, 렌더 중 재정렬하지 않습니다.
  const rankedRows = useMemo(
    () => {
      const rows = trendingClips.map((video) => {
        const base = getMetricsForVideoDetail(video.id);
        const liveKey = liveStatsKeyFromFeedVideo(video);
        const live = liveKey ? liveStatsByKey[liveKey] : undefined;
        const metrics = live
          ? {
              ...base,
              totalViews: live.playCount,
              totalLikes: live.diggCount,
            }
          : base;
        return { video, metrics };
      });

      rows.sort((a, b) => b.metrics.cumulativeRevenueWon - a.metrics.cumulativeRevenueWon);

      return rows.slice(0, 30).map((row, rankIndex) => {
        const previousRank = previousRanksByVideoId[row.video.id];
        const trendDir =
          previousRank == null
            ? "same"
            : previousRank > rankIndex + 1
              ? "up"
              : previousRank < rankIndex + 1
                ? "down"
                : "same";
        return {
          key: `fixed-${rankIndex}-${row.video.id}`,
          video: row.video,
          metrics: row.metrics,
          trendDir,
        };
      });
    },
    [trendingClips, liveStatsByKey, previousRanksByVideoId],
  );

  const loadTrending = useCallback(() => {
    setLoading(true);
    setErrorMessage(null);
    void (async () => {
      try {
        const response = await fetch("/api/trending/rank?limit=30", {
          cache: "no-store",
        });
        const payload = (await response.json()) as {
          ok?: boolean;
          items?: FeedVideo[];
        };
        if (
          response.ok &&
          payload.ok === true &&
          Array.isArray(payload.items) &&
          payload.items.length > 0
        ) {
          setTrendingClips(payload.items.map((video) => ({ ...video })));
          return;
        }
        throw new Error("invalid_payload");
      } catch {
        const ranking = getTikTokManualRanking();
        const fallback = manualTikTokRankingToFeedVideos(ranking).map((video) => ({
          ...video,
        }));
        setTrendingClips(fallback);
        if (!fallback.length) {
          setErrorMessage(
            "표시할 영상이 없습니다. TikTok·YouTube·Instagram 공유 URL을 src/data/tiktokData.ts 의 FILE_RAW_MANUAL_TIKTOK_URLS 또는 Vercel NEXT_PUBLIC_TRENDING_TIKTOK_URLS 에 넣어 주세요.",
          );
        } else {
          setErrorMessage("실시간 랭킹 연결에 실패해 샘플 랭킹을 표시합니다.");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const refreshLiveStats = useCallback(async () => {
    const externalRows = trendingClips
      .map((video) => {
        if (!video.sourcePageUrl) return null;
        return {
          id: video.id,
          url: video.sourcePageUrl,
        };
      })
      .filter((row): row is { id: string; url: string } => Boolean(row));
    if (!externalRows.length) return;

    const settled = await Promise.allSettled(
      externalRows.map(async (row) => {
        const res = await fetch(
          `/api/embed/live-stats?url=${encodeURIComponent(row.url)}`,
          { cache: "no-store" },
        );
        if (!res.ok) return null;
        const j = (await res.json()) as {
          provider?: string;
          canonicalKey?: string;
          videoId?: string;
          playCount?: number;
          diggCount?: number;
        };
        const key = j.canonicalKey ?? j.videoId;
        const provider = j.provider;
        if (
          !provider ||
          !key ||
          typeof j.playCount !== "number" ||
          typeof j.diggCount !== "number"
        ) {
          return null;
        }
        return {
          mapKey: `${provider}:${key}`,
          playCount: j.playCount,
          diggCount: j.diggCount,
        };
      }),
    );

    const next: Record<string, { playCount: number; diggCount: number }> = {};
    for (const row of settled) {
      if (row.status !== "fulfilled" || !row.value) continue;
      next[row.value.mapKey] = {
        playCount: row.value.playCount,
        diggCount: row.value.diggCount,
      };
    }
    if (Object.keys(next).length) setLiveStatsByKey(next);
  }, [trendingClips]);

  useEffect(() => {
    void loadTrending();
  }, [loadTrending]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(TRENDING_RANK_SNAPSHOT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, number>;
      if (!parsed || typeof parsed !== "object") return;
      setPreviousRanksByVideoId(parsed);
    } catch {
      /* noop */
    }
  }, []);

  useEffect(() => {
    if (!rankedRows.length) return;
    const snapshot: Record<string, number> = {};
    rankedRows.forEach((entry, i) => {
      snapshot[entry.video.id] = i + 1;
    });
    try {
      window.localStorage.setItem(TRENDING_RANK_SNAPSHOT_KEY, JSON.stringify(snapshot));
    } catch {
      /* noop */
    }
  }, [rankedRows]);

  useEffect(() => {
    setVisibleRows(1);
  }, [rankedRows.length]);

  useEffect(() => {
    void refreshLiveStats();
    const t = window.setInterval(() => {
      void refreshLiveStats();
    }, 45_000);
    return () => window.clearInterval(t);
  }, [refreshLiveStats]);

  const maxRowsByData = Math.ceil(rankedRows.length / ITEMS_PER_ROW);
  const maxVisibleRows = Math.min(MAX_ROWS_BEFORE_NAVIGATE, maxRowsByData);

  const visibleCount = Math.min(
    rankedRows.length,
    visibleRows * ITEMS_PER_ROW,
    MAX_ROWS_BEFORE_NAVIGATE * ITEMS_PER_ROW,
  );
  const visibleRowsData = rankedRows.slice(0, visibleCount);
  const onExpandAllRows = useCallback(() => {
    setVisibleRows(Math.max(1, maxVisibleRows));
  }, [maxVisibleRows]);
  const onCollapseToFirstRow = useCallback(() => {
    setPendingCollapseScroll(true);
    setVisibleRows(1);
  }, []);

  useEffect(() => {
    if (!pendingCollapseScroll || visibleRows !== 1) return;
    const raf = window.requestAnimationFrame(() => {
      const anchor = gridAnchorRef.current ?? sectionRef.current;
      if (!anchor) {
        setPendingCollapseScroll(false);
        return;
      }
      const anchorTop = anchor.getBoundingClientRect().top + window.scrollY;
      // 한 줄 카드가 뷰포트 중간쯤에 오도록 여유를 둡니다.
      const targetTop = Math.max(0, anchorTop - window.innerHeight * 0.24);
      window.scrollTo({ top: targetTop, behavior: "smooth" });
      setPendingCollapseScroll(false);
    });
    return () => window.cancelAnimationFrame(raf);
  }, [pendingCollapseScroll, visibleRows]);

  const revealStartIndex = visibleRows > 1 ? ITEMS_PER_ROW : Number.POSITIVE_INFINITY;
  const canExpand = visibleRows < maxVisibleRows;
  const canCollapse = visibleRows > 1;
  const showCollapse = canCollapse;

  return (
    <section
      id="trending-rank"
      ref={sectionRef}
      className="trending-rank-ocean-bg border-t border-white/10"
      aria-labelledby="trending-rank-heading"
    >
      <div className="mx-auto max-w-[1800px] px-4 pb-16 pt-20 sm:px-6 sm:pb-20 sm:pt-24 lg:px-8">
        <div className="flex flex-col items-center gap-3 py-9 sm:py-10">
          <div className="min-w-0 text-center">
            <h2
              id="trending-rank-heading"
              className="flex flex-wrap items-center justify-center gap-2.5 text-[26px] font-extrabold leading-snug tracking-tight text-zinc-100 sm:gap-3 sm:text-[30px] md:text-[32px]"
            >
              인기순위 TOP 30
            </h2>
            <p className="mt-2 text-center text-[16px] font-medium leading-relaxed tracking-[0.01em] text-white/78">
              전 세계 크리에이터들이 가장 많이 선택한 인기 영상
            </p>
            {errorMessage ? (
              <p className="mt-1.5 text-[12px] font-medium text-rose-300 [html[data-theme='light']_&]:text-rose-600">
                {errorMessage}
              </p>
            ) : null}
          </div>
        </div>

        <div ref={gridAnchorRef} className="relative mt-0">
          {loading ? <SkeletonGrid /> : null}

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

          {!loading && visibleRowsData.length > 0 ? (
            <div
              className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5"
              role="list"
              aria-label="인기순위 영상 목록"
            >
              {visibleRowsData.map((entry, rankIndex) => (
                <div
                  key={entry.key}
                  className={`relative ${
                    visibleRows > 1 && rankIndex >= revealStartIndex ? "trending-rank-reveal-up" : ""
                  }`}
                  role="listitem"
                >
                  <div className="pointer-events-none absolute left-2 top-2 z-[25] inline-flex items-center gap-1 rounded-full border border-[#00F2EA]/35 bg-black/65 px-2 py-1 text-[11px] font-extrabold tabular-nums text-white shadow-[0_10px_25px_-14px_rgba(0,242,234,0.9)]">
                    {rankIndex + 1}
                    {entry.trendDir === "up" ? (
                      <span className="text-[13px] leading-none text-[#FF3B57] [text-shadow:0_0_10px_rgba(255,59,87,0.55)]">
                        ▲
                      </span>
                    ) : entry.trendDir === "down" ? (
                      <span className="text-[13px] leading-none text-[#2FA2FF] [text-shadow:0_0_10px_rgba(47,162,255,0.55)]">
                        ▼
                      </span>
                    ) : null}
                  </div>
                  <VideoCard
                    video={{
                      ...entry.video,
                      title: `${rankIndex + 1}위`,
                    }}
                    reelLayout
                    reelStrip
                    disableHoverScale
                    hideCreatorMeta
                    preloadMode="metadata"
                    detailHref={
                      entry.video.tiktokEmbedId
                        ? `/video/tiktok-${entry.video.tiktokEmbedId}`
                        : entry.video.youtubeVideoId
                          ? `/video/youtube-${entry.video.youtubeVideoId}`
                          : entry.video.instagramShortcode
                            ? `/video/instagram-${entry.video.instagramShortcode}`
                            : `/video/${entry.video.id}`
                    }
                    className="h-full min-w-0"
                    footerExtension={
                      <TrendingVideoStatsFooter
                        metrics={entry.metrics}
                      />
                    }
                  />
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {!loading && rankedRows.length > 0 ? (
          <div className="mt-6 flex flex-col items-center justify-center gap-6 sm:mt-8">
            <button
              type="button"
              onClick={showCollapse ? onCollapseToFirstRow : onExpandAllRows}
              disabled={showCollapse ? !canCollapse : !canExpand}
              className="group inline-flex h-12 min-w-[280px] items-center justify-center bg-transparent px-0 text-white transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-40 sm:h-14 sm:min-w-[360px]"
              aria-label={showCollapse ? "인기순위 접기" : "인기순위 펼치기"}
              title={showCollapse ? "위로 접기" : "아래로 펼치기"}
            >
              <svg viewBox="0 0 220 48" fill="none" className="h-7 w-[190px] sm:h-8 sm:w-[220px]" aria-hidden>
                {showCollapse ? (
                  <path
                    d="M10 34L110 10L210 34"
                    stroke="currentColor"
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ) : (
                  <path
                    d="M10 14L110 38L210 14"
                    stroke="currentColor"
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
              </svg>
            </button>
            {showCollapse ? (
              <Link
                href="/category/best"
                className="inline-flex min-w-[140px] items-center justify-center rounded-full border border-white/30 bg-white/[0.05] px-7 py-3 text-[16px] font-semibold text-zinc-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_8px_22px_-14px_rgba(0,0,0,0.6)] backdrop-blur-md transition hover:border-white/50 hover:bg-white/[0.1]"
              >
                더보기
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
