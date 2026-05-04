import { Eye, Heart, ShoppingBag, TrendingUp } from "lucide-react";
import type { TrendingRankMetrics } from "@/data/trendingStats";
import {
  revenueAmountClass,
  revenueTrendDownClass,
  revenueTrendUpClass,
} from "@/lib/revenueDisplayTokens";

function formatCountCompact(n: number): string {
  if (n >= 100_000_000) {
    const v = n / 100_000_000;
    return `${v >= 10 ? Math.round(v) : v.toFixed(1)}억`;
  }
  if (n >= 10_000) {
    const v = n / 10_000;
    return `${v >= 100 ? Math.round(v) : v.toFixed(1)}만`;
  }
  if (n >= 1000) {
    const v = n / 1000;
    return `${v >= 10 ? Math.round(v) : v.toFixed(1)}천`;
  }
  return n.toLocaleString("ko-KR");
}

type Props = {
  metrics: TrendingRankMetrics;
  /** 상세 등에서만 — 누적 구매 인원 행 */
  salesCount?: number;
  /** 오픈 에디션이 아닐 때 남은 수량 행 */
  stockRow?: { remaining: number | null; soldOut: boolean } | null;
  /** 메인 인기순위 카드 등 — 수익·조회수·좋아요 표기 글자만 숨김(아이콘·수치·▲▼ 유지) */
  hideMetricLabels?: boolean;
};

const rowCls =
  "flex items-center gap-8 py-1.5";

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
            {hideMetricLabels ? (
              <span className="sr-only">수익</span>
            ) : (
              "수익"
            )}
            <span
              className={`text-[11px] leading-none ${isUp ? revenueTrendUpClass : revenueTrendDownClass}`}
              aria-hidden
            >
              {isUp ? "▲" : "▼"}
            </span>
          </dt>
          <dd
            className={`min-w-0 font-extrabold tabular-nums ${metricValueSize} ${valueDdExtras} ${revenueAmountClass}`}
          >
            {Math.max(0, Math.floor(metrics.cumulativeRevenueWon)).toLocaleString("ko-KR")}
          </dd>
        </div>
        <div className={metricRowCls}>
          <dt className={`${labelColCls} ${labelTone}`}>
            <Eye className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {hideMetricLabels ? (
              <span className="sr-only">조회수</span>
            ) : (
              "조회수"
            )}
          </dt>
          <dd className={`${neutralMetricValueCls} min-w-0 ${valueDdExtras}`}>
            {formatCountCompact(metrics.totalViews)}
          </dd>
        </div>
        <div className={metricRowCls}>
          <dt className={`${labelColCls} ${labelTone}`}>
            <Heart className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {hideMetricLabels ? (
              <span className="sr-only">좋아요</span>
            ) : (
              "좋아요"
            )}
          </dt>
          <dd className={`${neutralMetricValueCls} min-w-0 ${valueDdExtras}`}>{formatCountCompact(metrics.totalLikes)}</dd>
        </div>
        {typeof salesCount === "number" ? (
          <div className={rowCls}>
            <dt className={`${labelCls} inline-flex items-center gap-1.5`}>
              <ShoppingBag className="h-3.5 w-3.5 shrink-0" aria-hidden />
              구매
            </dt>
            <dd className={valueCls}>{salesCount.toLocaleString("ko-KR")}명</dd>
          </div>
        ) : null}
        {stockRow ? (
          <div className={rowCls}>
            <dt className={labelCls}>남은 수량</dt>
            <dd className={valueCls}>
              {stockRow.soldOut ? (
                <span className="text-reels-crimson">0개 — 품절</span>
              ) : (
                <span className="text-reels-cyan">
                  {stockRow.remaining != null ? `${stockRow.remaining.toLocaleString("ko-KR")}개` : "—"}
                </span>
              )}
            </dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}
