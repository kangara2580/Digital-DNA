/**
 * 구매 후기 / 인기순위 TOP 30 / 단 3단계 등 메인 섹션 제목·히어로 점프 링크 — 동일 타이포
 * (Tailwind JIT: 이 파일은 content에 포함됨)
 */

const core =
  "text-[26px] font-extrabold leading-snug tracking-tight text-zinc-100 [html[data-theme='light']_&]:text-zinc-900 sm:text-[30px] md:text-[32px]";

/** 섹션 내부 `<h2>` — 가운데 정렬 포함 */
export const homeSectionHeadingH2ClassName = `text-center ${core}`;

/** 홈 히어로에서 섹션으로 스크롤하는 링크 라벨 */
export const homeSectionHeroNavLabelClassName = `whitespace-nowrap ${core} transition-colors duration-300 group-hover:text-white [html[data-theme='light']_&]:group-hover:text-zinc-950`;
