"use client";

import { useMemo } from "react";
import { Eye, Heart, ShoppingBag, TrendingUp } from "lucide-react";
import type { TrendingRankMetrics } from "@/data/trendingStats";
import { useTranslation } from "@/hooks/useTranslation";
import { getExploreFormatters } from "@/lib/exploreLocaleFormat";
import {
  revenueAmountClass,
  revenueTrendDeltaGlyphClass,
  revenueTrendDownClass,
  revenueTrendUpClass,
} from "@/lib/revenueDisplayTokens";

type Props = {
  metrics: TrendingRankMetrics;
  /** 상세 등에서만 — 누적 구매 인원 행 */
  salesCount?: number;
  /** 오픈 에디션이 아닐 때 남은 수량 행 */
  stockRow?: { remaining: number | null; soldOut: boolean } | null;
  /** 메인 인기순위 카드 등 — 수익·조회수·좋아요 표기 글자만 숨김(아이콘·수치·▲▼ 유지) */
  hideMetricLabels?: boolean;
};

const rowCls = "flex items-center gap-8 py-1.5";

const labelCls =
  "w-[4.5rem] shrink-0 text-[14px] font-medium leading-snug text-zinc-400 [html[data-theme='light']_&]:text-zinc-500";

const valueCls =
  "text-[15px] font-extrabold leading-snug tabular-nums tracking-tight text-[#EAF1FF] [html[data-theme='light']_&]:text-zinc-900";

/** 메인 인기순위(라벨 숨김) — 수익·조회·좋아요 숫자만 소형 */
const valueClsRankingCompact =
  "text-[12px] font-extrabold leading-snug tabular-nums tracking-tight text-[#EAF1FF] [html[data-theme='light']_&]:text-zinc-900 sm:text-[13px]";

export function TrendingVideoStatsFooter({
  metrics,
  salesCount,
  stockRow,
  hideMetricLabels = false,
}: Props) {
  const { t, locale } = useTranslation();
  const fmt = useMemo(() => getExploreFormatters(locale), [locale]);
  const isUp = metrics.growthPercent >= 0;
  const metricRowCls = hideMetricLabels
    ? "flex w-full min-w-0 items-center gap-2 py-1.5"
    : rowCls;
  const labelColCls = hideMetricLabels
    ? "inline-flex w-[3.5rem] shrink-0 items-center justify-start gap-1"
    : "inline-flex w-[4.5rem] shrink-0 items-center gap-1.5";
  const labelTone =
    "text-[14px] font-medium leading-snug text-zinc-400 [html[data-theme='light']_&]:text-zinc-500";
  const valueDdExtras = hideMetricLabels ? "flex-1 text-right" : "";
  const metricValueSize = hideMetricLabels ? "text-[12px] sm:text-[13px]" : "text-[15px]";
  const neutralMetricValueCls = hideMetricLabels ? valueClsRankingCompact : valueCls;

  return (
    <div
      className={`${hideMetricLabels ? "w-full min-w-0" : "w-fit"} px-3 py-2 [html[data-theme='light']_&]:bg-white sm:px-4`}
    >
      <dl className={hideMetricLabels ? "w-full min-w-0 leading-snug" : "leading-snug"}>
        <div className={metricRowCls}>
          <dt className={`${labelColCls} ${labelTone}`}>
            <TrendingUp className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {hideMetricLabels ? <span className="sr-only">{t("stats.revenue")}</span> : t("stats.revenue")}
            <span
              className={`${revenueTrendDeltaGlyphClass} text-[11px] leading-none ${isUp ? revenueTrendUpClass : revenueTrendDownClass}`}
              aria-hidden
            >
              {isUp ? "▲" : "▼"}
            </span>
          </dt>
          <dd
            className={`min-w-0 font-extrabold tabular-nums ${metricValueSize} ${valueDdExtras} ${revenueAmountClass}`}
          >
            {fmt.formatCompactWon(metrics.cumulativeRevenueWon)}
          </dd>
        </div>
        <div className={metricRowCls}>
          <dt className={`${labelColCls} ${labelTone}`}>
            <Eye className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {hideMetricLabels ? <span className="sr-only">{t("stats.views")}</span> : t("stats.views")}
          </dt>
          <dd className={`${neutralMetricValueCls} min-w-0 ${valueDdExtras}`}>
            {fmt.formatViewCountRail(metrics.totalViews)}
          </dd>
        </div>
        <div className={metricRowCls}>
          <dt className={`${labelColCls} ${labelTone}`}>
            <Heart className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {hideMetricLabels ? <span className="sr-only">{t("stats.likes")}</span> : t("stats.likes")}
          </dt>
          <dd className={`${neutralMetricValueCls} min-w-0 ${valueDdExtras}`}>
            {fmt.formatLikeApprox(metrics.totalLikes)}
          </dd>
        </div>
        {typeof salesCount === "number" ? (
          <div className={rowCls}>
            <dt className={`${labelCls} inline-flex items-center gap-1.5`}>
              <ShoppingBag className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {t("stats.purchases")}
            </dt>
            <dd className={valueCls}>
              {t("stats.buyersCount", {
                n: salesCount.toLocaleString(fmt.numberLocale),
              })}
            </dd>
          </div>
        ) : null}
        {stockRow ? (
          <div className={rowCls}>
            <dt className={labelCls}>{t("stats.remaining")}</dt>
            <dd className={valueCls}>
              {stockRow.soldOut ? (
                <span className="text-reels-crimson">{t("stats.soldOutLine")}</span>
              ) : (
                <span className="text-reels-cyan">
                  {stockRow.remaining != null
                    ? t("stats.unitsLeft", {
                        n: stockRow.remaining.toLocaleString(fmt.numberLocale),
                      })
                    : "—"}
                </span>
              )}
            </dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}
