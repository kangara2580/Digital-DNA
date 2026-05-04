"use client";

import { Sparkles, TrendingUp, Trophy } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

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

/** 상위 카드: 1위만 브랜드 핑크 포인트, 나머지는 중립 톤 */
const topCardShell = (rank: number) =>
  rank === 1
    ? "border border-[color:rgba(255,45,141,0.4)] bg-[color:rgba(255,45,141,0.07)] [html[data-theme='light']_&]:border-[color:rgba(255,45,141,0.35)] [html[data-theme='light']_&]:bg-[color:rgba(255,45,141,0.06)]"
    : "border border-white/[0.08] bg-white/[0.03] [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white";

const rankChipClass = (rank: number) =>
  rank === 1
    ? "bg-[color:var(--reels-point)] text-white shadow-sm"
    : "bg-white/[0.1] text-zinc-100 [html[data-theme='light']_&]:bg-zinc-200 [html[data-theme='light']_&]:text-zinc-900";

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
  return metric === "revenue" ? "매출" : "판매";
}

function periodLabel(period: Period): string {
  if (period === "7d") return "7일";
  if (period === "30d") return "한 달";
  return "오늘";
}

function metricKoreanLabel(metric: Metric): string {
  return metric === "revenue" ? "수익" : "판매 수";
}

function rankLabel(rank: number): string {
  return `${rank}위`;
}

function Avatar({ item }: { item: LeaderboardItem }) {
  if (item.avatarUrl) {
    return (
      <img
        src={item.avatarUrl}
        alt={`${item.nickname} 프로필`}
        className="h-12 w-12 rounded-2xl object-cover ring-2 ring-white/15 [html[data-theme='light']_&]:ring-zinc-200"
      />
    );
  }
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-[15px] font-bold text-zinc-100 ring-2 ring-white/10 [html[data-theme='light']_&]:bg-zinc-100 [html[data-theme='light']_&]:text-zinc-700 [html[data-theme='light']_&]:ring-zinc-200">
      {item.nickname.slice(0, 1).toUpperCase()}
    </div>
  );
}

function ListAvatar({ item }: { item: LeaderboardItem }) {
  if (item.avatarUrl) {
    return (
      <img
        src={item.avatarUrl}
        alt=""
        className="h-10 w-10 rounded-xl object-cover ring-1 ring-white/15 [html[data-theme='light']_&]:ring-zinc-200"
      />
    );
  }
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-[13px] font-bold text-zinc-200 [html[data-theme='light']_&]:bg-zinc-100 [html[data-theme='light']_&]:text-zinc-700">
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
    <div className="mx-auto w-full max-w-lg px-4 pb-24 pt-8 sm:max-w-xl sm:px-5 md:max-w-2xl md:pt-10">
      {/* 소프트 상단 그라데이션만 살짝 */}
      <div
        className="pointer-events-none fixed inset-x-0 top-[var(--header-height,4.5rem)] z-0 h-44 max-h-[38vh] bg-[radial-gradient(ellipse_90%_85%_at_50%_-5%,rgba(255,45,141,0.11),transparent_62%)] [html[data-theme='light']_&]:bg-[radial-gradient(ellipse_90%_85%_at_50%_-5%,rgba(255,45,141,0.14),transparent_62%)]"
        aria-hidden
      />

      <div className="relative z-10 space-y-8">
        <header className="text-center">
          <p className="mb-3 inline-flex items-center justify-center gap-1.5 rounded-full border border-[color:rgba(255,45,141,0.28)] bg-[color:rgba(255,45,141,0.08)] px-3 py-1 text-[11px] font-semibold text-[color:var(--reels-point)] [html[data-theme='light']_&]:border-[color:rgba(255,45,141,0.35)] [html[data-theme='light']_&]:bg-[color:rgba(255,45,141,0.08)]">
            <Sparkles className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
            실시간 집계
          </p>
          <h1 className="text-[1.6rem] font-extrabold tracking-tight text-zinc-50 [html[data-theme='light']_&]:text-zinc-900 sm:text-[1.85rem]">
            명예의 전당
          </h1>
          <p className="mx-auto mt-2.5 max-w-md text-[13px] leading-relaxed text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
            기간을 고르고 <span className="font-semibold text-zinc-200 [html[data-theme='light']_&]:text-zinc-800">판매 수</span> 또는{" "}
            <span className="font-semibold text-zinc-200 [html[data-theme='light']_&]:text-zinc-800">매출</span> 기준으로
            크리에이터 순위를 확인해 보세요.
          </p>
        </header>

        {/* 무엇을 볼지 */}
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-1 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-100/70">
          <div className="grid grid-cols-2 gap-1">
            {(["sales", "revenue"] as const).map((tab) => {
              const active = metric === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setMetric(tab)}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl py-3 text-[13px] font-semibold transition-all ${
                    active
                      ? "bg-[color:var(--reels-point)] text-white shadow-[0_4px_20px_-8px_rgba(255,45,141,0.55)]"
                      : "text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-200 [html[data-theme='light']_&]:text-zinc-600 [html[data-theme='light']_&]:hover:bg-white [html[data-theme='light']_&]:hover:text-zinc-900"
                  }`}
                >
                  {tab === "sales" ? (
                    <Trophy className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                  ) : (
                    <TrendingUp className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                  )}
                  {metricLabel(tab)}
                </button>
              );
            })}
          </div>
        </div>

        {/* 기간 */}
        <div>
          <p className="mb-2 px-0.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-500 [html[data-theme='light']_&]:text-zinc-500">
            기간
          </p>
          <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
            {(["today", "7d", "30d"] as const).map((tab) => {
              const active = period === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setPeriod(tab)}
                  className={`rounded-full px-4 py-2 text-[12px] font-semibold transition-all ${
                    active
                      ? "border border-[color:rgba(255,45,141,0.45)] bg-[color:rgba(255,45,141,0.12)] text-[color:var(--reels-point)] [html[data-theme='light']_&]:border-[color:rgba(255,45,141,0.4)] [html[data-theme='light']_&]:bg-[color:rgba(255,45,141,0.1)] [html[data-theme='light']_&]:text-[color:var(--reels-point)]"
                      : "border border-transparent bg-white/[0.05] text-zinc-400 hover:bg-white/[0.08] hover:text-zinc-200 [html[data-theme='light']_&]:bg-zinc-100 [html[data-theme='light']_&]:text-zinc-600 [html[data-theme='light']_&]:hover:bg-zinc-200/80 [html[data-theme='light']_&]:hover:text-zinc-900"
                  }`}
                >
                  {periodLabel(tab)}
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] px-6 py-14 text-center text-sm text-zinc-500 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-600">
            <span className="inline-block animate-pulse">잠깐만요… 불러오는 중</span>
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-reels-crimson/25 bg-reels-crimson/[0.08] px-5 py-6 text-center text-[13px] font-medium text-[#F9ECF3] [html[data-theme='light']_&]:border-[#F9C6D4] [html[data-theme='light']_&]:bg-[#FCEEF6] [html[data-theme='light']_&]:text-reels-crimson">
            랭킹을 못 불러왔어요. 조금 뒤에 다시 눌러 주세요.
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3 sm:gap-3">
              {topThree.map((item) => {
                const empty = !hasData;
                const shell = topCardShell(item.rank);
                const chip = rankChipClass(item.rank);
                const badge = rankLabel(item.rank);
                return (
                  <article
                    key={item.videoId}
                    className={`flex flex-col rounded-2xl p-4 sm:min-h-[272px] ${shell}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${chip}`}
                      >
                        {badge}
                      </span>
                    </div>

                    {hasData ? (
                      <Link
                        href={`/seller/${encodeURIComponent(item.sellerId)}`}
                        className="mt-4 flex flex-1 flex-col gap-3 rounded-xl transition-opacity hover:opacity-90"
                        aria-label={`${item.nickname} 판매자 피드`}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar item={item} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[15px] font-bold text-zinc-50 [html[data-theme='light']_&]:text-zinc-900">
                              {item.nickname}
                            </p>
                            <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
                              {item.title}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ) : (
                      <div className="mt-4 flex flex-1 flex-col gap-3">
                        <div className="flex items-center gap-3">
                          <Avatar item={item} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[15px] font-bold text-zinc-50 [html[data-theme='light']_&]:text-zinc-900">
                              {item.nickname}
                            </p>
                            <p className="mt-0.5 text-[12px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-500">
                              집계 데이터를 불러오는 중이에요
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="mt-auto rounded-xl border border-white/[0.06] bg-black/15 px-3.5 py-3 [html[data-theme='light']_&]:border-zinc-200/90 [html[data-theme='light']_&]:bg-zinc-50/90">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500 [html[data-theme='light']_&]:text-zinc-500">
                        {metricKoreanLabel(metric)}
                      </p>
                      <p className="mt-1 text-lg font-extrabold tabular-nums tracking-tight text-zinc-50 [html[data-theme='light']_&]:text-zinc-900">
                        {empty ? "—" : metricValue(item, metric)}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>

            {others.length > 0 ? (
              <div>
                <p className="mb-3 px-0.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-500 [html[data-theme='light']_&]:text-zinc-500">
                  4위부터
                </p>
                <ul className="space-y-2">
                  {others.map((item) => (
                    <li
                      key={item.videoId}
                      className="rounded-2xl border border-white/[0.07] bg-white/[0.03] px-3 py-3 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.08] text-[13px] font-extrabold tabular-nums text-zinc-300 [html[data-theme='light']_&]:bg-zinc-100 [html[data-theme='light']_&]:text-zinc-700"
                          aria-label={`${item.rank}위`}
                        >
                          {item.rank}
                        </span>
                        <div className="min-w-0 flex-1">
                          {hasData ? (
                            <Link
                              href={`/seller/${encodeURIComponent(item.sellerId)}`}
                              className="flex min-w-0 items-center gap-3 rounded-xl py-0.5 transition-opacity hover:opacity-90"
                              aria-label={`${item.nickname} 판매자 피드`}
                            >
                              <ListAvatar item={item} />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-[13px] font-bold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
                                  {item.nickname}
                                </p>
                                <p className="truncate text-[11px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-500">
                                  {item.title}
                                </p>
                              </div>
                            </Link>
                          ) : (
                            <div className="flex min-w-0 items-center gap-3">
                              <ListAvatar item={item} />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-[13px] font-bold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
                                  {item.nickname}
                                </p>
                                <p className="truncate text-[11px] text-zinc-500">기다리는 중…</p>
                              </div>
                            </div>
                          )}
                        </div>
                        <span className="shrink-0 rounded-lg border border-[color:rgba(255,45,141,0.2)] bg-[color:rgba(255,45,141,0.06)] px-2.5 py-1.5 text-right text-[12px] font-extrabold tabular-nums text-[color:var(--reels-point)] [html[data-theme='light']_&]:border-[color:rgba(255,45,141,0.25)] [html[data-theme='light']_&]:bg-[color:rgba(255,45,141,0.08)]">
                          {hasData ? metricValue(item, metric) : "—"}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
