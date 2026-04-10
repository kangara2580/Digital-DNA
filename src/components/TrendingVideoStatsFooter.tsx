import type { TrendingRankMetrics } from "@/data/trendingStats";

/** 누적수익 — 한눈에 읽히도록 큰 자릿수·콤마 표기(전광판 박스 대신) */
function RevenueHighlight({ won }: { won: number }) {
  const formatted = Math.max(0, Math.floor(won)).toLocaleString("ko-KR");
  return (
    <p
      className="text-right font-mono text-[15px] font-extrabold leading-none tabular-nums tracking-tight text-violet-300 [text-shadow:0_0_24px_rgba(139,92,246,0.35)] sm:text-[16px] [html[data-theme='light']_&]:text-violet-700 [html[data-theme='light']_&]:[text-shadow:none]"
      aria-label={`누적수익 ${formatted}원`}
    >
      {formatted}
      <span className="ml-0.5 text-[13px] font-bold text-violet-400/90 sm:text-[14px] [html[data-theme='light']_&]:text-violet-600">
        원
      </span>
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
  salePriceWon: number | undefined;
};

const rowCls =
  "flex items-center justify-between gap-3 border-b border-white/10 py-2.5 last:border-b-0 last:pb-0 [html[data-theme='light']_&]:border-zinc-200/80";

const labelCls =
  "shrink-0 text-[13px] font-semibold leading-snug text-zinc-300 [html[data-theme='light']_&]:text-zinc-700 sm:text-[14px]";

const valueCls =
  "min-w-0 text-right text-[14px] font-bold leading-snug tabular-nums text-zinc-100 [html[data-theme='light']_&]:text-zinc-900 sm:text-[15px]";

const priceValueCls =
  "min-w-0 text-right text-[14px] font-bold leading-snug tabular-nums text-reels-cyan [html[data-theme='light']_&]:text-[#6d28d9] sm:text-[15px]";

export function TrendingVideoStatsFooter({ metrics, salePriceWon }: Props) {
  const g = metrics.growthPercent;
  const up = g > 0;
  const down = g < 0;
  const flat = g === 0;

  return (
    <div className="border-t border-white/10 bg-black/30 px-3 py-2 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white sm:px-3.5 sm:py-2.5">
      <dl className="space-y-0 leading-snug">
        <div className={`${rowCls} items-start gap-2 sm:items-center`}>
          <dt className={labelCls}>누적수익</dt>
          <dd className="min-w-0 flex-1">
            <RevenueHighlight won={metrics.cumulativeRevenueWon} />
          </dd>
        </div>
        <div className={rowCls}>
          <dt className={labelCls}>판매가격</dt>
          <dd className={priceValueCls}>
            {salePriceWon != null && salePriceWon > 0
              ? `${salePriceWon.toLocaleString("ko-KR")}원`
              : "—"}
          </dd>
        </div>
        <div className={rowCls}>
          <dt className={labelCls}>총 조회수</dt>
          <dd className={valueCls}>{formatCountCompact(metrics.totalViews)}</dd>
        </div>
        <div className={rowCls}>
          <dt className={labelCls}>총 좋아요</dt>
          <dd className={valueCls}>{formatCountCompact(metrics.totalLikes)}</dd>
        </div>
        <div className={`${rowCls} border-b-0`}>
          <dt className={labelCls}>성장률</dt>
          <dd className="flex min-w-0 items-center justify-end gap-1 text-[14px] font-extrabold tabular-nums sm:text-[15px]">
            {flat ? (
              <span className="text-zinc-500 [html[data-theme='light']_&]:text-zinc-500">
                —
              </span>
            ) : up ? (
              <span className="inline-flex items-center gap-1 text-emerald-400 [html[data-theme='light']_&]:text-emerald-600">
                <span className="text-[16px] leading-none sm:text-[17px]" aria-hidden>
                  ▲
                </span>
                {Math.abs(g)}% 상승
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-rose-400 [html[data-theme='light']_&]:text-rose-600">
                <span className="text-[16px] leading-none sm:text-[17px]" aria-hidden>
                  ▼
                </span>
                {Math.abs(g)}% 하락
              </span>
            )}
          </dd>
        </div>
      </dl>
    </div>
  );
}
