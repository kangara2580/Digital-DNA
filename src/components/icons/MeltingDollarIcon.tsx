/**
 * 조각 사치 섹션 — 인기/실패 아이콘과 동일 원·슬레이트 톤,
 * $ 아래가 🫠처럼 녹아 떨어지는 실루엣 + globals.css 드립 모션.
 */
export function MeltingDollarIcon({ className }: { className?: string }) {
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
      <g
        className="text-slate-800"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* 세로선은 녹은 덩어리와 겹치도록 살짝 짧게 */}
        <line x1="12" x2="12" y1="3.5" y2="18.55" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </g>
      <g
        className="melt-dollar-anim fill-slate-800"
        style={{ transformOrigin: "12px 19.8px" }}
      >
        {/* 발밑에 붙은 녹은 풀 */}
        <path d="M9.85 18.55c.38-.55 1.05-.82 2.15-.85 1.1-.03 1.82.25 2.22.78.28.36.34.82.16 1.28-.24.58-.92 1.02-1.78 1.15-.52.08-1.05.02-1.52-.18-.62-.25-1.08-.7-1.28-1.22-.18-.45-.14-.92.12-1.28.2-.3.52-.52.93-.68z" />
        {/* 좌·우로 떨어지는 방울 */}
        <path d="M8.35 20.45c.24-.32.65-.48 1.08-.4.4.08.72.38.88.75.18.42.05.9-.32 1.18-.25.2-.58.26-.9.18-.38-.1-.68-.4-.82-.78-.14-.38-.05-.78.28-1.05.12-.1.26-.17.42-.2z" />
        <path d="M14.58 20.5c.26-.34.72-.5 1.15-.4.38.08.68.38.82.78.14.42.02.88-.35 1.12-.25.18-.58.22-.88.14-.42-.12-.75-.48-.85-.92-.08-.4.05-.78.35-1.05.18-.18.4-.28.66-.3z" />
        {/* 맺힌 큰 방울 */}
        <ellipse cx="12" cy="22.2" rx="1.15" ry="1.42" />
      </g>
    </svg>
  );
}
