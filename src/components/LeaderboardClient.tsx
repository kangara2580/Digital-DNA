"use client";

import { TrendingUp, Trophy } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ProfileColorAvatar } from "@/components/ProfileColorAvatar";
import { profileColorFromSeed } from "@/lib/profileColorSpectrum";
import { useTranslation } from "@/hooks/useTranslation";
import { getExploreFormatters } from "@/lib/exploreLocaleFormat";
import { GemAmount } from "@/components/PaymentDiamondIcon";
import { formatGemsCompact } from "@/lib/gemDisplay";
import { revenueAmountClass } from "@/lib/revenueDisplayTokens";

type Metric = "sales" | "revenue";
type Period = "today" | "7d" | "30d";

type LeaderboardItem = {
  rank: number;
  videoId: string;
  title: string;
  sellerId: string;
  nickname: string;
  avatarColor: string;
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

/** 표시용: 레거시/폴백 문자열의 「판매자 」 접두 제거 */
function stripLeaderboardSellerLabel(name: string): string {
  const s = name.trim();
  if (s.startsWith("판매자 ")) return s.slice(4).trim();
  const stripped = s.replace(/^판매자\s*/u, "").trim();
  return stripped || s;
}

/** 상위 카드: 1위는 테두리·배경만 살짝 강조(색상 포인트 없음) */
const topCardShell = (rank: number) =>
  rank === 1
    ? "border border-white/20 bg-white/[0.06] shadow-[0_0_0_1px_rgba(255,255,255,0.04)] [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:bg-zinc-100 [html[data-theme='light']_&]:shadow-none"
    : "border border-white/[0.08] bg-white/[0.03] [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white";

const rankChipClass = (rank: number) =>
  rank === 1
    ? "bg-zinc-200 text-zinc-950 shadow-sm [html[data-theme='light']_&]:bg-zinc-800 [html[data-theme='light']_&]:text-zinc-50"
    : "bg-white/[0.1] text-zinc-100 [html[data-theme='light']_&]:bg-zinc-200 [html[data-theme='light']_&]:text-zinc-900";

function Avatar({ item, profileAlt }: { item: LeaderboardItem; profileAlt: string }) {
  const handle = stripLeaderboardSellerLabel(item.nickname);
  const letter = (handle.slice(0, 1) || "?").toUpperCase();
  const hex = item.avatarColor || profileColorFromSeed(item.sellerId);

  return (
    <ProfileColorAvatar
      hex={hex}
      initial={letter}
      label={profileAlt}
      sizeClass="h-12 w-12"
      className="rounded-2xl ring-2 ring-white/15 [html[data-theme='light']_&]:ring-zinc-200"
    />
  );
}

function ListAvatar({ item }: { item: LeaderboardItem }) {
  const handle = stripLeaderboardSellerLabel(item.nickname);
  const letter = (handle.slice(0, 1) || "?").toUpperCase();
  const hex = item.avatarColor || profileColorFromSeed(item.sellerId);

  return (
    <ProfileColorAvatar
      hex={hex}
      initial={letter}
      sizeClass="h-10 w-10"
      className="rounded-xl ring-1 ring-white/15 [html[data-theme='light']_&]:ring-zinc-200"
    />
  );
}

/** 데이터 없음·슬롯 패딩용 행 — `videoId`가 `empty-`로 시작하면 실제 랭킹이 아님 */
function isLeaderboardPlaceholderRow(item: LeaderboardItem): boolean {
  return item.videoId.startsWith("empty-");
}

export function LeaderboardClient() {
  const { t, locale } = useTranslation();
  const fmt = useMemo(() => getExploreFormatters(locale), [locale]);

  const formatRevenueValue = (value: number) =>
    formatGemsCompact(locale, value);

  const formatSalesValue = (value: number) =>
    t("leaderboard.salesCount", {
      n: Math.max(0, value).toLocaleString(fmt.numberLocale),
    });

  const renderMetricValue = (item: LeaderboardItem, m: Metric, rowFilled: boolean) => {
    if (!rowFilled) return "—";
    if (m === "revenue") {
      return (
        <GemAmount
          value={formatRevenueValue(item.totalRevenue)}
          iconClassName="h-4 w-4 shrink-0 text-[color:var(--reels-point)]"
        />
      );
    }
    return formatSalesValue(item.totalSales);
  };

  const [metric, setMetric] = useState<Metric>("revenue");
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
  const rankedItems: LeaderboardItem[] = useMemo(
    () =>
      items.slice(0, 10).map((row, idx) => ({
        ...row,
        rank: idx + 1,
      })),
    [items],
  );

  const topThree = rankedItems.slice(0, 3);
  const others = rankedItems.slice(3);

  return (
    <div className="mx-auto w-full max-w-lg px-4 pb-24 pt-[var(--mobile-top-float-pad)] sm:max-w-xl sm:px-5 md:max-w-2xl md:pt-10">
      <div
        className="pointer-events-none fixed inset-x-0 top-[var(--header-height,4.5rem)] z-0 h-44 max-h-[38vh] bg-[radial-gradient(ellipse_90%_85%_at_50%_-5%,rgba(255,255,255,0.06),transparent_62%)] [html[data-theme='light']_&]:bg-[radial-gradient(ellipse_90%_85%_at_50%_-5%,rgba(24,24,27,0.08),transparent_62%)]"
        aria-hidden
      />

      <div className="relative z-10 space-y-8">
        <header className="text-center">
          <h1 className="text-[1.6rem] font-extrabold tracking-tight text-zinc-50 [html[data-theme='light']_&]:text-zinc-900 sm:text-[1.85rem]">
            {t("leaderboard.title")}
          </h1>
        </header>

        <div className="rounded-2xl border border-white/12 bg-white/[0.03] p-1 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-100/80">
          <div className="grid grid-cols-2 gap-1">
            {(["revenue", "sales"] as const).map((tab) => {
              const active = metric === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setMetric(tab)}
                  className={`inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl px-3 py-3 text-[15px] font-semibold transition-colors ${
                    active
                      ? "leaderboard-metric-tab--active bg-white/15 text-white shadow-[0_6px_22px_-10px_rgba(0,0,0,0.45)] ring-1 ring-white/20 [html[data-theme='light']_&]:bg-zinc-900 [html[data-theme='light']_&]:shadow-[0_6px_22px_-10px_rgba(0,0,0,0.12)] [html[data-theme='light']_&]:ring-zinc-700"
                      : "text-zinc-500 hover:bg-white/[0.08] hover:text-zinc-200 [html[data-theme='light']_&]:text-zinc-600 [html[data-theme='light']_&]:hover:bg-white [html[data-theme='light']_&]:hover:text-zinc-900"
                  }`}
                >
                  {tab === "sales" ? (
                    <Trophy
                      className={`h-[18px] w-[18px] shrink-0 ${active ? "text-[color:var(--reels-point)]" : "text-zinc-400 [html[data-theme='light']_&]:text-zinc-500"}`}
                      strokeWidth={2}
                      aria-hidden
                    />
                  ) : (
                    <TrendingUp
                      className={`h-[18px] w-[18px] shrink-0 ${active ? "text-[color:var(--reels-point)]" : "text-zinc-400 [html[data-theme='light']_&]:text-zinc-500"}`}
                      strokeWidth={2}
                      aria-hidden
                    />
                  )}
                  {t(`leaderboard.tab.${tab}`)}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-2 px-0.5 text-[13px] font-semibold uppercase tracking-[0.12em] text-zinc-500 [html[data-theme='light']_&]:text-zinc-500">
            {t("leaderboard.period.section")}
          </p>
          <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
            {(["today", "7d", "30d"] as const).map((tab) => {
              const active = period === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setPeriod(tab)}
                  className={`rounded-full px-4 py-2 text-[14px] font-semibold transition-all ${
                    active
                      ? "border border-white/25 bg-white/10 text-zinc-50 [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:bg-zinc-200/90 [html[data-theme='light']_&]:text-zinc-900"
                      : "border border-transparent bg-white/[0.05] text-zinc-400 hover:bg-white/[0.1] hover:text-zinc-200 [html[data-theme='light']_&]:bg-zinc-100 [html[data-theme='light']_&]:text-zinc-600 [html[data-theme='light']_&]:hover:bg-zinc-200/80 [html[data-theme='light']_&]:hover:text-zinc-900"
                  }`}
                >
                  {t(`leaderboard.period.${tab}`)}
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] px-6 py-14 text-center text-[16px] text-zinc-500 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-600">
            <span className="inline-block animate-pulse">{t("leaderboard.loading")}</span>
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-500/25 bg-red-950/25 px-5 py-6 text-center text-[15px] font-medium text-red-100 [html[data-theme='light']_&]:border-red-200 [html[data-theme='light']_&]:bg-red-50 [html[data-theme='light']_&]:text-red-800">
            {t("leaderboard.error")}
          </div>
        ) : !hasData ? (
          <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] px-6 py-14 text-center [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white">
            <p className="text-[17px] font-semibold text-zinc-200 [html[data-theme='light']_&]:text-zinc-900">
              {t("leaderboard.placeholderTitle")}
            </p>
            <p className="mt-2 text-[14px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
              {t("leaderboard.emptyHint")}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3 sm:gap-3">
              {topThree.map((item) => {
                const rowFilled = hasData && !isLeaderboardPlaceholderRow(item);
                const shell = topCardShell(item.rank);
                const chip = rankChipClass(item.rank);
                const badge = t("leaderboard.rankShort", { n: item.rank });
                const displayNick = stripLeaderboardSellerLabel(item.nickname);
                const profileAlt = t("leaderboard.avatarAlt", { name: displayNick });
                const sellerFeedAria = t("leaderboard.sellerFeedAria", { name: displayNick });
                return (
                  <article
                    key={item.videoId}
                    className={`flex flex-col rounded-2xl p-4 sm:min-h-[272px] ${shell}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[13px] font-bold ${chip}`}
                      >
                        {badge}
                      </span>
                    </div>

                    {rowFilled ? (
                      <Link
                        href={`/seller/${encodeURIComponent(item.sellerId)}`}
                        className="group mt-4 flex flex-1 flex-col gap-3 rounded-xl transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25 [html[data-theme='light']_&]:focus-visible:ring-zinc-400"
                        aria-label={sellerFeedAria}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar item={item} profileAlt={profileAlt} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[17px] font-bold text-zinc-50 underline decoration-transparent underline-offset-2 [html[data-theme='light']_&]:text-zinc-900 group-hover:underline">
                              {displayNick}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ) : (
                      <div className="mt-4 flex flex-1 flex-col gap-3">
                        <div className="flex items-center gap-3">
                          <Avatar item={item} profileAlt={profileAlt} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[17px] font-bold text-zinc-50 [html[data-theme='light']_&]:text-zinc-900">
                              {displayNick}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="mt-auto rounded-xl border border-white/[0.06] bg-black/15 px-3.5 py-3 [html[data-theme='light']_&]:border-zinc-200/90 [html[data-theme='light']_&]:bg-zinc-50/90">
                      <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-zinc-500 [html[data-theme='light']_&]:text-zinc-500">
                        {t(`leaderboard.metric.${metric}`)}
                      </p>
                      <p
                        className={`mt-1 text-xl font-extrabold tabular-nums tracking-tight ${
                          metric === "revenue"
                            ? revenueAmountClass
                            : "text-zinc-50 [html[data-theme='light']_&]:text-zinc-900"
                        }`}
                      >
                        {renderMetricValue(item, metric, rowFilled)}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>

            {others.length > 0 ? (
              <div>
                <ul className="space-y-2">
                  {others.map((item) => {
                    const rowFilled = hasData && !isLeaderboardPlaceholderRow(item);
                    const displayNick = stripLeaderboardSellerLabel(item.nickname);
                    const sellerFeedAria = t("leaderboard.sellerFeedAria", { name: displayNick });
                    return (
                      <li
                        key={item.videoId}
                        className="rounded-2xl border border-white/[0.07] bg-white/[0.03] px-3 py-3 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.08] text-[15px] font-extrabold tabular-nums text-zinc-300 [html[data-theme='light']_&]:bg-zinc-100 [html[data-theme='light']_&]:text-zinc-700"
                            aria-label={t("leaderboard.rankAria", { n: item.rank })}
                          >
                            {item.rank}
                          </span>
                          <div className="min-w-0 flex-1">
                            {rowFilled ? (
                              <Link
                                href={`/seller/${encodeURIComponent(item.sellerId)}`}
                                className="group flex min-w-0 items-center gap-3 rounded-xl py-0.5 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25 [html[data-theme='light']_&]:focus-visible:ring-zinc-400"
                                aria-label={sellerFeedAria}
                              >
                                <ListAvatar item={item} />
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-[15px] font-bold text-zinc-100 underline decoration-transparent underline-offset-2 [html[data-theme='light']_&]:text-zinc-900 group-hover:underline">
                                    {displayNick}
                                  </p>
                                </div>
                              </Link>
                            ) : (
                              <div className="flex min-w-0 items-center gap-3">
                                <ListAvatar item={item} />
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-[15px] font-bold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
                                    {displayNick}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                          <span
                            className={`shrink-0 rounded-lg border border-white/12 bg-white/[0.06] px-2.5 py-1.5 text-right text-[14px] font-extrabold tabular-nums [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-100 ${
                              metric === "revenue"
                                ? revenueAmountClass
                                : "text-zinc-50 [html[data-theme='light']_&]:text-zinc-950"
                            }`}
                          >
                            {renderMetricValue(item, metric, rowFilled)}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
