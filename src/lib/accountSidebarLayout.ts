/**
 * 마이페이지 · 설정 · 내 자산 — 좌측 섹션 네비 + 본문 2열 레이아웃.
 * md 미만(≈375px): 메뉴를 상단 가로 스크롤, 본문은 전폭 1열.
 */

/** 페이지 셸 — 뷰포트가 줄면 padding만 축소 */
export const ACCOUNT_PAGE_CONTAINER_CLASS =
  "mx-auto w-full max-w-[1500px] px-3 py-8 sm:px-4 sm:py-9 md:px-5 md:py-10 lg:px-6 lg:py-10 xl:px-8 2xl:px-10";

/**
 * 제목 + (모바일: 메뉴 → 본문 세로) / (md+: 사이드바 | 본문 2열).
 */
export const ACCOUNT_PAGE_LAYOUT_CLASS =
  "grid w-full min-w-0 grid-cols-1 items-start gap-y-5 sm:gap-y-6 md:grid-cols-[minmax(0,10rem)_minmax(0,1fr)] md:gap-x-4 md:gap-y-8 lg:grid-cols-[minmax(0,13.5rem)_minmax(0,1fr)] lg:gap-x-10 xl:grid-cols-[15rem_minmax(0,1fr)] xl:gap-x-12";

/** @deprecated — ACCOUNT_PAGE_LAYOUT_CLASS 사용 */
export const ACCOUNT_PAGE_GRID_CLASS = ACCOUNT_PAGE_LAYOUT_CLASS;

export const ACCOUNT_PAGE_HEADER_CLASS =
  "min-w-0 border-b border-white/10 pb-6 sm:pb-8 md:col-span-2 [html[data-theme='light']_&]:border-zinc-100";

export const ACCOUNT_PAGE_TITLE_CLASS =
  "text-[1.5rem] font-semibold tracking-tight text-zinc-50 sm:text-[1.875rem] [html[data-theme='light']_&]:text-zinc-900";

export const ACCOUNT_PAGE_ASIDE_CLASS =
  "min-w-0 self-start md:col-start-1 md:row-start-2 max-md:-mx-1 max-md:overflow-x-auto max-md:px-1 max-md:pb-0.5";

/** 모바일: 가로 탭형 메뉴 / md+: 세로 목록 */
export const ACCOUNT_PAGE_NAV_CLASS =
  "flex flex-row flex-nowrap gap-1.5 max-md:min-w-min md:flex-col md:gap-0.5";

export const ACCOUNT_PAGE_SECTION_CLASS =
  "min-w-0 self-start max-md:row-start-3 md:col-start-2 md:row-start-2";

export const ACCOUNT_PAGE_MENU_LABEL_CLASS =
  "mb-3 text-[13px] font-medium uppercase tracking-[0.12em] text-zinc-500 max-md:sr-only [html[data-theme='light']_&]:text-zinc-400";

export const ACCOUNT_PAGE_MAIN_CLASS =
  "min-h-[60vh] bg-zinc-950 text-zinc-100 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-900";
