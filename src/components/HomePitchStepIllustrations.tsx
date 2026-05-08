/**
 * 홈「3단계」— 배경·테두리 없이 120×120 SVG 중앙 정렬.
 */
const P = "var(--reels-point)";

const wrap = "flex h-[200px] w-full items-center justify-center px-2";

type FigProps = { "aria-label": string };

/** 1) 영상 선택: 마우스 포인터(커서) — 좌우 대칭, 화이트 아웃라인, 속 투명 */
export function PitchIllustUserBrowse(fig: FigProps) {
  /*
   * 포인터는 중심 x=60 기준으로 완벽 좌우 대칭.
   * 상단 꼭짓점(60,24) → 좌측 날개(42,70) → 중앙 오목(60,58) → 우측 날개(78,70) → 닫힘.
   * strokeLinejoin="round"로 모서리를 부드럽게.
   */
  return (
    <div className={wrap} role="img" aria-label={fig["aria-label"]}>
      <svg
        width="120"
        height="120"
        viewBox="0 0 120 120"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <path
          d="M60 24 L42 70 L60 58 L78 70 Z"
          fill="none"
          stroke="white"
          strokeWidth="3.5"
          strokeLinejoin="round"
          strokeLinecap="round"
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

/** 영상 등록: 핑크 원형 재생 아이콘 */
export function PitchIllustCreatorUpload(fig: FigProps) {
  return (
    <div className={wrap} role="img" aria-label={fig["aria-label"]}>
      <svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" aria-hidden className="shrink-0">
        <circle cx="60" cy="60" r="34" fill={P} />
        <polygon points="51,46 51,74 79,60" fill="#fff" />
      </svg>
    </div>
  );
}

/** 4) 가격: 테두리 없이 ₩만 크게 */
export function PitchIllustCreatorPrice(fig: FigProps) {
  return (
    <div className={wrap} role="img" aria-label={fig["aria-label"]}>
      <svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" aria-hidden className="shrink-0">
        <text
          x="60"
          y="78"
          textAnchor="middle"
          fill={P}
          style={{ fontSize: "52px", fontWeight: 800, fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
        >
          ₩
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
