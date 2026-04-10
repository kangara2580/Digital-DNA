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
