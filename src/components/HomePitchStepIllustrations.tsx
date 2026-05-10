/**
 * 홈「3단계」— 배경·테두리 없이 120×120 SVG 중앙 정렬.
 */
const P = "var(--reels-point)";

const wrap = "flex h-[200px] w-full items-center justify-center px-2";

type FigProps = { "aria-label": string };

/**
 * 1) 영상 선택: Lucide `mouse-pointer-click` 경로 그대로(24×24 뷰박스 → 렌더만 다른 단계보다 살짝 작게).
 * 막대 4개만 브랜드 핑크, 커터 실루엣은 currentColor(다크 화이트 / 라이트 zinc-900).
 * @see https://github.com/lucide-icons/lucide/blob/main/icons/mouse-pointer-click.svg (ISC)
 */
export function PitchIllustUserBrowse(fig: FigProps) {
  const rayStroke = 2;
  /** 다른 피치 일러스트(120)보다 작게 — 추가로 10px 축소 */
  const svgPx = 94;

  return (
    <div className={wrap} role="img" aria-label={fig["aria-label"]}>
      <svg
        width={svgPx}
        height={svgPx}
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
        fill="none"
        className="text-white [html[data-theme='light']_&]:text-zinc-900"
      >
        <path
          d="M14 4.1 12 6"
          stroke={P}
          strokeWidth={rayStroke}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="m5.1 8-2.9-.8"
          stroke={P}
          strokeWidth={rayStroke}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="m6 12-1.9 2"
          stroke={P}
          strokeWidth={rayStroke}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M7.2 2.2 8 5.1"
          stroke={P}
          strokeWidth={rayStroke}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9.037 9.69a.498.498 0 0 1 .653-.653l11 4.5a.5.5 0 0 1-.074.949l-4.349 1.041a1 1 0 0 0-.74.739l-1.04 4.35a.5.5 0 0 1-.95.074z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
}

/** 2) 커스터마이징: 레퍼런스와 동일 구도 — 대각 연필(캡·몸통·삼각 니브) + 펜촉 왼쪽 핑크 낙서 */
export function PitchIllustUserCustomize(fig: FigProps) {
  const tipX = 71.75;
  const tipY = 68.25;
  const swPencil = 2.35;
  const swSquiggle = 3.15;
  return (
    <div className={wrap} role="img" aria-label={fig["aria-label"]}>
      <svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" aria-hidden className="shrink-0">
        {/* 낙서 끝 = 펜촉(world) — 레퍼런스와 같은 단일 S 물결 */}
        <path
          d={`M 16.5 65.5 C 24.5 54.5 31.5 55 38.5 62.5 C 43.5 67.5 48 68.5 52.5 64.5 C 57.5 60 63.5 61 ${tipX} ${tipY}`}
          fill="none"
          stroke={P}
          strokeWidth={swSquiggle}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* 한 경로로 이어 연필 외곽선(틈 없음) */}
        <path
          d="M 0 0 L -4.25 -10.65 L -4.25 -41.85 L -5.15 -41.85 L -5.15 -53.25 L 5.15 -53.25 L 5.15 -41.85 L 4.25 -41.85 L 4.25 -10.65 Z"
          fill="none"
          transform={`translate(${tipX} ${tipY}) rotate(-44)`}
          className="text-white [html[data-theme='light']_&]:text-zinc-900"
          stroke="currentColor"
          strokeWidth={swPencil}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

/** 1) 다운로드: 짧은 화살표 + 핑크 바(회색 밑줄·이중 바 제거) */
export function PitchIllustUserDownload(fig: FigProps) {
  return (
    <div className={wrap} role="img" aria-label={fig["aria-label"]}>
      <svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" aria-hidden className="shrink-0 text-zinc-300 [html[data-theme='light']_&]:text-zinc-500">
        <path
          d="M60 34 V70 M50 60 L60 72 L70 60"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect x="28" y="86" width="64" height="9" rx="2.5" fill={P} />
      </svg>
    </div>
  );
}

/** 영상 등록: 핑크 원·재생 삼각형 — 반지름 기준 3 줄임(r 34→31), 비율 유지로 함께 축소 · 뷰박스 여백으로 테두리 잘림 방지 */
export function PitchIllustCreatorUpload(fig: FigProps) {
  const uploadGlyphScale = 31 / 34;
  return (
    <div className={`${wrap} overflow-visible -translate-y-2`} role="img" aria-label={fig["aria-label"]}>
      <svg
        width="120"
        height="120"
        viewBox="-12 -12 144 144"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
        className="shrink-0 overflow-visible"
      >
        <g transform={`translate(60 60) scale(${uploadGlyphScale}) translate(-60 -60)`}>
          <circle cx="60" cy="60" r="34" fill={P} />
          <polygon points="51,46 51,74 79,60" fill="#fff" />
        </g>
      </svg>
    </div>
  );
}

/** 4) 가격: 테두리 없이 $ 기호 크게 — 뷰박스 세로 중앙 정렬 · 문구보다 한 단계 더 위(-translate-y-3) */
export function PitchIllustCreatorPrice(fig: FigProps) {
  return (
    <div className={`${wrap} -translate-y-3`} role="img" aria-label={fig["aria-label"]}>
      <svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" aria-hidden className="shrink-0">
        <text
          x="60"
          y="60"
          textAnchor="middle"
          dominantBaseline="central"
          fill={P}
          style={{ fontSize: "52px", fontWeight: 800, fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
        >
          $
        </text>
      </svg>
    </div>
  );
}

/** 5) 판매 완료 느낌: 핑크 체크 */
export function PitchIllustCreatorSell(fig: FigProps) {
  return (
    <div className={wrap} role="img" aria-label={fig["aria-label"]}>
      <svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" aria-hidden className="shrink-0">
        <path
          d="M34 62 L52 80 L88 44"
          fill="none"
          stroke={P}
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
