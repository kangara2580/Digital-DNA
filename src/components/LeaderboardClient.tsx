"use client";

import { Crown, Medal, TrendingUp, Trophy } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

type Metric = "sales" | "revenue";
type Period = "today" | "7d" | "30d";

type LeaderboardItem = {
  rank: number;
  videoId: string;
  title: string;
  sellerId: string;
  nickname: string;
  avatarUrl: string | null;
  totalSales: number;
  totalRevenue: number;
};

type LeaderboardResponse = {
  ok: boolean;
  rankings?: LeaderboardItem[];
  period?: Period;
  generatedAt?: string;
  error?: string;
};

const TOP_THEME: Record<
  number,
  { border: string; badge: string; icon: ReactNode; title: string }
> = {
  1: {
    border:
      "border border-amber-500/35 bg-zinc-900/60 [html[data-theme='light']_&]:border-amber-600/30 [html[data-theme='light']_&]:bg-amber-50/80",
    badge:
      "border border-amber-600/30 bg-amber-500/10 text-amber-100 [html[data-theme='light']_&]:border-amber-700/25 [html[data-theme='light']_&]:bg-amber-100/90 [html[data-theme='light']_&]:text-amber-950",
    icon: <Crown className="h-4 w-4" aria-hidden />,
    title: "왕",
  },
  2: {
    border:
      "border border-zinc-400/30 bg-zinc-900/60 [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:bg-zinc-100/90",
    badge:
      "border border-zinc-500/30 bg-zinc-500/10 text-zinc-200 [html[data-theme='light']_&]:border-zinc-400 [html[data-theme='light']_&]:bg-zinc-200/80 [html[data-theme='light']_&]:text-zinc-900",
    icon: <Medal className="h-4 w-4" aria-hidden />,
    title: "2위",
  },
  3: {
    border:
      "border border-orange-700/35 bg-zinc-900/60 [html[data-theme='light']_&]:border-orange-800/28 [html[data-theme='light']_&]:bg-orange-50/70",
    badge:
      "border border-orange-800/30 bg-orange-900/15 text-orange-100/95 [html[data-theme='light']_&]:border-orange-700/30 [html[data-theme='light']_&]:bg-orange-100/90 [html[data-theme='light']_&]:text-orange-950",
    icon: <Trophy className="h-4 w-4" aria-hidden />,
    title: "3위",
  },
};

function formatRevenue(value: number): string {
  return `${Math.max(0, value).toLocaleString("ko-KR")}원`;
}

function formatSales(value: number): string {
  return `${Math.max(0, value).toLocaleString("ko-KR")}개`;
}

function metricValue(item: LeaderboardItem, metric: Metric): string {
  return metric === "revenue" ? formatRevenue(item.totalRevenue) : formatSales(item.totalSales);
}

function metricLabel(metric: Metric): string {
  return metric === "revenue" ? "매출 순위" : "판매 순위";
}

function periodLabel(period: Period): string {
  if (period === "7d") return "7일";
  if (period === "30d") return "한달";
  return "오늘";
}

function metricKoreanLabel(metric: Metric): string {
  return metric === "revenue" ? "수익액" : "판매 수량";
}

function rankEmoji(rank: number): string {
  if (rank === 1) return "👑";
  if (rank === 2) return "🥈";
  return "🥉";
}

function Avatar({ item }: { item: LeaderboardItem }) {
  if (item.avatarUrl) {
    return (
      <img
        src={item.avatarUrl}
        alt={`${item.nickname} 프로필`}
        className="h-12 w-12 rounded-full border border-white/20 object-cover [html[data-theme='light']_&]:border-zinc-200"
      />
    );
  }
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 text-[15px] font-bold text-zinc-100 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
      {item.nickname.slice(0, 1).toUpperCase()}
    </div>
  );
}

export function LeaderboardClient() {
  const [metric, setMetric] = useState<Metric>("sales");
  const [period, setPeriod] = useState<Period>("today");
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<LeaderboardItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const res = await fetch(
          `/api/leaderboard?metric=${encodeURIComponent(metric)}&period=${encodeURIComponent(period)}`,
          {
          cache: "no-store",
          signal: controller.signal,
          },
        );
        const body = (await res.json()) as LeaderboardResponse;
        if (!res.ok || !body.ok) {
          throw new Error(body.error ?? "fetch_failed");
        }
        setItems(Array.isArray(body.rankings) ? body.rankings : []);
      } catch (fetchError) {
        if (controller.signal.aborted) return;
        setItems([]);
        setError(fetchError instanceof Error ? fetchError.message : "unknown_error");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [metric, period]);

  const hasData = items.length > 0;
  const rankedItems: LeaderboardItem[] = hasData
    ? items
    : Array.from({ length: 10 }, (_, idx) => ({
        rank: idx + 1,
        videoId: `empty-${idx + 1}`,
        title: "아직 데이터가 없어요",
        sellerId: `empty-${idx + 1}`,
        nickname: "대기중",
        avatarUrl: null,
        totalSales: 0,
        totalRevenue: 0,
      }));
  const topThree = rankedItems.slice(0, 3);
  const others = rankedItems.slice(3);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <section className="reels-glass-card overflow-hidden rounded-2xl border border-white/[0.1] p-5 !shadow-none sm:p-6 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:shadow-sm">
        <div className="flex flex-wrap items-start gap-3 sm:gap-4">
          <span
            className="mt-1 h-11 w-[3px] shrink-0 rounded-full bg-zinc-500 [html[data-theme='light']_&]:bg-zinc-400 sm:h-[2.875rem]"
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-extrabold tracking-tight text-white [html[data-theme='light']_&]:text-zinc-900 sm:text-2xl">
              명예의 전당
            </h1>
            <p className="mt-2 text-[13px] leading-relaxed text-zinc-400 [html[data-theme='light']_&]:text-zinc-600 sm:text-sm">
              판매량과 매출 기준으로 릴스 Top 10을 실시간으로 확인하세요.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {(["sales", "revenue"] as const).map((tab) => {
            const active = metric === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setMetric(tab)}
                className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-bold transition-[border-color,background-color,color] ${
                  active
                    ? "border-white/25 bg-white/[0.08] text-zinc-50 [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:bg-zinc-200/90 [html[data-theme='light']_&]:text-zinc-900"
                    : "border-white/12 bg-black/15 text-zinc-400 hover:border-white/20 hover:bg-white/[0.05] hover:text-zinc-200 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50 [html[data-theme='light']_&]:text-zinc-600 [html[data-theme='light']_&]:hover:border-zinc-300 [html[data-theme='light']_&]:hover:text-zinc-900"
                }`}
              >
                {tab === "sales" ? <Trophy className="h-4 w-4" aria-hidden /> : <TrendingUp className="h-4 w-4" aria-hidden />}
                {metricLabel(tab)}
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {(["today", "7d", "30d"] as const).map((tab) => {
            const active = period === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setPeriod(tab)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-[border-color,background-color,color] motion-reduce:transition-colors ${
                  active
                    ? "border-white/22 bg-white/[0.06] text-zinc-100 [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:bg-zinc-200/70 [html[data-theme='light']_&]:text-zinc-900"
                    : "border-white/12 bg-black/15 text-zinc-400 hover:border-white/18 hover:text-zinc-200 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50 [html[data-theme='light']_&]:text-zinc-600 [html[data-theme='light']_&]:hover:border-zinc-300 [html[data-theme='light']_&]:hover:text-zinc-900"
                }`}
              >
                {periodLabel(tab)}
              </button>
            );
          })}
        </div>

      </section>

      <section className="mt-5">
        {loading ? (
          <div className="reels-glass-card rounded-2xl border border-white/[0.1] p-6 text-sm text-zinc-400 !shadow-none [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:text-zinc-600 [html[data-theme='light']_&]:shadow-sm">
            데이터를 불러오는 중...
          </div>
        ) : error ? (
          <div className="reels-glass-card rounded-2xl border border-red-500/35 bg-red-500/8 p-6 text-sm text-red-200 [html[data-theme='light']_&]:text-red-700">
            랭킹 데이터를 불러오지 못했어요. 잠시 후 다시 시도해주세요.
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid gap-3 md:grid-cols-3">
              {topThree.map((item) => {
                const theme = TOP_THEME[item.rank] ?? TOP_THEME[3];
                const empty = !hasData;
                const kingWord =
                  item.rank === 1
                    ? metric === "revenue"
                      ? "수익왕"
                      : "판매왕"
                    : theme.title;
                return (
                  <article
                    key={item.videoId}
                    className={`rounded-2xl border p-4 ${theme.border}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${theme.badge}`}>
                        {rankEmoji(item.rank)} {kingWord}
                      </span>
                      <span className="inline-flex items-center gap-1 text-sm font-bold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
                        {theme.icon} #{item.rank}
                      </span>
                    </div>

                    {hasData ? (
                      <Link
                        href={`/seller/${encodeURIComponent(item.sellerId)}`}
                        className="mt-4 flex items-center gap-3 rounded-xl p-1 -m-1 transition-colors hover:bg-white/[0.06] [html[data-theme='light']_&]:hover:bg-zinc-100"
                        aria-label={`${item.nickname} 판매자 피드`}
                      >
                        <Avatar item={item} />
                        <div className="min-w-0">
                          <p className="truncate text-base font-extrabold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
                            {item.nickname}
                          </p>
                          <p className="truncate text-xs text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
                            릴스: {item.title}
                          </p>
                        </div>
                      </Link>
                    ) : (
                      <div className="mt-4 flex items-center gap-3 rounded-xl p-1 -m-1">
                        <Avatar item={item} />
                        <div className="min-w-0">
                          <p className="truncate text-base font-extrabold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
                            {item.nickname}
                          </p>
                          <p className="truncate text-xs text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
                            아직 순위 데이터 없음
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="mt-4 rounded-xl border border-white/[0.12] bg-black/30 px-3 py-2 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50">
                      <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
                        {metricKoreanLabel(metric)}
                      </p>
                      <p className="mt-1 text-lg font-extrabold tabular-nums text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
                        {empty ? "-" : metricValue(item, metric)}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>

            {others.length > 0 ? (
              <div className="reels-glass-card overflow-hidden rounded-2xl border border-white/[0.1] !shadow-none [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:shadow-sm">
                <ul>
                  {others.map((item) => (
                    <li
                      key={item.videoId}
                      className="flex items-center justify-between gap-3 border-t border-white/10 px-4 py-3 first:border-t-0 [html[data-theme='light']_&]:border-zinc-200"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="w-8 text-center text-base font-extrabold text-zinc-200 [html[data-theme='light']_&]:text-zinc-800">
                          {item.rank}
                        </span>
                        {hasData ? (
                          <Link
                            href={`/seller/${encodeURIComponent(item.sellerId)}`}
                            className="flex min-w-0 items-center gap-3 rounded-xl p-1 -m-1 transition-colors hover:bg-white/[0.06] [html[data-theme='light']_&]:hover:bg-zinc-100"
                            aria-label={`${item.nickname} 판매자 피드`}
                          >
                            <Avatar item={item} />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
                                {item.nickname}
                              </p>
                              <p className="truncate text-xs text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
                                {item.title}
                              </p>
                            </div>
                          </Link>
                        ) : (
                          <div className="flex min-w-0 items-center gap-3 rounded-xl p-1 -m-1">
                            <Avatar item={item} />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
                                {item.nickname}
                              </p>
                              <p className="truncate text-xs text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
                                아직 순위 데이터 없음
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                      <span className="shrink-0 text-sm font-extrabold tabular-nums text-zinc-200 [html[data-theme='light']_&]:text-zinc-800">
                        {hasData ? metricValue(item, metric) : "-"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}
