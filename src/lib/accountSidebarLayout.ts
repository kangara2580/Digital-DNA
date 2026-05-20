/**
 * 마이페이지 · 설정 · 내 자산 — 좌측 섹션 네비 + 본문 2열 레이아웃.
 * 제목은 2열 전체, 메뉴·본문은 항상 좌우 2열(창이 줄어도 1열로 접지 않음 → 여백만 축소).
 */

/** 페이지 셸 — 뷰포트가 줄면 padding만 축소 */
export const ACCOUNT_PAGE_CONTAINER_CLASS =
  "mx-auto w-full max-w-[1500px] px-3 py-8 sm:px-4 sm:py-9 md:px-5 md:py-10 lg:px-6 lg:py-10 xl:px-8 2xl:px-10";

/**
 * 제목(row1, 2칸 span) + 사이드바|본문(row2) — lg 미만에서도 2열 유지.
 */
export const ACCOUNT_PAGE_LAYOUT_CLASS =
  "grid w-full min-w-0 grid-cols-[minmax(0,10rem)_minmax(0,1fr)] items-start gap-x-3 gap-y-6 sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)] sm:gap-x-4 sm:gap-y-8 md:grid-cols-[minmax(0,12rem)_minmax(0,1fr)] md:gap-x-6 lg:grid-cols-[minmax(0,13.5rem)_minmax(0,1fr)] lg:gap-x-10 xl:grid-cols-[15rem_minmax(0,1fr)] xl:gap-x-12";

/** @deprecated — ACCOUNT_PAGE_LAYOUT_CLASS 사용 */
export const ACCOUNT_PAGE_GRID_CLASS = ACCOUNT_PAGE_LAYOUT_CLASS;

export const ACCOUNT_PAGE_HEADER_CLASS =
  "col-span-2 min-w-0 border-b border-white/10 pb-6 sm:pb-8 [html[data-theme='light']_&]:border-zinc-100";

export const ACCOUNT_PAGE_TITLE_CLASS =
  "text-[1.625rem] font-semibold tracking-tight text-zinc-50 sm:text-[1.875rem] [html[data-theme='light']_&]:text-zinc-900";

export const ACCOUNT_PAGE_ASIDE_CLASS = "col-start-1 row-start-2 min-w-0 shrink-0 self-start";

export const ACCOUNT_PAGE_SECTION_CLASS = "col-start-2 row-start-2 min-w-0 self-start";

export const ACCOUNT_PAGE_MENU_LABEL_CLASS =
  "mb-3 text-[13px] font-medium uppercase tracking-[0.12em] text-zinc-500 [html[data-theme='light']_&]:text-zinc-400";

export const ACCOUNT_PAGE_MAIN_CLASS =
  "min-h-[60vh] bg-zinc-950 text-zinc-100 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-900";
