/**
 * 추천 영상 — U자 자석(위가 벌어진 말굽), 슬레이트 그레이 + 동일 원형 배경.
 */
export function RecommendMagnetIcon({ className }: { className?: string }) {
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
      {/*
        U자 자석을 (12,12) 원의 시각 중심에 맞춤 — 위·아래 여백이 비슷하도록 약간 하강.
      */}
      <g transform="translate(0 1.05)">
        <path
          d="M6.35 5.25L9.7 5.25 9.7 12.4Q12 14.85 14.3 12.4L14.3 5.25 17.65 5.25 17.65 12.85 Q12 20.5 6.35 12.85Z"
          className="fill-slate-500"
        />
        <path
          d="M6.35 5.25L9.7 5.25 9.7 12.4Q12 14.85 14.3 12.4L14.3 5.25 17.65 5.25 17.65 12.85 Q12 20.5 6.35 12.85Z"
          className="stroke-slate-600/85"
          strokeWidth="0.75"
          fill="none"
        />
        <path
          d="M7.75 6.15h1.35v2.15H7.75V6.15zm7.25 0h1.35v2.15H15V6.15z"
          className="fill-slate-300/90"
        />
      </g>
    </svg>
  );
}
