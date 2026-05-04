/**
 * 누적·기간 수익 금액 표기 통일 (탐색·인기순위·상세·마이페이지 등).
 * 다크: 화이트 / 라이트: 대비용 진한 텍스트.
 */
export const revenueAmountClass =
  "text-white [html[data-theme='light']_&]:text-zinc-950";

/** 수익 추세 상향(▲·화살표) — 브랜드 핑크 */
export const revenueTrendUpClass =
  "text-[color:var(--reels-point)] [html[data-theme='light']_&]:text-[color:var(--reels-point)]";

/** 수익 추세 하향(▼·화살표) — 연회색 */
export const revenueTrendDownClass =
  "text-zinc-400 [html[data-theme='light']_&]:text-zinc-500";
