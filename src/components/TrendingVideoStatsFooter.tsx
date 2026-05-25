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
  /** 장바구니·좁은 그리드 — 패딩·행 간격·글자 크기 축소 */
  dense?: boolean;
  /** 상세·구매 등 — 수익만 만/억 축약 없이 전체 숫자(천 단위 구분) */
  revenueFullWon?: boolean;
  /** 쇼핑몰·카테고리 그리드 — 수익·조회·좋아요 모두 전체 숫자(만/k 없음) */
  fullNumberDisplay?: boolean;
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
  dense = false,
  revenueFullWon = false,
  fullNumberDisplay = false,
}: Props) {
  const { t, locale } = useTranslation();
  const fmt = useMemo(() => getExploreFormatters(locale), [locale]);
  const useFullNumbers = fullNumberDisplay || revenueFullWon;
  const revenueDisplay = useMemo(() => {
    const gems = Math.max(0, Math.floor(metrics.cumulativeRevenueWon));
    return gems.toLocaleString(fmt.numberLocale);
  }, [metrics.cumulativeRevenueWon, fmt.numberLocale]);
  const viewsDisplay = useMemo(() => {
    if (!useFullNumbers) return fmt.formatViewCountRail(metrics.totalViews);
    return fmt.formatFullCount(metrics.totalViews);
  }, [useFullNumbers, metrics.totalViews, fmt]);
  const likesDisplay = useMemo(() => {
    if (!useFullNumbers) return fmt.formatLikeApprox(metrics.totalLikes);
    return fmt.formatFullCount(metrics.totalLikes);
  }, [useFullNumbers, metrics.totalLikes, fmt]);
  const isUp = metrics.growthPercent >= 0;
  const metricRowCls =
    dense && hideMetricLabels
      ? "flex w-full min-w-0 items-center gap-1 py-0.5"
      : hideMetricLabels
        ? "flex w-full min-w-0 items-center gap-2 py-1.5"
        : rowCls;
  const labelColCls = hideMetricLabels
    ? dense
      ? "inline-flex w-[2.75rem] shrink-0 items-center justify-start gap-0.5"
      : "inline-flex w-[3.5rem] shrink-0 items-center justify-start gap-1"
    : "inline-flex w-[4.5rem] shrink-0 items-center gap-1.5";
  const labelTone =
    "text-[14px] font-medium leading-snug text-zinc-400 [html[data-theme='light']_&]:text-zinc-500";
  const valueDdExtras = hideMetricLabels ? "flex-1 text-right" : "";
  const metricValueSize =
    dense && hideMetricLabels
      ? "text-[10px] sm:text-[11px]"
      : hideMetricLabels
        ? "text-[12px] sm:text-[13px]"
        : "text-[15px]";
  const neutralMetricValueCls =
    dense && hideMetricLabels
      ? "text-[10px] font-extrabold leading-snug tabular-nums tracking-tight text-[#EAF1FF] [html[data-theme='light']_&]:text-zinc-900 sm:text-[11px]"
      : hideMetricLabels
        ? valueClsRankingCompact
        : valueCls;
  const iconCls = dense ? "h-3 w-3 shrink-0" : "h-3.5 w-3.5 shrink-0";
  const deltaCls = dense ? "text-[9px] leading-none" : "text-[11px] leading-none";

  const labelRevenue = hideMetricLabels ? (
    <span className="sr-only">{t("stats.revenue")}</span>
  ) : (
    t("stats.revenue")
  );
  const labelViews = hideMetricLabels ? (
    <span className="sr-only">{t("stats.views")}</span>
  ) : (
    t("stats.views")
  );
  const labelLikes = hideMetricLabels ? (
    <span className="sr-only">{t("stats.likes")}</span>
  ) : (
    t("stats.likes")
  );

  return (
    <div
      className={`${hideMetricLabels ? "w-full min-w-0" : "w-fit"} ${
        dense
          ? "bg-transparent px-2 py-1 [html[data-theme='light']_&]:bg-transparent"
          : "px-3 py-2 [html[data-theme='light']_&]:bg-white sm:px-4"
      }`}
    >
      <ul className={`m-0 list-none p-0 ${hideMetricLabels ? "w-full min-w-0 leading-snug" : "leading-snug"}`}>
        <li key="revenue" className={metricRowCls}>
          <div className={`${labelColCls} ${labelTone}`}>
            <TrendingUp className={iconCls} aria-hidden />
            {labelRevenue}
            <span
              className={`${revenueTrendDeltaGlyphClass} ${deltaCls} ${isUp ? revenueTrendUpClass : revenueTrendDownClass}`}
              aria-hidden
            >
              {isUp ? "▲" : "▼"}
            </span>
          </div>
          <div
            className={`min-w-0 font-extrabold tabular-nums ${metricValueSize} ${valueDdExtras} ${revenueAmountClass}`}
          >
            {revenueDisplay}
          </div>
        </li>
        <li key="views" className={metricRowCls}>
          <div className={`${labelColCls} ${labelTone}`}>
            <Eye className={iconCls} aria-hidden />
            {labelViews}
          </div>
          <div className={`${neutralMetricValueCls} min-w-0 ${valueDdExtras}`}>
            {viewsDisplay}
          </div>
        </li>
        <li key="likes" className={metricRowCls}>
          <div className={`${labelColCls} ${labelTone}`}>
            <Heart className={iconCls} aria-hidden />
            {labelLikes}
          </div>
          <div className={`${neutralMetricValueCls} min-w-0 ${valueDdExtras}`}>
            {likesDisplay}
          </div>
        </li>
        {typeof salesCount === "number" ? (
          <li key="purchases" className={rowCls}>
            <div className={`${labelCls} inline-flex items-center gap-1.5`}>
              <ShoppingBag className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {t("stats.purchases")}
            </div>
            <div className={valueCls}>
              {t("stats.buyersCount", {
                n: salesCount.toLocaleString(fmt.numberLocale),
              })}
            </div>
          </li>
        ) : null}
        {stockRow ? (
          <li key="stock" className={rowCls}>
            <div className={labelCls}>{t("stats.remaining")}</div>
            <div className={valueCls}>
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
            </div>
          </li>
        ) : null}
      </ul>
    </div>
  );
}
