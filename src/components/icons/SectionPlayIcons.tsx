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
 * 산산조각 난 ▶ — 큰 파편 + 헤어라인 균열 + 칩 엣지 + 끝 파편 분리.
 * (외곽은 여전히 재생 삼각형으로 읽힘)
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
      <g className="fill-slate-800">
        {/* 좌상 파편 — 들쭉날쭉한 윤곽 */}
        <path d="M10.05 8.25l-.12 1.05.22 1.1-.18.95.08 1.15 1.35-.42 1.05-.88-.32-1.02-.95-.38-.42-1.05.18-.95-.08-.75z" />
        {/* 좌하 */}
        <path d="M9.95 12.45l-.08 1.25.15 1.55.28 1.35 1.48-.22 1.62-.72.38-.62-.72-1.05-1.18-.48-.55.35-.92-.2-.54z" />
        {/* 중앙 덩어리 — 살짝 비틀어진 덩어리 */}
        <path d="M11.55 10.15l1.85.55 1.25.95.32 1.05-.42 1.12-1.55.62-1.35-.18-.82-1.15.12-1.35.6-.88z" />
        {/* 우상·우측 면 */}
        <path d="M13.65 9.85l1.95.72 1.15.88.48.75-.28.92-1.42.35-1.28-.55-.85-.95-.08-1.12z" />
        {/* 끝 — 분리된 칩 */}
        <path
          d="M14.95 11.55l1.65 1.05.35.72-.48.88-1.35.42-.72-.95.35-1.12z"
          transform="translate(0.52 0.22) rotate(11 15.6 12.05)"
        />
        {/* 미세 칩 */}
        <path
          d="M10.85 14.95l.62.38.28.72-.35.48-.78-.15-.15-.95.38-.48z"
          opacity={0.88}
        />
      </g>
      {/* 밝은 헤어라인 — 깊은 균열 */}
      <g
        className="stroke-slate-100/95"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.95}
      >
        <path d="M10.35 9.05l.95 1.45-.22 1.18.62 1.35" strokeWidth="0.42" />
        <path d="M11.25 11.35l1.55.28 1.25-.12" strokeWidth="0.36" />
        <path d="M10.65 13.85l1.85-.22 1.45.52" strokeWidth="0.38" />
        <path d="M12.55 10.55l.52 2.05 1.35 1.15" strokeWidth="0.34" />
        <path d="M11.95 9.25l2.15 2.25 1.48.58" strokeWidth="0.32" />
        <path d="M13.15 13.05l1.42-.48 1.08.42" strokeWidth="0.36" />
        <path d="M10.55 11.05l2.35.65 2.05-.25" strokeWidth="0.3" />
        <path d="M12.05 14.45l1.25-1.85 1.55.35" strokeWidth="0.28" />
      </g>
      {/* 보조 어두운 균열선 */}
      <g
        className="stroke-slate-600/55"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.7}
      >
        <path d="M10.15 10.65l1.05.42.88 1.22" strokeWidth="0.22" />
        <path d="M12.85 12.05l.88 1.42.62 1.12" strokeWidth="0.2" />
        <path d="M11.55 14.35l1.95-.55" strokeWidth="0.22" />
        <path d="M13.45 10.95l.75 1.65" strokeWidth="0.2" />
      </g>
      {/* 중심이 꺼진 듯한 그림자 */}
      <ellipse
        cx="12.5"
        cy="12.1"
        rx="1.45"
        ry="1.1"
        className="fill-slate-950/30"
        transform="rotate(-14 12.5 12.1)"
      />
    </svg>
  );
}
