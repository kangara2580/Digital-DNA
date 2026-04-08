import type { TrendingRankMetrics } from "@/data/trendingStats";

/** 전광판용 — 최소 자릿수까지 앞을 0으로 패딩 후 콤마 */
function formatWonLedDigits(won: number, minDigits = 7): string {
  const n = Math.max(0, Math.floor(won));
  let digits = n.toString();
  if (digits.length < minDigits) {
    digits = "0".repeat(minDigits - digits.length) + digits;
  }
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function RevenueLedBoard({ won }: { won: number }) {
  const str = formatWonLedDigits(won);
  return (
    <div
      className="flex max-w-full flex-nowrap justify-end gap-[2px] overflow-x-auto sm:gap-0.5"
      aria-label={`누적수익 ${won.toLocaleString("ko-KR")}원`}
    >
      {str.split("").map((ch, i) =>
        ch === "," ? (
          <span
            key={`c-${i}`}
            className="self-end px-[1px] pb-0.5 text-[6px] font-bold text-emerald-700/75 [html[data-theme='light']_&]:text-violet-700 sm:text-[7px]"
            aria-hidden
          >
            ,
          </span>
        ) : (
          <span
            key={`d-${i}`}
            className="flex h-[14px] min-w-[10px] items-center justify-center rounded-[3px] border border-emerald-950/90 bg-[#020807] px-[2px] font-mono text-[8px] font-extrabold tabular-nums text-emerald-400 shadow-[inset_0_1px_0_rgba(0,242,234,0.12),0_0_6px_rgba(0,242,234,0.22)] [html[data-theme='light']_&]:border-violet-300 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-violet-700 [html[data-theme='light']_&]:shadow-[inset_0_1px_0_rgba(155,109,255,0.2),0_0_8px_rgba(155,109,255,0.22)] sm:h-[15px] sm:min-w-[11px] sm:text-[9px]"
          >
            {ch}
          </span>
        ),
      )}
      <span className="ml-0.5 self-center text-[7px] font-bold text-emerald-500/80 [html[data-theme='light']_&]:text-violet-700 sm:text-[8px]">
        원
      </span>
    </div>
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
  "flex items-baseline justify-between gap-2 border-b border-white/[0.06] py-1 last:border-b-0 last:pb-0";

export function TrendingVideoStatsFooter({ metrics, salePriceWon }: Props) {
  const g = metrics.growthPercent;
  const up = g > 0;
  const down = g < 0;
  const flat = g === 0;

  return (
    <div className="border-t border-white/[0.06] bg-black/25 px-1.5 py-1.5 [html[data-theme='light']_&]:border-black/10 [html[data-theme='light']_&]:bg-white/88 sm:px-2 sm:py-2">
      <dl className="space-y-0 text-[9px] leading-tight sm:text-[10px]">
        <div className={`${rowCls} items-center`}>
          <dt className="shrink-0 font-medium text-zinc-500 [html[data-theme='light']_&]:text-[#5a3e7f]">누적수익</dt>
          <dd className="min-w-0 flex-1">
            <RevenueLedBoard won={metrics.cumulativeRevenueWon} />
          </dd>
        </div>
        <div className={rowCls}>
          <dt className="shrink-0 font-medium text-zinc-500 [html[data-theme='light']_&]:text-[#5a3e7f]">판매가격</dt>
          <dd className="min-w-0 text-right font-semibold tabular-nums text-reels-cyan/90 [html[data-theme='light']_&]:text-[#7b4fff]">
            {salePriceWon != null && salePriceWon > 0
              ? `${salePriceWon.toLocaleString("ko-KR")}원`
              : "—"}
          </dd>
        </div>
        <div className={rowCls}>
          <dt className="shrink-0 font-medium text-zinc-500 [html[data-theme='light']_&]:text-[#5a3e7f]">총 조회수</dt>
          <dd className="min-w-0 text-right font-semibold tabular-nums text-zinc-300 [html[data-theme='light']_&]:text-[#2f1b4f]">
            {formatCountCompact(metrics.totalViews)}
          </dd>
        </div>
        <div className={rowCls}>
          <dt className="shrink-0 font-medium text-zinc-500 [html[data-theme='light']_&]:text-[#5a3e7f]">총 좋아요</dt>
          <dd className="min-w-0 text-right font-semibold tabular-nums text-zinc-300 [html[data-theme='light']_&]:text-[#2f1b4f]">
            {formatCountCompact(metrics.totalLikes)}
          </dd>
        </div>
        <div className={`${rowCls} border-b-0`}>
          <dt className="shrink-0 font-medium text-zinc-500 [html[data-theme='light']_&]:text-[#5a3e7f]">성장률</dt>
          <dd className="flex min-w-0 items-center justify-end gap-0.5 font-bold tabular-nums">
            {flat ? (
              <span className="text-zinc-500 [html[data-theme='light']_&]:text-[#5a3e7f]">—</span>
            ) : up ? (
              <span className="inline-flex items-center gap-0.5 text-emerald-400/95 [html[data-theme='light']_&]:text-emerald-600">
                <span className="text-[10px] sm:text-[11px]" aria-hidden>
                  ▲
                </span>
                {Math.abs(g)}% 상승
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 text-rose-400/95 [html[data-theme='light']_&]:text-rose-600">
                <span className="text-[10px] sm:text-[11px]" aria-hidden>
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
