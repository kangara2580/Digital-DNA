/** 섹션 제목용 장식 아이콘 — 스크린리더는 h2 텍스트만 읽도록 aria-hidden */

function TrendingCircle() {
  return (
    <circle
      cx="12"
      cy="12"
      r="9.25"
      className="stroke-slate-300"
      strokeWidth="1.35"
      fill="rgb(241 245 249)"
    />
  );
}

function TrendingPlayGlyph() {
  return (
    <>
      <TrendingCircle />
      <path
        d="M10.2 8.35c0-.45.48-.73.87-.5l5.1 3.15c.4.25.4.85 0 1.1l-5.1 3.15a.55.55 0 0 1-.87-.5V8.35Z"
        className="fill-slate-800"
      />
    </>
  );
}

export function TrendingPlayIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <TrendingPlayGlyph />
    </svg>
  );
}

/**
 * 인기 섹션과 같은 원·슬레이트 톤 — 재생 끝이 깨져 조각이 떨어지고, 얇은 균열이 겹침.
 */
export function OopsPlayIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <TrendingCircle />
      {/* 본체: 끝이 깨져 들쭉날쭉한 ▶ */}
      <path
        d="M10.2 8.35L10.2 15.65 12.95 14.1 13.55 12.45 13.1 11.95 13.45 10.25z"
        className="fill-slate-800"
      />
      {/* 원래 끝에 붙어 있던 조각 — 살짝 떨어짐 */}
      <path
        d="M14.85 10.95l1.53 1.1-1.58 1.23z"
        className="fill-slate-800"
        transform="translate(0.62 0.38) rotate(19 15.45 12.05)"
      />
      {/* 유리 깨짐 느낌 — ▶·원 위로 얇은 균열 */}
      <path
        d="M15.1 5.9l-1.35 4.05-.45.55-1.1 3.2.35.65-1.55 4.35"
        className="stroke-slate-400"
        strokeWidth="1.15"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity={0.92}
      />
    </svg>
  );
}
