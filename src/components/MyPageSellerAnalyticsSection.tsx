"use client";

import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Eye,
  Gauge,
  MousePointerClick,
  Radio,
  ShoppingBag,
  TrendingUp,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  buildSellerAnalyticsSnapshot,
  type SellerAnalyticsSnapshot,
} from "@/data/sellerAnalytics";

type Period = 7 | 28 | 90;

function formatWon(n: number): string {
  return `${Math.round(n).toLocaleString("ko-KR")}원`;
}

function formatCompact(n: number): string {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`;
  if (n >= 10_000) return `${(n / 10_000).toFixed(1)}만`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}천`;
  return n.toLocaleString("ko-KR");
}

function SparkPositive({ v }: { v: number }) {
  const up = v > 0;
  const flat = v === 0;
  if (flat) return <span className="text-zinc-500">—</span>;
  return (
    <span
      className={`inline-flex items-center gap-0.5 font-bold tabular-nums ${
        up
          ? "text-emerald-400 [html[data-theme='light']_&]:text-emerald-600"
          : "text-rose-400 [html[data-theme='light']_&]:text-rose-600"
      }`}
    >
      {up ? (
        <ArrowUpRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
      ) : (
        <ArrowDownRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
      )}
      {up ? "+" : ""}
      {v.toFixed(1)}%
    </span>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  accent?: "cyan" | "crimson" | "violet";
}) {
  const ring =
    accent === "crimson"
      ? "border-reels-crimson/25 shadow-[0_0_32px_-12px_rgba(255,0,85,0.35)]"
      : accent === "violet"
        ? "border-violet-500/25 shadow-[0_0_32px_-12px_rgba(139,92,246,0.25)]"
        : "border-reels-cyan/25 shadow-[0_0_32px_-12px_rgba(0,242,234,0.22)]";
  return (
    <div
      className={`rounded-2xl border bg-black/30 p-4 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white ${ring}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600 sm:text-[12px]">
          {label}
        </p>
        <Icon className="h-4 w-4 shrink-0 text-reels-cyan/80 [html[data-theme='light']_&]:text-reels-cyan" aria-hidden />
      </div>
      <div className="mt-2 text-[22px] font-extrabold tabular-nums leading-tight text-zinc-100 [html[data-theme='light']_&]:text-zinc-900 sm:text-[24px]">
        {value}
      </div>
      {sub ? (
        <p className="mt-1.5 text-[12px] leading-snug text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
          {sub}
        </p>
      ) : null}
    </div>
  );
}

function RevenueBars({ data }: { data: SellerAnalyticsSnapshot["revenueByDay"] }) {
  const max = Math.max(...data.map((d) => d.revenueWon), 1);
  return (
    <div className="flex h-36 items-end gap-1.5 sm:gap-2" role="img" aria-label="기간별 수익 막대 그래프">
      {data.map((d) => {
        const h = Math.round((d.revenueWon / max) * 100);
        return (
          <div key={d.label} className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <div className="flex w-full flex-1 flex-col justify-end">
              <div
                className="w-full rounded-t-md bg-gradient-to-t from-reels-cyan/25 to-reels-cyan/70 [html[data-theme='light']_&]:from-violet-200 [html[data-theme='light']_&]:to-violet-500"
                style={{ height: `${Math.max(8, h)}%` }}
                title={formatWon(d.revenueWon)}
              />
            </div>
            <span className="text-[10px] font-semibold text-zinc-500 [html[data-theme='light']_&]:text-zinc-600 sm:text-[11px]">
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function MyPageSellerAnalyticsSection() {
  const [period, setPeriod] = useState<Period>(7);

  const snapshot = useMemo(
    () => buildSellerAnalyticsSnapshot(period),
    [period],
  );

  const t = snapshot.totals;

  return (
    <section
      className="reels-glass-card rounded-2xl p-5 sm:p-7"
      aria-labelledby="seller-analytics-heading"
    >
      <div className="flex flex-col gap-4 border-b border-white/10 pb-5 [html[data-theme='light']_&]:border-zinc-200 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <BarChart3 className="h-5 w-5 text-reels-cyan" aria-hidden />
          <h2
            id="seller-analytics-heading"
            className="text-xl font-extrabold tracking-tight text-zinc-100 [html[data-theme='light']_&]:text-zinc-900 sm:text-2xl"
          >
            내 동영상 판매 실적 분석
          </h2>
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/35 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300 [html[data-theme='light']_&]:text-emerald-700">
            <Radio className="h-3 w-3 animate-pulse" aria-hidden />
            실시간 동기화
          </span>
        </div>

        <div
          className="flex shrink-0 flex-nowrap items-center gap-2"
          role="group"
          aria-label="분석 기간"
        >
          {([7, 28, 90] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setPeriod(d)}
              className={`rounded-xl border px-3 py-2 text-[12px] font-bold transition sm:px-4 sm:text-[13px] ${
                period === d
                  ? "border-reels-cyan/45 bg-reels-cyan/15 text-zinc-100 [html[data-theme='light']_&]:text-zinc-900"
                  : "border-white/10 bg-black/20 text-zinc-400 hover:border-white/20 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50 [html[data-theme='light']_&]:text-zinc-600"
              }`}
            >
              {d === 7 ? "7일" : d === 28 ? "28일" : "90일"}
            </button>
          ))}
        </div>
      </div>

      {/* 요약 KPI */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={TrendingUp}
          label={`${snapshot.periodLabel} 추정 수익`}
          value={formatWon(t.cumulativeRevenueWon)}
          sub={
            <>
              전 기간 대비 성장{" "}
              <SparkPositive v={t.revenueGrowthPercent} />
            </>
          }
          accent="cyan"
        />
        <KpiCard
          icon={ShoppingBag}
          label="누적 판매(복제 건수)"
          value={`${t.totalSalesCount.toLocaleString("ko-KR")}건`}
          sub={
            <>
              판매 건 추이{" "}
              <span className="font-semibold text-emerald-400 [html[data-theme='light']_&]:text-emerald-600">
                +{t.salesGrowthPercent}%
              </span>{" "}
              (데모)
            </>
          }
          accent="crimson"
        />
        <KpiCard
          icon={Gauge}
          label="평균 판매 단가"
          value={t.avgSellingPrice > 0 ? formatWon(t.avgSellingPrice) : "—"}
          sub="전체 등록 조각 기준 가중 평균"
          accent="violet"
        />
        <KpiCard
          icon={MousePointerClick}
          label="노출 → 상세 CTR"
          value={`${t.ctrPercent.toFixed(1)}%`}
          sub={
            <>
              상세 → 구매 전환{" "}
              <span className="font-semibold text-reels-cyan">
                {t.purchaseConversionPercent}%
              </span>
            </>
          }
          accent="cyan"
        />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {/* 수익 추이 */}
        <div className="rounded-2xl border border-white/10 bg-black/25 p-4 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-[14px] font-extrabold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900 sm:text-[15px]">
              기간별 수익 추이
            </h3>
            <span className="text-[11px] font-medium text-zinc-500">7구간 · 일별</span>
          </div>
          <RevenueBars data={snapshot.revenueByDay} />
        </div>

        {/* 퍼널 */}
        <div className="rounded-2xl border border-white/10 bg-black/25 p-4 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50 sm:p-5">
          <h3 className="text-[14px] font-extrabold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900 sm:text-[15px]">
            전환 퍼널
          </h3>
          <p className="mt-1 text-[12px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
            노출 대비 각 단계 유입 비율 (데모)
          </p>
          <ul className="mt-4 space-y-3">
            {snapshot.funnel.map((stage, i) => (
              <li key={stage.label}>
                <div className="flex items-center justify-between gap-2 text-[12px] sm:text-[13px]">
                  <span className="font-semibold text-zinc-300 [html[data-theme='light']_&]:text-zinc-800">
                    {i + 1}. {stage.label}
                  </span>
                  <span className="tabular-nums text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
                    단계 전환 {stage.stepRatePercent}% · 누적 {stage.funnelPercent}%
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/5 [html[data-theme='light']_&]:bg-zinc-200">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-reels-cyan/40 to-reels-crimson/70"
                    style={{ width: `${Math.min(100, stage.funnelPercent)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {/* 유입 채널 */}
        <div className="rounded-2xl border border-white/10 bg-black/25 p-4 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50 sm:p-5">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-reels-cyan" aria-hidden />
            <h3 className="text-[14px] font-extrabold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900 sm:text-[15px]">
              유입 채널
            </h3>
          </div>
          <p className="mt-1 text-[12px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
            조회 유입이 어디서 왔는지 (전주 대비 증감)
          </p>
          <ul className="mt-4 space-y-3">
            {snapshot.channels.map((ch) => (
              <li key={ch.id}>
                <div className="flex items-center justify-between gap-2 text-[12px] sm:text-[13px]">
                  <span className="font-medium text-zinc-200 [html[data-theme='light']_&]:text-zinc-800">
                    {ch.label}
                  </span>
                  <span className="tabular-nums text-zinc-400">
                    {ch.percent}% ·{" "}
                    <span
                      className={
                        ch.deltaPercentPoints >= 0
                          ? "text-emerald-400"
                          : "text-rose-400"
                      }
                    >
                      {ch.deltaPercentPoints >= 0 ? "+" : ""}
                      {ch.deltaPercentPoints}pp
                    </span>
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/5 [html[data-theme='light']_&]:bg-zinc-200">
                  <div
                    className="h-full rounded-full bg-reels-cyan/70"
                    style={{ width: `${ch.percent}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* 시청 유지 */}
        <div className="rounded-2xl border border-white/10 bg-black/25 p-4 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50 sm:p-5">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-reels-cyan" aria-hidden />
            <h3 className="text-[14px] font-extrabold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900 sm:text-[15px]">
              시청 유지 곡선
            </h3>
          </div>
          <p className="mt-1 text-[12px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
            구간별 잔존 시청자 비율 (집계)
          </p>
          <ul className="mt-4 space-y-2.5">
            {snapshot.retention.map((r) => (
              <li key={r.label}>
                <div className="flex items-center justify-between text-[12px] sm:text-[13px]">
                  <span className="text-zinc-300 [html[data-theme='light']_&]:text-zinc-700">
                    {r.label}
                  </span>
                  <span className="font-bold tabular-nums text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
                    {r.audiencePercent}%
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/5 [html[data-theme='light']_&]:bg-zinc-200">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500/80 to-reels-cyan/80"
                    style={{ width: `${r.audiencePercent}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 집계 요약 바 */}
      <div className="mt-6 grid gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white sm:grid-cols-3 sm:px-5 sm:py-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-500">총 노출(추정)</p>
          <p className="mt-1 text-[18px] font-extrabold tabular-nums text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
            {formatCompact(t.totalImpressions)}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-500">상세 조회 합계</p>
          <p className="mt-1 text-[18px] font-extrabold tabular-nums text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
            {formatCompact(t.totalDetailViews)}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-500">분석 대상 조각</p>
          <p className="mt-1 text-[18px] font-extrabold tabular-nums text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
            {snapshot.videos.length}개
          </p>
        </div>
      </div>

      {/* 영상별 상세 */}
      <div className="mt-8">
        <h3 className="text-[15px] font-extrabold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900 sm:text-[16px]">
          영상별 상세 지표
        </h3>
        <p className="mt-1 text-[12px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
          제목을 눌러 상세 페이지에서 동일 지표를 확인할 수 있어요.
        </p>

        <div className="mt-4 overflow-x-auto rounded-xl border border-white/10 [html[data-theme='light']_&]:border-zinc-200">
          <table className="w-full min-w-[920px] border-collapse text-left text-[12px] sm:text-[13px]">
            <thead>
              <tr className="border-b border-white/10 bg-black/35 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-100">
                <th className="px-3 py-3 font-bold text-zinc-400 [html[data-theme='light']_&]:text-zinc-600 sm:px-4">
                  영상
                </th>
                <th className="px-2 py-3 font-bold text-zinc-400 tabular-nums [html[data-theme='light']_&]:text-zinc-600">
                  판매(건)
                </th>
                <th className="px-2 py-3 font-bold text-zinc-400 tabular-nums [html[data-theme='light']_&]:text-zinc-600">
                  누적 수익
                </th>
                <th className="px-2 py-3 font-bold text-zinc-400 tabular-nums [html[data-theme='light']_&]:text-zinc-600">
                  조회
                </th>
                <th className="px-2 py-3 font-bold text-zinc-400 tabular-nums [html[data-theme='light']_&]:text-zinc-600">
                  좋아요
                </th>
                <th className="px-2 py-3 font-bold text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
                  성장률
                </th>
                <th className="px-2 py-3 font-bold text-zinc-400 tabular-nums [html[data-theme='light']_&]:text-zinc-600">
                  CTR
                </th>
                <th className="px-2 py-3 font-bold text-zinc-400 tabular-nums [html[data-theme='light']_&]:text-zinc-600">
                  평균 시청(초)
                </th>
                <th className="px-3 py-3 font-bold text-zinc-400 tabular-nums [html[data-theme='light']_&]:text-zinc-600">
                  완주율
                </th>
              </tr>
            </thead>
            <tbody>
              {snapshot.videos.map((row) => (
                <tr
                  key={row.videoId}
                  className="border-b border-white/[0.06] [html[data-theme='light']_&]:border-zinc-200 last:border-0"
                >
                  <td className="px-3 py-2.5 sm:px-4">
                    <Link
                      href={`/video/${row.videoId}`}
                      className="flex items-center gap-2.5 group"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={row.poster}
                        alt=""
                        className="h-10 w-10 shrink-0 rounded-md object-cover ring-1 ring-white/10 [html[data-theme='light']_&]:ring-zinc-200"
                      />
                      <span className="line-clamp-2 min-w-0 font-semibold text-reels-cyan/95 group-hover:underline [html[data-theme='light']_&]:text-violet-700">
                        {row.title}
                      </span>
                    </Link>
                  </td>
                  <td className="px-2 py-2.5 tabular-nums text-zinc-200 [html[data-theme='light']_&]:text-zinc-800">
                    {row.salesCount.toLocaleString("ko-KR")}
                  </td>
                  <td className="px-2 py-2.5 tabular-nums font-semibold text-emerald-300 [html[data-theme='light']_&]:text-emerald-800">
                    {formatWon(row.cumulativeRevenueWon)}
                  </td>
                  <td className="px-2 py-2.5 tabular-nums text-zinc-300 [html[data-theme='light']_&]:text-zinc-800">
                    {formatCompact(row.totalViews)}
                  </td>
                  <td className="px-2 py-2.5 tabular-nums text-zinc-300 [html[data-theme='light']_&]:text-zinc-800">
                    {formatCompact(row.totalLikes)}
                  </td>
                  <td className="px-2 py-2.5">
                    <SparkPositive v={row.growthPercent} />
                  </td>
                  <td className="px-2 py-2.5 tabular-nums text-zinc-300 [html[data-theme='light']_&]:text-zinc-800">
                    {row.ctrPercent.toFixed(1)}%
                  </td>
                  <td className="px-2 py-2.5 tabular-nums text-zinc-300 [html[data-theme='light']_&]:text-zinc-800">
                    {row.avgWatchSec}s
                  </td>
                  <td className="px-3 py-2.5 tabular-nums text-zinc-300 [html[data-theme='light']_&]:text-zinc-800">
                    {row.completionRate}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
