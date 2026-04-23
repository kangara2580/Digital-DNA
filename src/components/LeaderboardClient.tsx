"use client";

import { Crown, Medal, TrendingUp, Trophy } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

type Metric = "sales" | "revenue";

type LeaderboardItem = {
  rank: number;
  sellerId: string;
  nickname: string;
  avatarUrl: string | null;
  category: string;
  totalSales: number;
  totalRevenue: number;
};

type LeaderboardResponse = {
  ok: boolean;
  rankings?: LeaderboardItem[];
  categories?: string[];
  error?: string;
};

const BASE_CATEGORY_OPTIONS = ["all", "healing", "sleep", "asmr"];

const CATEGORY_LABEL_MAP: Record<string, string> = {
  all: "전체",
  healing: "힐링",
  sleep: "수면",
  asmr: "ASMR",
  daily: "일상",
  shortform: "숏폼·릴스",
  dance: "춤",
  music: "노래",
  food: "푸드",
  travel: "여행",
  animals: "동물",
  business: "비즈니스",
  comedy: "코미디",
  cartoon: "만화",
  oops: "실패와 실수",
};

const TOP_THEME: Record<
  number,
  { border: string; badge: string; icon: ReactNode; title: string }
> = {
  1: {
    border:
      "border-[#FFD700]/70 bg-gradient-to-br from-[#FFD700]/25 via-[#8d6f00]/15 to-black/40 shadow-[0_12px_38px_-18px_rgba(255,215,0,0.55)]",
    badge: "bg-[#FFD700]/18 text-[#FFD700] border-[#FFD700]/40",
    icon: <Crown className="h-4 w-4" aria-hidden />,
    title: "왕",
  },
  2: {
    border:
      "border-[#C0C0C0]/70 bg-gradient-to-br from-[#C0C0C0]/20 via-[#707070]/12 to-black/40 shadow-[0_12px_38px_-18px_rgba(192,192,192,0.45)]",
    badge: "bg-[#C0C0C0]/16 text-[#E6E6E6] border-[#C0C0C0]/40",
    icon: <Medal className="h-4 w-4" aria-hidden />,
    title: "2위",
  },
  3: {
    border:
      "border-[#CD7F32]/75 bg-gradient-to-br from-[#CD7F32]/22 via-[#7b4a1a]/14 to-black/40 shadow-[0_12px_38px_-18px_rgba(205,127,50,0.42)]",
    badge: "bg-[#CD7F32]/18 text-[#E8BC8A] border-[#CD7F32]/40",
    icon: <Trophy className="h-4 w-4" aria-hidden />,
    title: "3위",
  },
};

function categoryLabel(value: string): string {
  const key = value.trim().toLowerCase();
  return CATEGORY_LABEL_MAP[key] ?? value;
}

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
  return metric === "revenue" ? "Top Revenue" : "Top Sales";
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
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<LeaderboardItem[]>([]);
  const [dbCategories, setDbCategories] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const res = await fetch(
          `/api/leaderboard?metric=${encodeURIComponent(metric)}&category=${encodeURIComponent(category)}`,
          { cache: "no-store", signal: controller.signal },
        );
        const body = (await res.json()) as LeaderboardResponse;
        if (!res.ok || !body.ok) {
          throw new Error(body.error ?? "fetch_failed");
        }
        setItems(Array.isArray(body.rankings) ? body.rankings : []);
        setDbCategories(Array.isArray(body.categories) ? body.categories : []);
      } catch (fetchError) {
        if (controller.signal.aborted) return;
        setItems([]);
        setError(fetchError instanceof Error ? fetchError.message : "unknown_error");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [category, metric]);

  const categories = useMemo(() => {
    const merged = new Set<string>(BASE_CATEGORY_OPTIONS);
    dbCategories.forEach((c) => merged.add(c.trim().toLowerCase()));
    return Array.from(merged);
  }, [dbCategories]);

  const topThree = items.slice(0, 3);
  const others = items.slice(3);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <section className="reels-glass-card overflow-hidden rounded-2xl border border-white/10 p-4 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-reels-cyan/35 bg-reels-cyan/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-reels-cyan">
            Leaderboard
          </span>
          <h1 className="text-xl font-extrabold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900 sm:text-2xl">
            명예의 전당 2.0
          </h1>
        </div>
        <p className="mt-2 text-sm text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
          카테고리별 판매자 랭킹을 실시간으로 확인하세요.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {(["sales", "revenue"] as const).map((tab) => {
            const active = metric === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setMetric(tab)}
                className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-bold transition ${
                  active
                    ? "border-reels-cyan/45 bg-reels-cyan/15 text-reels-cyan"
                    : "border-white/15 bg-black/20 text-zinc-300 hover:border-white/30 hover:text-zinc-100 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50 [html[data-theme='light']_&]:text-zinc-700 [html[data-theme='light']_&]:hover:text-zinc-900"
                }`}
              >
                {tab === "sales" ? <Trophy className="h-4 w-4" aria-hidden /> : <TrendingUp className="h-4 w-4" aria-hidden />}
                {metricLabel(tab)}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {categories.map((cat) => {
            const active = category === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? "border-reels-crimson/55 bg-reels-crimson/20 text-reels-crimson"
                    : "border-white/15 bg-black/20 text-zinc-300 hover:border-white/30 hover:text-zinc-100 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50 [html[data-theme='light']_&]:text-zinc-700 [html[data-theme='light']_&]:hover:text-zinc-900"
                }`}
              >
                {categoryLabel(cat)}
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-5">
        {loading ? (
          <div className="reels-glass-card rounded-2xl border border-white/10 p-6 text-sm text-zinc-400 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:text-zinc-600">
            데이터를 불러오는 중...
          </div>
        ) : error ? (
          <div className="reels-glass-card rounded-2xl border border-red-500/35 bg-red-500/8 p-6 text-sm text-red-200 [html[data-theme='light']_&]:text-red-700">
            랭킹 데이터를 불러오지 못했어요. 잠시 후 다시 시도해주세요.
          </div>
        ) : items.length === 0 ? (
          <div className="reels-glass-card rounded-2xl border border-reels-cyan/35 bg-reels-cyan/8 p-6 text-center">
            <p className="text-base font-bold text-reels-cyan">
              첫 번째 명예의 전당 주인공이 되어보세요!
            </p>
            <p className="mt-2 text-sm text-zinc-300 [html[data-theme='light']_&]:text-zinc-700">
              아직 판매 데이터가 없어요. 첫 판매가 등록되면 자동으로 랭킹이 시작됩니다.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid gap-3 md:grid-cols-3">
              {topThree.map((item) => {
                const theme = TOP_THEME[item.rank] ?? TOP_THEME[3];
                const kingWord =
                  item.rank === 1
                    ? metric === "revenue"
                      ? "수익왕"
                      : "판매왕"
                    : theme.title;
                return (
                  <article
                    key={item.sellerId}
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

                    <div className="mt-4 flex items-center gap-3">
                      <Avatar item={item} />
                      <div className="min-w-0">
                        <p className="truncate text-base font-extrabold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
                          {item.nickname}
                        </p>
                        <p className="truncate text-xs text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
                          카테고리: {categoryLabel(item.category)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-xl border border-white/15 bg-black/30 px-3 py-2 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-100">
                      <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
                        {metricKoreanLabel(metric)}
                      </p>
                      <p className="mt-1 text-lg font-extrabold text-reels-cyan">
                        {metricValue(item, metric)}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>

            {others.length > 0 ? (
              <div className="reels-glass-card overflow-hidden rounded-2xl border border-white/10 [html[data-theme='light']_&]:border-zinc-200">
                <ul>
                  {others.map((item) => (
                    <li
                      key={item.sellerId}
                      className="flex items-center justify-between gap-3 border-t border-white/10 px-4 py-3 first:border-t-0 [html[data-theme='light']_&]:border-zinc-200"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="w-8 text-center text-base font-extrabold text-zinc-200 [html[data-theme='light']_&]:text-zinc-800">
                          {item.rank}
                        </span>
                        <Avatar item={item} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
                            {item.nickname}
                          </p>
                          <p className="truncate text-xs text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
                            {categoryLabel(item.category)}
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 text-sm font-extrabold text-reels-cyan">
                        {metricValue(item, metric)}
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
