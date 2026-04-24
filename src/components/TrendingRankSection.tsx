"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getTikTokManualRanking,
  manualTikTokRankingToFeedVideos,
} from "@/data/tiktokData";
import { getMetricsForVideoDetail } from "@/data/trendingStats";
import { type FeedVideo } from "@/data/videos";
import { liveStatsKeyFromFeedVideo } from "@/lib/externalEmbed/parseUrl";
import { SectionMoreLink } from "./SectionMoreLink";
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
  const [trendingClips, setTrendingClips] = useState<FeedVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previousRanksByVideoId, setPreviousRanksByVideoId] = useState<Record<string, number>>({});
  const [liveStatsByKey, setLiveStatsByKey] = useState<
    Record<string, { playCount: number; diggCount: number }>
  >({});

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
    try {
      const ranking = getTikTokManualRanking();
      const next = manualTikTokRankingToFeedVideos(ranking).map((v) => ({ ...v }));
      setTrendingClips(next);
      if (!next.length) {
        setErrorMessage(
          "표시할 영상이 없습니다. TikTok·YouTube·Instagram 공유 URL을 src/data/tiktokData.ts 의 FILE_RAW_MANUAL_TIKTOK_URLS 또는 Vercel NEXT_PUBLIC_TRENDING_TIKTOK_URLS 에 넣어 주세요.",
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
  }, []);

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
    void refreshLiveStats();
    const t = window.setInterval(() => {
      void refreshLiveStats();
    }, 45_000);
    return () => window.clearInterval(t);
  }, [refreshLiveStats]);

  return (
    <section
      className="border-t border-white/10 bg-transparent"
      aria-labelledby="trending-rank-heading"
    >
      <div className="mx-auto max-w-[1800px] px-4 pb-16 pt-6 sm:px-6 sm:pb-20 sm:pt-7 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className="min-w-0 text-left">
            <h2
              id="trending-rank-heading"
              className="flex flex-wrap items-center gap-2.5 text-[22px] font-extrabold leading-snug tracking-tight text-zinc-100 sm:gap-3 sm:text-[26px] md:text-[28px]"
            >
              인기순위 TOP 30
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

        <div className="relative mt-5 sm:mt-6">
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

          {!loading && rankedRows.length > 0 ? (
            <div
              className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5"
              role="list"
              aria-label="인기순위 영상 목록"
            >
              {rankedRows.map((entry, rankIndex) => (
                <div
                  key={entry.key}
                  className="relative"
                  role="listitem"
                >
                  <div className="pointer-events-none absolute left-2 top-2 z-[25] inline-flex items-center gap-1 rounded-full border border-[#00F2EA]/35 bg-black/65 px-2 py-1 text-[11px] font-extrabold tabular-nums text-white shadow-[0_10px_25px_-14px_rgba(0,242,234,0.9)]">
                    {rankIndex + 1}
                    {entry.trendDir === "up" ? (
                      <span className="text-[13px] leading-none text-[#2CFFC8] [text-shadow:0_0_10px_rgba(44,255,200,0.55)]">
                        ▲
                      </span>
                    ) : entry.trendDir === "down" ? (
                      <span className="text-[13px] leading-none text-[#FF5EAD] [text-shadow:0_0_10px_rgba(255,94,173,0.55)]">
                        ▼
                      </span>
                    ) : null}
                  </div>
                  <VideoCard
                    video={entry.video}
                    reelLayout
                    reelStrip
                    disableHoverScale
                    preloadMode="none"
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
          <div className="mt-6 flex justify-center">
            <Link
              href="/category/best"
              className="inline-flex items-center rounded-full border border-white/20 bg-white/[0.04] px-5 py-2 text-sm font-bold text-zinc-100 transition hover:border-[#00F2EA]/40 hover:bg-white/[0.08]"
            >
              전체 랭킹 더보기
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}
