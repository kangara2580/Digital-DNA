"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  Clock,
  Monitor,
  MousePointerClick,
  Search,
  Smartphone,
  Tv,
  Tablet,
} from "lucide-react";
import type { SellerVideoDetailSnapshot } from "@/data/sellerAnalytics";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import {
  revenueAmountClass,
  revenueTrendDownClass,
  revenueTrendUpClass,
} from "@/lib/revenueDisplayTokens";
import { sanitizePosterSrc } from "@/lib/videoPoster";

function formatWon(n: number): string {
  return `${Math.round(n).toLocaleString("ko-KR")}원`;
}

function formatCompact(n: number): string {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`;
  if (n >= 10_000) return `${(n / 10_000).toFixed(1)}만`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}천`;
  return n.toLocaleString("ko-KR");
}

type Props = {
  videoId: string;
  days: number;
  from?: string;
  to?: string;
};

export function SellerVideoAnalyticsDetail({ videoId, days, from, to }: Props) {
  const [detail, setDetail] = useState<SellerVideoDetailSnapshot | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const queryUrl = useMemo(() => {
    const q =
      from && to && /^\d{4}-\d{2}-\d{2}$/.test(from) && /^\d{4}-\d{2}-\d{2}$/.test(to)
        ? new URLSearchParams({ from, to })
        : new URLSearchParams({ days: String(days) });
    return `/api/mypage/seller-analytics/video/${encodeURIComponent(videoId)}?${q.toString()}`;
  }, [videoId, days, from, to]);

  const load = useCallback(async () => {
    setLoadError(null);
    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: sessionData } = (await supabase?.auth.getSession()) ?? {
        data: { session: null },
      };
      const token = sessionData.session?.access_token;
      if (!token) {
        setLoadError("로그인이 필요합니다.");
        setDetail(null);
        return;
      }
      const res = await fetch(queryUrl, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const data = (await res.json()) as {
        ok?: boolean;
        detail?: SellerVideoDetailSnapshot;
        error?: string;
      };
      if (res.status === 404 || data.error === "not_found") {
        setDetail(null);
        setLoadError(null);
        return;
      }
      if (!res.ok || !data.ok || !data.detail) {
        setLoadError(
          data.error === "login_required"
            ? "로그인이 필요합니다."
            : "데이터를 불러오지 못했습니다.",
        );
        return;
      }
      setDetail(data.detail);
    } catch {
      setLoadError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [queryUrl]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !detail) {
    return (
      <div className="reels-glass-card rounded-2xl p-8 text-center text-zinc-400">
        <p className="font-semibold">불러오는 중…</p>
      </div>
    );
  }

  if (loadError && !detail) {
    return (
      <div className="reels-glass-card rounded-2xl p-8 text-center text-[#F3C4D9]">
        <p className="font-semibold">{loadError}</p>
        <Link href="/mypage?tab=analytics" className="mt-4 inline-block text-reels-cyan hover:underline">
          판매 분석으로 돌아가기
        </Link>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="reels-glass-card rounded-2xl p-8 text-center text-zinc-400">
        <p className="font-semibold">영상을 찾을 수 없어요.</p>
        <Link href="/mypage?tab=analytics" className="mt-4 inline-block text-reels-cyan hover:underline">
          판매 분석으로 돌아가기
        </Link>
      </div>
    );
  }

  const { row } = detail;
  const maxHour = Math.max(...detail.hourlyAttention.map((h) => h.weight), 1);

  return (
    <div className="space-y-8">
      <nav className="flex flex-wrap items-center gap-3 font-mono text-[11px] text-zinc-500">
        <Link href="/" className="text-reels-cyan/90 hover:text-reels-cyan">
          홈
        </Link>
        <span>/</span>
        <Link href="/mypage?tab=analytics" className="text-reels-cyan/90 hover:text-reels-cyan">
          판매 분석
        </Link>
        <span>/</span>
        <span className="text-zinc-400">영상 인사이트</span>
      </nav>

      <header className="flex flex-col gap-4 border-b border-white/10 pb-6 [html[data-theme='light']_&]:border-zinc-200 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 gap-4">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/40 sm:h-24 sm:w-24">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={sanitizePosterSrc(detail.poster)}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-reels-cyan/90">
              {detail.periodLabel}
            </p>
            <h1 className="mt-1 text-xl font-extrabold tracking-tight text-zinc-100 [html[data-theme='light']_&]:text-zinc-900 sm:text-2xl">
              {detail.title}
            </h1>
            <p className="mt-2 text-[13px] text-zinc-500">
              등록된 조회·판매 데이터를 기준으로 한 기간 추정 지표입니다.
            </p>
          </div>
        </div>
        <Link
          href={`/video/${videoId}`}
          className="inline-flex shrink-0 items-center gap-2 self-start rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2.5 text-[13px] font-bold text-zinc-200 transition hover:border-reels-cyan/35 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:text-zinc-800"
        >
          <ArrowLeft className="h-4 w-4" />
          릴스 상세
        </Link>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-reels-cyan/25 bg-black/25 p-4 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50">
          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">기간 추정 수익</p>
          <p className={`mt-1 text-[22px] font-extrabold tabular-nums ${revenueAmountClass}`}>
            {formatWon(detail.periodRevenueWon)}
          </p>
          <p className="mt-1 text-[11px] text-zinc-500">
            직전 동일 길이 기간 대비{" "}
            <span className="inline-flex items-center gap-0.5">
              <span
                className={
                  detail.revenueMomPercent >= 0 ? revenueTrendUpClass : revenueTrendDownClass
                }
                aria-hidden
              >
                {detail.revenueMomPercent >= 0 ? "▲" : "▼"}
              </span>
              <span className={`text-[11px] font-semibold ${revenueAmountClass}`}>
                {detail.revenueMomPercent >= 0 ? "+" : ""}
                {detail.revenueMomPercent}%
              </span>
            </span>
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/25 p-4 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50">
          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">조회</p>
          <p className="mt-1 text-[22px] font-extrabold tabular-nums text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
            {formatCompact(row.totalViews)}
          </p>
          <p className="mt-1 text-[11px] text-zinc-500">
            직전 대비 추정 조회{" "}
            <span
              className={
                detail.viewsMomPercent >= 0 ? "text-reels-cyan" : "text-reels-crimson/90"
              }
            >
              {detail.viewsMomPercent >= 0 ? "+" : ""}
              {detail.viewsMomPercent}%
            </span>
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/25 p-4 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50">
          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">평균 시청</p>
          <p className="mt-1 text-[22px] font-extrabold tabular-nums text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
            {row.avgWatchSec}초
          </p>
          <p className="mt-1 text-[11px] text-zinc-500">완주율 {row.completionRate}%</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/25 p-4 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50">
          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">CTR</p>
          <p className="mt-1 text-[22px] font-extrabold tabular-nums text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
            {row.ctrPercent.toFixed(1)}%
          </p>
          <p className="mt-1 text-[11px] text-zinc-500">노출 대비 상세</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-5 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white">
          <h2 className="flex items-center gap-2 text-[15px] font-extrabold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
            <BarChart3 className="h-4 w-4 text-reels-cyan" />
            기간별 수익 추이
          </h2>
          <div className="mt-4 flex h-40 items-end gap-1">
            {detail.revenueByDay.map((d) => {
              const max = Math.max(...detail.revenueByDay.map((x) => x.revenueWon), 1);
              const h = Math.round((d.revenueWon / max) * 100);
              return (
                <div key={d.label} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                  <div className="flex w-full flex-1 flex-col justify-end">
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-reels-cyan/30 to-reels-cyan/75"
                      style={{ height: `${Math.max(10, h)}%` }}
                      title={formatWon(d.revenueWon)}
                    />
                  </div>
                  <span className="text-[9px] font-semibold text-zinc-500">{d.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-5 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white">
          <h2 className="flex items-center gap-2 text-[15px] font-extrabold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
            <MousePointerClick className="h-4 w-4 text-reels-cyan" />
            전환 퍼널
          </h2>
          <ul className="mt-4 space-y-3">
            {detail.funnel.map((stage, i) => (
              <li key={stage.label}>
                <div className="flex justify-between text-[12px]">
                  <span className="font-semibold text-zinc-300 [html[data-theme='light']_&]:text-zinc-800">
                    {i + 1}. {stage.label}
                  </span>
                  <span className="tabular-nums text-zinc-500">
                    {stage.stepRatePercent}% · 누적 {stage.funnelPercent}%
                  </span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/5 [html[data-theme='light']_&]:bg-zinc-200">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-reels-cyan/50 to-reels-crimson/60"
                    style={{ width: `${Math.min(100, stage.funnelPercent)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-5 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white">
          <h2 className="text-[15px] font-extrabold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
            유입 경로
          </h2>
          <ul className="mt-4 space-y-3">
            {detail.channels.map((ch) => (
              <li key={ch.id}>
                <div className="flex justify-between text-[12px]">
                  <span className="text-zinc-300 [html[data-theme='light']_&]:text-zinc-800">{ch.label}</span>
                  <span className="tabular-nums text-zinc-500">{ch.percent}%</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/5 [html[data-theme='light']_&]:bg-zinc-200">
                  <div
                    className="h-full rounded-full bg-reels-cyan/70"
                    style={{ width: `${Math.min(100, ch.percent)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-5 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white">
          <h2 className="text-[15px] font-extrabold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
            시청 유지
          </h2>
          <ul className="mt-4 space-y-2">
            {detail.retention.map((r) => (
              <li key={r.label} className="flex justify-between text-[12px]">
                <span className="text-zinc-400">{r.label}</span>
                <span className="font-bold tabular-nums text-zinc-200 [html[data-theme='light']_&]:text-zinc-900">
                  {r.audiencePercent}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-5 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white">
          <h2 className="mb-4 flex items-center gap-2 text-[15px] font-extrabold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
            <Monitor className="h-4 w-4 text-reels-cyan" />
            기기별 시청
          </h2>
          <ul className="space-y-3">
            {detail.devices.map((d) => (
              <li key={d.id} className="flex items-center gap-3 text-[13px]">
                {d.id === "mobile" ? (
                  <Smartphone className="h-4 w-4 text-zinc-500" />
                ) : d.id === "desktop" ? (
                  <Monitor className="h-4 w-4 text-zinc-500" />
                ) : d.id === "tablet" ? (
                  <Tablet className="h-4 w-4 text-zinc-500" />
                ) : (
                  <Tv className="h-4 w-4 text-zinc-500" />
                )}
                <span className="flex-1 text-zinc-300 [html[data-theme='light']_&]:text-zinc-800">{d.label}</span>
                <span className="font-bold tabular-nums text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
                  {d.percent}%
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-5 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white">
          <h2 className="mb-4 flex items-center gap-2 text-[15px] font-extrabold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
            <Search className="h-4 w-4 text-reels-cyan" />
            검색으로 유입된 키워드
          </h2>
          <ul className="space-y-2">
            {detail.searchTerms.map((s) => (
              <li key={s.term} className="flex justify-between text-[13px]">
                <span className="text-zinc-400">{s.term}</span>
                <span className="font-semibold tabular-nums text-zinc-200 [html[data-theme='light']_&]:text-zinc-900">
                  {s.sharePercent}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/20 p-5 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white">
        <h2 className="mb-4 flex items-center gap-2 text-[15px] font-extrabold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
          <Clock className="h-4 w-4 text-reels-cyan" />
          시청이 몰린 시간대 (24h)
        </h2>
        <div className="flex h-28 items-end gap-px sm:gap-0.5">
          {detail.hourlyAttention.map(({ hour, weight }) => (
            <div
              key={hour}
              className="flex min-w-0 flex-1 flex-col items-center gap-1"
              title={`${hour}시`}
            >
              <div className="flex w-full flex-1 flex-col justify-end">
                <div
                  className="w-full rounded-t-sm bg-violet-500/70 [html[data-theme='light']_&]:bg-violet-600"
                  style={{ height: `${Math.max(8, (weight / maxHour) * 100)}%` }}
                />
              </div>
              <span className="text-[8px] text-zinc-600 sm:text-[9px]">{hour}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
