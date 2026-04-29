import { Eye, Heart, ShoppingBag, TrendingUp } from "lucide-react";
import type { TrendingRankMetrics } from "@/data/trendingStats";

/** 누적수익 — 한눈에 읽히도록 큰 자릿수·콤마 표기(전광판 박스 대신) */
function RevenueHighlight({ won }: { won: number }) {
  const formatted = Math.max(0, Math.floor(won)).toLocaleString("ko-KR");
  return (
    <p
      className="text-right font-mono text-[15px] font-extrabold leading-none tabular-nums tracking-tight text-[#B9CCFF] sm:text-[16px] [html[data-theme='light']_&]:text-[#2F4FA8]"
      aria-label={`수익 ${formatted}`}
    >
      {formatted}
    </p>
  );
}

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
};

const rowCls =
  "flex items-center gap-8 py-1.5";

const labelCls =
  "w-[4.5rem] shrink-0 text-[14px] font-medium leading-snug text-zinc-400 [html[data-theme='light']_&]:text-zinc-500";

const valueCls =
  "text-[15px] font-extrabold leading-snug tabular-nums tracking-tight text-[#EAF1FF] [html[data-theme='light']_&]:text-zinc-900";

export function TrendingVideoStatsFooter({
  metrics,
  salesCount,
  stockRow,
}: Props) {
  const isUp = metrics.growthPercent >= 0;
  const hasExtendedRows = typeof salesCount === "number" || Boolean(stockRow);

  return (
    <div className="w-fit px-3 py-2 [html[data-theme='light']_&]:bg-white sm:px-4">
      <dl className="leading-snug">
        <div className={rowCls}>
          <dt className={`inline-flex shrink-0 w-[4.5rem] items-center gap-1.5 text-[14px] font-medium leading-snug text-zinc-400 [html[data-theme='light']_&]:text-zinc-500`}>
            <TrendingUp className="h-3.5 w-3.5 shrink-0" aria-hidden />
            수익
            <span
              className={`text-[11px] leading-none ${isUp ? "text-[#FF3B57]" : "text-[#2FA2FF]"}`}
              aria-hidden
            >
              {isUp ? "▲" : "▼"}
            </span>
          </dt>
          <dd className="text-[15px] font-extrabold tabular-nums text-[#B9CCFF] [html[data-theme='light']_&]:text-[#2F4FA8]" style={{minWidth:0}}>
            {Math.max(0, Math.floor(metrics.cumulativeRevenueWon)).toLocaleString("ko-KR")}
          </dd>
        </div>
        <div className={rowCls}>
          <dt className={`${labelCls} inline-flex items-center gap-1.5`}>
            <Eye className="h-3.5 w-3.5 shrink-0" aria-hidden />
            조회수
          </dt>
          <dd className={valueCls}>{formatCountCompact(metrics.totalViews)}</dd>
        </div>
        <div className={rowCls}>
          <dt className={`${labelCls} inline-flex items-center gap-1.5`}>
            <Heart className="h-3.5 w-3.5 shrink-0" aria-hidden />
            좋아요
          </dt>
          <dd className={valueCls}>{formatCountCompact(metrics.totalLikes)}</dd>
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
