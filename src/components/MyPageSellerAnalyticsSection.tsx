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
import { useCallback, useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import type { SellerAnalyticsSnapshot } from "@/data/sellerAnalytics";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { sanitizePosterSrc } from "@/lib/videoPoster";
import {
  revenueAmountClass,
  revenueTrendDownClass,
  revenueTrendUpClass,
} from "@/lib/revenueDisplayTokens";
import type { SiteLocale } from "@/lib/sitePreferences";
import { translate } from "@/lib/i18n/dictionaries";
import { localizeSellerAnalyticsSnapshot } from "@/lib/i18n/localizeSellerAnalytics";
import { useTranslation } from "@/hooks/useTranslation";

type PeriodState =
  | { kind: "preset"; days: 7 | 28 | 90 }
  | { kind: "custom"; start: string; end: string };

function localYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function defaultRangeDraft(): { start: string; end: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 29);
  return { start: localYMD(start), end: localYMD(end) };
}

function videoInsightHref(videoId: string, period: PeriodState): string {
  if (period.kind === "custom") {
    const q = new URLSearchParams({
      from: period.start,
      to: period.end,
    });
    return `/mypage/analytics/video/${encodeURIComponent(videoId)}?${q.toString()}`;
  }
  return `/mypage/analytics/video/${encodeURIComponent(videoId)}?days=${period.days}`;
}

function formatWon(n: number, locale: SiteLocale): string {
  const locTag = locale === "en" ? "en-US" : "ko-KR";
  const suffix = translate(locale, "analytics.suffixWon");
  return `${Math.round(n).toLocaleString(locTag)}${suffix}`;
}

function formatCompact(n: number, locale: SiteLocale): string {
  const locTag = locale === "en" ? "en-US" : "ko-KR";
  return new Intl.NumberFormat(locTag, { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

function SparkPositive({ v }: { v: number }) {
  const up = v > 0;
  const flat = v === 0;
  if (flat) return <span className="text-zinc-500">—</span>;
  return (
    <span className="inline-flex items-center gap-0.5 font-bold tabular-nums">
      {up ? (
        <ArrowUpRight className={`h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4 ${revenueTrendUpClass}`} aria-hidden />
      ) : (
        <ArrowDownRight className={`h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4 ${revenueTrendDownClass}`} aria-hidden />
      )}
      <span className={revenueAmountClass}>
        {up ? "+" : ""}
        {v.toFixed(1)}%
      </span>
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
  accent?: "crimson" | "violet";
}) {
  const ring =
    accent === "crimson"
      ? "border-reels-crimson/30 shadow-[0_0_32px_-12px_rgba(228,41,128,0.38)]"
      : accent === "violet"
        ? "border-reels-crimson/18 shadow-[0_0_28px_-14px_rgba(228,41,128,0.22)]"
        : "border-reels-crimson/22 shadow-[0_0_28px_-14px_rgba(228,41,128,0.26)]";
  return (
    <div
      className={`rounded-2xl border bg-black/30 p-4 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white ${ring}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[13px] font-bold uppercase tracking-[0.12em] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600 sm:text-[14px]">
          {label}
        </p>
        <Icon className="h-4 w-4 shrink-0 text-reels-crimson [html[data-theme='light']_&]:text-reels-crimson" aria-hidden />
      </div>
      <div className="mt-2 text-[24px] font-extrabold tabular-nums leading-tight text-zinc-100 [html[data-theme='light']_&]:text-zinc-900 sm:text-[26px]">
        {value}
      </div>
      {sub ? (
        <p className="mt-1.5 text-[14px] leading-snug text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
          {sub}
        </p>
      ) : null}
    </div>
  );
}

function RevenueBars({
  data,
  locale,
  ariaLabel,
}: {
  data: SellerAnalyticsSnapshot["revenueByDay"];
  locale: SiteLocale;
  ariaLabel: string;
}) {
  const max = Math.max(...data.map((d) => d.revenueWon), 1);
  return (
    <div className="flex h-36 items-end gap-1.5 sm:gap-2" role="img" aria-label={ariaLabel}>
      {data.map((d) => {
        const h = Math.round((d.revenueWon / max) * 100);
        return (
          <div key={d.label} className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <div className="flex w-full flex-1 flex-col justify-end">
              <div
                className="w-full rounded-t-md bg-gradient-to-t from-reels-crimson/35 to-[color:var(--reels-point)] [html[data-theme='light']_&]:from-[#FCEEF6] [html[data-theme='light']_&]:to-reels-crimson"
                style={{ height: `${Math.max(8, h)}%` }}
                title={formatWon(d.revenueWon, locale)}
              />
            </div>
            <span className="text-[12px] font-semibold text-zinc-500 [html[data-theme='light']_&]:text-zinc-600 sm:text-[13px]">
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function MyPageSellerAnalyticsSection() {
  const { t, locale } = useTranslation();
  const [period, setPeriod] = useState<PeriodState>({ kind: "preset", days: 7 });
  const [rangeDraft, setRangeDraft] = useState(defaultRangeDraft);
  const [snapshot, setSnapshot] = useState<SellerAnalyticsSnapshot | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const displaySnapshot = useMemo(
    () => (snapshot ? localizeSellerAnalyticsSnapshot(snapshot, locale) : null),
    [snapshot, locale],
  );

  const analyticsUrl = useMemo(() => {
    if (period.kind === "preset") {
      return `/api/mypage/seller-analytics?days=${period.days}`;
    }
    const q = new URLSearchParams({
      from: period.start,
      to: period.end,
    });
    return `/api/mypage/seller-analytics?${q.toString()}`;
  }, [period]);

  const fetchSnapshot = useCallback(async () => {
    setLoadError(null);
    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: sessionData } = (await supabase?.auth.getSession()) ?? {
        data: { session: null },
      };
      const token = sessionData.session?.access_token;
      if (!token) {
        setLoadError(t("analytics.loginRequired"));
        return;
      }
      const res = await fetch(analyticsUrl, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const data = (await res.json()) as {
        ok?: boolean;
        snapshot?: SellerAnalyticsSnapshot;
        error?: string;
      };
      if (!res.ok || !data.ok || !data.snapshot) {
        setLoadError(
          data.error === "login_required"
            ? t("analytics.loginRequired")
            : t("analytics.loadFailed"),
        );
        return;
      }
      setSnapshot(data.snapshot);
      setLoadError(null);
    } catch {
      setLoadError(t("analytics.networkError"));
    } finally {
      setLoading(false);
    }
  }, [analyticsUrl, t]);

  useEffect(() => {
    void fetchSnapshot();
  }, [fetchSnapshot]);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") void fetchSnapshot();
    }, 60_000);
    return () => window.clearInterval(id);
  }, [fetchSnapshot]);

  const applyCustomRange = () => {
    if (rangeDraft.start > rangeDraft.end) {
      window.alert(t("analytics.dateOrderError"));
      return;
    }
    setPeriod({ kind: "custom", start: rangeDraft.start, end: rangeDraft.end });
  };

  useEffect(() => {
    if (period.kind === "custom") {
      setRangeDraft({ start: period.start, end: period.end });
    }
  }, [period]);

  if (loading && !snapshot) {
    return (
      <div aria-busy aria-live="polite">
        <p className="text-[15px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
          {t("analytics.loading")}
        </p>
      </div>
    );
  }

  if (!snapshot || !displaySnapshot) {
    return (
      <div>
        <p className="text-[15px] text-[#F3C4D9] [html[data-theme='light']_&]:text-reels-crimson">
          {loadError ?? t("analytics.noData")}
        </p>
      </div>
    );
  }

  const snapTotals = displaySnapshot.totals;
  const numLocale = locale === "en" ? "en-US" : "ko-KR";

  return (
    <section aria-labelledby="seller-analytics-heading">
      <h2 id="seller-analytics-heading" className="sr-only">
        {t("analytics.title")}
      </h2>
      <div className="space-y-2 border-b border-white/10 pb-5 [html[data-theme='light']_&]:border-zinc-200">
        <div className="flex flex-col gap-3 min-[520px]:flex-row min-[520px]:items-center min-[520px]:justify-between min-[520px]:gap-3 lg:gap-4">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5 sm:gap-x-3">
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-reels-crimson/40 bg-reels-crimson/12 px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#FAD4E8] [html[data-theme='light']_&]:text-reels-crimson sm:px-2 sm:text-[12px]">
              <Radio className="h-2.5 w-2.5 animate-pulse sm:h-3 sm:w-3" aria-hidden />
              {loading ? t("analytics.syncing") : t("analytics.refresh60s")}
            </span>
          </div>

          <div className="flex min-w-0 w-full flex-wrap items-center justify-start gap-1.5 min-[520px]:w-auto min-[520px]:justify-end min-[520px]:flex-nowrap sm:gap-2">
            <div
              className="flex shrink-0 flex-nowrap items-center gap-1 sm:gap-1.5"
              role="group"
              aria-label={t("analytics.presetAria")}
            >
              <BarChart3 className="h-4 w-4 shrink-0 text-reels-crimson sm:h-[18px] sm:w-[18px]" aria-hidden />
              {([7, 28, 90] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setPeriod({ kind: "preset", days: d })}
                  className={`rounded-lg border px-2 py-1 text-[12px] font-bold transition sm:px-2.5 sm:py-1.5 sm:text-[13px] ${
                    period.kind === "preset" && period.days === d
                      ? "border-[color:var(--reels-point)]/50 bg-[color:var(--reels-point)]/14 text-zinc-100 [html[data-theme='light']_&]:text-zinc-900"
                      : "border-white/10 bg-black/20 text-zinc-400 hover:border-[color:var(--reels-point)]/25 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50 [html[data-theme='light']_&]:text-zinc-600"
                  }`}
                >
                  {d === 7 ? t("analytics.day7") : d === 28 ? t("analytics.day28") : t("analytics.day90")}
                </button>
              ))}
            </div>
            <div
              className="inline-flex min-w-0 max-w-full flex-nowrap items-center gap-1 rounded-lg border border-white/10 bg-black/20 px-1 py-1 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50 sm:gap-1.5 sm:px-1.5"
              aria-label={t("analytics.customRangeAria")}
            >
              <input
                type="date"
                value={rangeDraft.start}
                onChange={(e) => setRangeDraft((r) => ({ ...r, start: e.target.value }))}
                aria-label={t("analytics.startDateAria")}
                className="min-w-0 max-w-[42vw] shrink rounded border border-white/15 bg-black/40 px-1 py-0.5 text-[12px] leading-tight text-zinc-200 sm:max-w-none sm:px-1.5 sm:text-[13px] [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-900"
              />
              <input
                type="date"
                value={rangeDraft.end}
                onChange={(e) => setRangeDraft((r) => ({ ...r, end: e.target.value }))}
                aria-label={t("analytics.endDateAria")}
                className="min-w-0 max-w-[42vw] shrink rounded border border-white/15 bg-black/40 px-1 py-0.5 text-[12px] leading-tight text-zinc-200 sm:max-w-none sm:px-1.5 sm:text-[13px] [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-900"
              />
              <button
                type="button"
                onClick={applyCustomRange}
                className="shrink-0 rounded border border-[color:var(--reels-point)]/45 bg-[color:var(--reels-point)]/12 px-2 py-0.5 text-[12px] font-bold text-[color:var(--reels-point)] hover:bg-[color:var(--reels-point)]/18 sm:px-2.5 sm:py-1 sm:text-[13px]"
              >
                {t("analytics.apply")}
              </button>
            </div>
          </div>
        </div>
        {period.kind === "custom" ? (
          <p className="text-right text-[12px] text-[color:var(--reels-point)]/95 [html[data-theme='light']_&]:text-reels-crimson">
            {t("analytics.customRangeSummary", {
              start: period.start,
              end: period.end,
              days: displaySnapshot.periodDays,
            })}
          </p>
        ) : null}
        {loadError && displaySnapshot ? (
          <p className="text-right text-[12px] text-amber-300/95 [html[data-theme='light']_&]:text-amber-900">
            {loadError}
          </p>
        ) : null}
      </div>

      {/* 요약 KPI */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={TrendingUp}
          label={t("analytics.kpiRevenue", { period: displaySnapshot.periodLabel })}
          value={
            <span className={revenueAmountClass}>
              {formatWon(snapTotals.cumulativeRevenueWon, locale)}
            </span>
          }
          sub={
            <>
              {t("analytics.growthVsPrior")}{" "}
              <SparkPositive v={snapTotals.revenueGrowthPercent} />
            </>
          }
        />
        <KpiCard
          icon={ShoppingBag}
          label={t("analytics.kpiSales")}
          value={`${snapTotals.totalSalesCount.toLocaleString(numLocale)}${t("analytics.suffixCount")}`}
          sub={
            <>
              {t("analytics.vsPrior")}{" "}
              <span className="font-semibold text-[color:var(--reels-point)] [html[data-theme='light']_&]:text-reels-crimson">
                {snapTotals.salesGrowthPercent >= 0 ? "+" : ""}
                {snapTotals.salesGrowthPercent}%
              </span>
            </>
          }
          accent="crimson"
        />
        <KpiCard
          icon={Gauge}
          label={t("analytics.kpiAvgPrice")}
          value={
            snapTotals.avgSellingPrice > 0
              ? formatWon(snapTotals.avgSellingPrice, locale)
              : "—"
          }
          sub={t("analytics.kpiAvgPriceSub")}
          accent="violet"
        />
        <KpiCard
          icon={MousePointerClick}
          label={t("analytics.kpiCtr")}
          value={`${snapTotals.ctrPercent.toFixed(1)}%`}
          sub={
            <>
              {t("analytics.detailToPurchase")}{" "}
              <span className="font-semibold text-[color:var(--reels-point)] [html[data-theme='light']_&]:text-reels-crimson">
                {snapTotals.purchaseConversionPercent}%
              </span>
            </>
          }
        />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {/* 수익 추이 */}
        <div className="rounded-2xl border border-white/10 bg-black/25 p-4 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-[16px] font-extrabold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900 sm:text-[17px]">
              {t("analytics.revenueTrend")}
            </h3>
            <span className="text-[13px] font-medium text-zinc-500">
              {t("analytics.revenueTrendMeta", {
                bars: displaySnapshot.revenueByDay.length,
                days: displaySnapshot.periodDays,
              })}
            </span>
          </div>
          <RevenueBars
            data={displaySnapshot.revenueByDay}
            locale={locale}
            ariaLabel={t("analytics.revenueBarsAria")}
          />
        </div>

        {/* 퍼널 */}
        <div className="rounded-2xl border border-white/10 bg-black/25 p-4 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50 sm:p-5">
          <h3 className="text-[16px] font-extrabold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900 sm:text-[17px]">
            {t("analytics.funnel")}
          </h3>
          <p className="mt-1 text-[14px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
            {t("analytics.funnelHint")}
          </p>
          <ul className="mt-4 space-y-3">
            {displaySnapshot.funnel.map((stage, i) => (
              <li key={stage.label}>
                <div className="flex items-center justify-between gap-2 text-[14px] sm:text-[15px]">
                  <span className="font-semibold text-zinc-300 [html[data-theme='light']_&]:text-zinc-800">
                    {i + 1}. {stage.label}
                  </span>
                  <span className="tabular-nums text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
                    {t("analytics.funnelStep", {
                      step: stage.stepRatePercent,
                      cum: stage.funnelPercent,
                    })}
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/5 [html[data-theme='light']_&]:bg-zinc-200">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-reels-crimson/55 to-[color:var(--reels-point)]"
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
            <Users className="h-4 w-4 text-reels-crimson" aria-hidden />
            <h3 className="text-[16px] font-extrabold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900 sm:text-[17px]">
              {t("analytics.channels")}
            </h3>
          </div>
          <p className="mt-1 text-[14px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
            {t("analytics.channelsHint")}
          </p>
          <ul className="mt-4 space-y-3">
            {displaySnapshot.channels.map((ch) => (
              <li key={ch.id}>
                <div className="flex items-center justify-between gap-2 text-[14px] sm:text-[15px]">
                  <span className="font-medium text-zinc-200 [html[data-theme='light']_&]:text-zinc-800">
                    {ch.label}
                  </span>
                  <span className="tabular-nums text-zinc-400">
                    {ch.percent}% ·{" "}
                    <span
                      className={
                        ch.deltaPercentPoints >= 0
                          ? "text-[color:var(--reels-point)]"
                          : "text-reels-crimson/90"
                      }
                    >
                      {ch.deltaPercentPoints >= 0 ? "+" : ""}
                      {ch.deltaPercentPoints}pp
                    </span>
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/5 [html[data-theme='light']_&]:bg-zinc-200">
                  <div
                    className="h-full rounded-full bg-reels-crimson/75"
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
            <Eye className="h-4 w-4 text-reels-crimson" aria-hidden />
            <h3 className="text-[16px] font-extrabold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900 sm:text-[17px]">
              {t("analytics.retention")}
            </h3>
          </div>
          <p className="mt-1 text-[14px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
            {t("analytics.retentionHint")}
          </p>
          <ul className="mt-4 space-y-2.5">
            {displaySnapshot.retention.map((r) => (
              <li key={r.label}>
                <div className="flex items-center justify-between text-[14px] sm:text-[15px]">
                  <span className="text-zinc-300 [html[data-theme='light']_&]:text-zinc-700">
                    {r.label}
                  </span>
                  <span className="font-bold tabular-nums text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
                    {r.audiencePercent}%
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/5 [html[data-theme='light']_&]:bg-zinc-200">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-reels-crimson/50 to-[color:var(--reels-point)]/90"
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
          <p className="text-[13px] font-bold uppercase tracking-[0.12em] text-zinc-500">
            {t("analytics.totals.impressions")}
          </p>
          <p className="mt-1 text-[20px] font-extrabold tabular-nums text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
            {formatCompact(snapTotals.totalImpressions, locale)}
          </p>
        </div>
        <div>
          <p className="text-[13px] font-bold uppercase tracking-[0.12em] text-zinc-500">
            {t("analytics.totals.detailViews")}
          </p>
          <p className="mt-1 text-[20px] font-extrabold tabular-nums text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
            {formatCompact(snapTotals.totalDetailViews, locale)}
          </p>
        </div>
        <div>
          <p className="text-[13px] font-bold uppercase tracking-[0.12em] text-zinc-500">
            {t("analytics.totals.videos")}
          </p>
          <p className="mt-1 text-[20px] font-extrabold tabular-nums text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
            {t("analytics.totals.videoCount", { n: displaySnapshot.videos.length })}
          </p>
        </div>
      </div>

      {/* 영상별 상세 */}
      <div className="mt-8">
        <h3 className="text-[17px] font-extrabold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900 sm:text-[18px]">
          {t("analytics.tableTitle")}
        </h3>
        <p className="mt-1 text-[14px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
          {t("analytics.tableHint")}
        </p>

        <div className="mt-4 overflow-x-auto rounded-xl border border-white/10 [html[data-theme='light']_&]:border-zinc-200">
          <table className="w-full min-w-[920px] border-collapse text-left text-[14px] sm:text-[15px]">
            <thead>
              <tr className="border-b border-white/10 bg-black/35 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-100">
                <th className="px-3 py-3 font-bold text-zinc-400 [html[data-theme='light']_&]:text-zinc-600 sm:px-4">
                  {t("analytics.col.video")}
                </th>
                <th className="px-2 py-3 font-bold text-zinc-400 tabular-nums [html[data-theme='light']_&]:text-zinc-600">
                  {t("analytics.col.sales")}
                </th>
                <th className="px-2 py-3 font-bold text-zinc-400 tabular-nums [html[data-theme='light']_&]:text-zinc-600">
                  {t("analytics.col.revenue")}
                </th>
                <th className="px-2 py-3 font-bold text-zinc-400 tabular-nums [html[data-theme='light']_&]:text-zinc-600">
                  {t("analytics.col.views")}
                </th>
                <th className="px-2 py-3 font-bold text-zinc-400 tabular-nums [html[data-theme='light']_&]:text-zinc-600">
                  {t("analytics.col.likes")}
                </th>
                <th className="px-2 py-3 font-bold text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
                  {t("analytics.col.growth")}
                </th>
                <th className="px-2 py-3 font-bold text-zinc-400 tabular-nums [html[data-theme='light']_&]:text-zinc-600">
                  CTR
                </th>
                <th className="px-2 py-3 font-bold text-zinc-400 tabular-nums [html[data-theme='light']_&]:text-zinc-600">
                  {t("analytics.col.avgWatch")}
                </th>
                <th className="px-3 py-3 font-bold text-zinc-400 tabular-nums [html[data-theme='light']_&]:text-zinc-600">
                  {t("analytics.col.completion")}
                </th>
              </tr>
            </thead>
            <tbody>
              {displaySnapshot.videos.map((row) => (
                <tr
                  key={row.videoId}
                  className="border-b border-white/[0.06] [html[data-theme='light']_&]:border-zinc-200 last:border-0"
                >
                  <td className="px-3 py-2.5 sm:px-4">
                    <Link
                      href={videoInsightHref(row.videoId, period)}
                      className="flex items-center gap-2.5 group"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={sanitizePosterSrc(row.poster)}
                        alt=""
                        className="h-10 w-10 shrink-0 rounded-md object-cover ring-1 ring-white/10 [html[data-theme='light']_&]:ring-zinc-200"
                      />
                      <span className="line-clamp-2 min-w-0 font-semibold text-[color:var(--reels-point)]/95 group-hover:underline [html[data-theme='light']_&]:text-reels-crimson">
                        {row.title}
                      </span>
                    </Link>
                  </td>
                  <td className="px-2 py-2.5 tabular-nums text-zinc-200 [html[data-theme='light']_&]:text-zinc-800">
                    {row.salesCount.toLocaleString(numLocale)}
                  </td>
                  <td className={`px-2 py-2.5 tabular-nums font-semibold ${revenueAmountClass}`}>
                    {formatWon(row.cumulativeRevenueWon, locale)}
                  </td>
                  <td className="px-2 py-2.5 tabular-nums text-zinc-300 [html[data-theme='light']_&]:text-zinc-800">
                    {formatCompact(row.totalViews, locale)}
                  </td>
                  <td className="px-2 py-2.5 tabular-nums text-zinc-300 [html[data-theme='light']_&]:text-zinc-800">
                    {formatCompact(row.totalLikes, locale)}
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
