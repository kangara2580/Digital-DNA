"use client";

/** 막대가 그려지는 영역(px). flex % 높이 버그 회피용 고정값 */
const BAR_AREA_PX = 120;
const LABEL_ROW_PX = 28;

function barWidthClass(count: number): string {
  if (count <= 7) return "w-2.5 sm:w-3";
  if (count <= 12) return "w-2 sm:w-2.5";
  return "w-1.5 sm:w-2";
}

export function RevenueBarChart({
  data,
  formatTooltip,
  ariaLabel,
  emptyLabel,
  className = "",
  barClassName = "bg-reels-crimson/70 [html[data-theme='light']_&]:bg-reels-crimson/85",
}: {
  data: { label: string; revenueWon: number }[];
  formatTooltip: (gems: number) => string;
  ariaLabel: string;
  emptyLabel: string;
  className?: string;
  barClassName?: string;
}) {
  const chartHeight = BAR_AREA_PX + LABEL_ROW_PX;
  const max = Math.max(...data.map((d) => d.revenueWon), 1);
  const hasBars = data.some((d) => d.revenueWon > 0);
  const widthClass = barWidthClass(data.length);

  if (data.length === 0 || !hasBars) {
    return (
      <p
        className={`mt-4 flex w-full items-center justify-center text-[13px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600 ${className}`}
        style={{ height: chartHeight }}
      >
        {emptyLabel}
      </p>
    );
  }

  return (
    <div className={`mt-4 w-full ${className}`} style={{ height: chartHeight }}>
      <div
        className="flex h-full w-full items-end gap-0.5 sm:gap-1"
        role="img"
        aria-label={ariaLabel}
      >
        {data.map((d) => {
          const barPx = Math.max(4, Math.round((d.revenueWon / max) * BAR_AREA_PX));
          const tip = `${d.label} · ${formatTooltip(d.revenueWon)}`;
          return (
            <div
              key={d.label}
              className="flex min-w-0 flex-1 flex-col items-stretch justify-end"
              style={{ height: chartHeight }}
            >
              <div
                className="flex w-full flex-1 items-end justify-center border-b border-zinc-200/80 pb-px [html[data-theme='light']_&]:border-zinc-200"
                style={{ maxHeight: BAR_AREA_PX }}
              >
                <div
                  className={`${widthClass} shrink-0 rounded-t-sm ${barClassName}`}
                  style={{ height: barPx }}
                  title={tip}
                  aria-label={tip}
                />
              </div>
              <span
                className="mt-1 w-full px-0.5 text-center text-[10px] font-medium leading-tight text-zinc-500 [html[data-theme='light']_&]:text-zinc-600 sm:text-[11px]"
                title={d.label}
              >
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
