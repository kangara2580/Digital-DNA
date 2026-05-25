/**
 * 결제 캡슐용 다이아몬드 — 브릴리언트 컷(약간 납작한 비율).
 * crown top y=5.5 / girdle y=10 / culet y=19.5 → 세로 짧고 가로 넓은 납작 형태.
 */
export function PaymentDiamondIcon({
  className,
  "aria-hidden": ariaHidden = true,
}: {
  className?: string;
  "aria-hidden"?: boolean;
}) {
  const sw = 1.6;
  const topL = { x: 8.5, y: 5.5 };
  const topR = { x: 15.5, y: 5.5 };
  const girdleL = { x: 4.5, y: 10 };
  const girdleM = { x: 12, y: 10 };
  const girdleR = { x: 19.5, y: 10 };
  const culet = { x: 12, y: 19.5 };

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden={ariaHidden}
    >
      <path
        d={`M${girdleL.x} ${girdleL.y} L${topL.x} ${topL.y} H${topR.x} L${girdleR.x} ${girdleR.y} L${culet.x} ${culet.y} Z`}
        stroke="currentColor"
        strokeWidth={sw}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <line
        x1={girdleL.x}
        y1={girdleL.y}
        x2={girdleR.x}
        y2={girdleR.y}
        stroke="currentColor"
        strokeWidth={sw}
        strokeLinecap="round"
      />
      <line
        x1={topL.x}
        y1={topL.y}
        x2={girdleM.x}
        y2={girdleM.y}
        stroke="currentColor"
        strokeWidth={sw}
        strokeLinecap="round"
      />
      <line
        x1={topR.x}
        y1={topR.y}
        x2={girdleM.x}
        y2={girdleM.y}
        stroke="currentColor"
        strokeWidth={sw}
        strokeLinecap="round"
      />
      <line
        x1={girdleL.x}
        y1={girdleL.y}
        x2={culet.x}
        y2={culet.y}
        stroke="currentColor"
        strokeWidth={sw}
        strokeLinecap="round"
      />
      <line
        x1={girdleR.x}
        y1={girdleR.y}
        x2={culet.x}
        y2={culet.y}
        stroke="currentColor"
        strokeWidth={sw}
        strokeLinecap="round"
      />
      <line
        x1={girdleM.x}
        y1={girdleM.y}
        x2={culet.x}
        y2={culet.y}
        stroke="currentColor"
        strokeWidth={sw}
        strokeLinecap="round"
      />
    </svg>
  );
}

const GEM_EMOJI_RE = /\s*💎\s*/g;

export function stripGemEmoji(text: string): string {
  return text.replace(GEM_EMOJI_RE, "").trim();
}

/** 숫자·포맷 문자열 + 핑크 SVG 보석 (💎 이모지 대체) */
export function GemAmount({
  value,
  className,
  amountClassName,
  iconClassName = "h-3.5 w-3.5 shrink-0 text-[color:var(--reels-point)]",
}: {
  value: string | number;
  className?: string;
  amountClassName?: string;
  iconClassName?: string;
}) {
  const amountText =
    typeof value === "number" ? value.toLocaleString() : stripGemEmoji(value);

  return (
    <span className={`inline-flex items-center gap-0.5 align-middle ${className ?? ""}`}>
      <span className={amountClassName}>{amountText}</span>
      <PaymentDiamondIcon className={iconClassName} />
    </span>
  );
}
