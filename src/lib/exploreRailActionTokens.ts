/**
 * 탐색 세로 릴 우측 액션(장바구니·좋아요·찜)과 동일한 버튼·아이콘 스타일.
 * 영상 상세 등에서도 같은 실루엣을 쓰기 위해 공유합니다.
 */
export const EXPLORE_RAIL_ACTION_BTN =
  "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-0 bg-transparent p-0 text-white/90 transition-colors duration-200 hover:text-white active:scale-[0.92] [html[data-theme='light']_&]:text-zinc-600 [html[data-theme='light']_&]:hover:text-zinc-900";

export const EXPLORE_RAIL_ACTION_ICON =
  "h-[21px] w-[21px] shrink-0 pointer-events-none stroke-[2.25] [html[data-theme='light']_&]:stroke-zinc-700";

export const EXPLORE_RAIL_ACTION_ICON_FILLED =
  "h-[21px] w-[21px] shrink-0 pointer-events-none stroke-[2.25] stroke-[var(--reels-point)] fill-[var(--reels-point)] [html[data-theme='light']_&]:stroke-[var(--reels-point)] [html[data-theme='light']_&]:fill-[var(--reels-point)]";

export const EXPLORE_RAIL_ACTION_BTN_ACTIVE_TINT =
  "!text-[var(--reels-point)] hover:brightness-110 [html[data-theme='light']_&]:!text-[var(--reels-point)]";
