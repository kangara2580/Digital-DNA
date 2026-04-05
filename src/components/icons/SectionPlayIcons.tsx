/** 섹션 제목용 장식 아이콘 — 스크린리더는 h2 텍스트만 읽도록 aria-hidden */

export function TrendingPlayIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <circle
        cx="12"
        cy="12"
        r="9.25"
        className="stroke-slate-300"
        strokeWidth="1.35"
        fill="rgb(241 245 249)"
      />
      <path
        d="M10.2 8.35c0-.45.48-.73.87-.5l5.1 3.15c.4.25.4.85 0 1.1l-5.1 3.15a.55.55 0 0 1-.87-.5V8.35Z"
        className="fill-slate-800"
      />
    </svg>
  );
}

/** 일반 ▶가 아닌 ‘살짝 망가진’ 재생 — 실패/실수 코너 톤 */
export function OopsPlayIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <g transform="translate(12 11.5) skewX(-5) scale(1 0.9) translate(-12 -11.5)">
        <rect
          x="4.5"
          y="6"
          width="15"
          height="12"
          rx="3"
          fill="rgb(248 250 252)"
          stroke="#0f172a"
          strokeWidth="1.35"
          strokeLinejoin="round"
        />
        <path
          d="M7 5.8l1.15 4.25-.95 1.45 1.25 4.85"
          stroke="#0f172a"
          strokeWidth="1.15"
          strokeLinecap="round"
          fill="none"
        />
      </g>
      <path
        d="M13.5 9.5l-.08 5.4 4.05-2.55-3.97-2.85Z"
        className="fill-slate-800"
        transform="rotate(7 14 12.2)"
      />
    </svg>
  );
}
