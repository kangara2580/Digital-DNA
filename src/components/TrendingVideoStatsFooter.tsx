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
  "flex items-center justify-between gap-3 border-b border-white/10 py-2.5 last:border-b-0 last:pb-0 [html[data-theme='light']_&]:border-zinc-200/80";

const labelCls =
  "shrink-0 text-[13px] font-semibold leading-snug tracking-tight text-zinc-200 [html[data-theme='light']_&]:text-zinc-700 sm:text-[14px]";

const valueCls =
  "min-w-0 text-right text-[14px] font-extrabold leading-snug tabular-nums tracking-tight text-[#EAF1FF] [html[data-theme='light']_&]:text-zinc-900 sm:text-[15px]";

export function TrendingVideoStatsFooter({
  metrics,
  salesCount,
  stockRow,
}: Props) {
  const isUp = metrics.growthPercent >= 0;
  const hasExtendedRows = typeof salesCount === "number" || Boolean(stockRow);

  return (
    <div
      className={`border-t border-white/10 bg-[linear-gradient(180deg,rgba(8,14,30,0.88)_0%,rgba(4,9,22,0.94)_100%)] px-3 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white sm:px-3.5 ${
        hasExtendedRows ? "py-2 sm:py-2.5" : "pb-1 pt-2 sm:pb-1 sm:pt-2.5"
      }`}
    >
      <dl className="space-y-0 leading-snug">
        <div className={`${rowCls} items-start gap-2 sm:items-center`}>
          <dt className={`inline-flex items-center gap-1.5 ${labelCls}`}>
            <span>수익</span>
            <span
              className={`text-[15px] leading-none sm:text-[16px] ${
                isUp
                  ? "text-[#FF3B57] [text-shadow:0_0_10px_rgba(255,59,87,0.55)]"
                  : "text-[#2FA2FF] [text-shadow:0_0_10px_rgba(47,162,255,0.55)]"
              } [html[data-theme='light']_&]:[text-shadow:none]`}
              aria-hidden
            >
              {isUp ? "▲" : "▼"}
            </span>
          </dt>
          <dd className="min-w-0 flex-1">
            <RevenueHighlight won={metrics.cumulativeRevenueWon} />
          </dd>
        </div>
        <div className={rowCls}>
          <dt className={labelCls}>조회수</dt>
          <dd className={valueCls}>{formatCountCompact(metrics.totalViews)}</dd>
        </div>
        <div className={rowCls}>
          <dt className={labelCls}>좋아요</dt>
          <dd className={valueCls}>{formatCountCompact(metrics.totalLikes)}</dd>
        </div>
        {typeof salesCount === "number" ? (
          <div className={rowCls}>
            <dt className={labelCls}>누적 구매 인원</dt>
            <dd className={valueCls}>
              {salesCount.toLocaleString("ko-KR")}명
            </dd>
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
                  {stockRow.remaining != null
                    ? `${stockRow.remaining.toLocaleString("ko-KR")}개`
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
