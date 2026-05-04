/**
 * 인기순위·탐색·홈 마퀴 등 세로 영상 카드 — TikTok/Reels형 우측 액션 레일.
 * 부모 미디어 래퍼에 `@container`(inline-size)가 있어야 `cqw` 비율이 맞습니다.
 */

export const videoReelMediaContainer = "@container";

/** 우측 세로 중앙 정렬 레일 */
export const reelActionRailOuter =
  "pointer-events-none absolute inset-y-0 right-0 z-[7] flex items-center pr-[2.5%] min-[480px]:pr-2 sm:pr-2";

export const reelActionRailColumn =
  "flex flex-col items-center gap-[max(0.28rem,min(1.75cqw,0.55rem))] translate-x-2 opacity-0 transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:duration-150 group-hover:translate-x-0 group-hover:opacity-100 group-focus-within:translate-x-0 group-focus-within:opacity-100";

/** 기본 원형 — 카드 너비의 ~16cqw, 상하한 clamp */
export const reelActionBtn =
  "pointer-events-none relative z-[8] inline-flex aspect-square shrink-0 items-center justify-center rounded-full border border-white/25 bg-black/45 text-white shadow-none transition-[transform,background-color,border-color,color,box-shadow] duration-200 ease-out hover:bg-black/52 active:scale-[0.94] w-[max(1.875rem,min(16cqw,2.75rem))] group-hover:pointer-events-auto group-focus-within:pointer-events-auto";

/** 좁은 카드·compactHoverActions */
export const reelActionBtnCompact =
  "pointer-events-none relative z-[8] inline-flex aspect-square shrink-0 items-center justify-center rounded-full border border-white/25 bg-black/45 text-white shadow-none transition-[transform,background-color,border-color,color,box-shadow] duration-200 ease-out hover:bg-black/52 active:scale-[0.94] w-[max(1.625rem,min(14cqw,2.45rem))] group-hover:pointer-events-auto group-focus-within:pointer-events-auto";

/** Micro DNA 등 초소형 그리드 */
export const reelActionBtnDense =
  "pointer-events-none relative z-[8] inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/25 bg-black/45 text-white shadow-none transition-[transform,background-color,border-color,color,box-shadow] duration-200 ease-out hover:bg-black/52 active:scale-[0.94] group-hover:pointer-events-auto group-focus-within:pointer-events-auto";

export const reelActionBtnActive =
  "border-[color:var(--reels-point)]/78 bg-[var(--reels-point)]/14 text-[var(--reels-point)] shadow-[0_0_0_1px_rgba(228,41,128,0.28)] hover:bg-[var(--reels-point)]/22";

/** 버튼 정사각형 안에서 아이콘 ~50% */
export const reelActionIcon =
  "pointer-events-none h-[50%] w-[50%] max-h-[1.35rem] max-w-[1.35rem] shrink-0";

export const reelActionIconCompact =
  "pointer-events-none h-[50%] w-[50%] max-h-[1.2rem] max-w-[1.2rem] shrink-0";

export const reelActionIconDense =
  "pointer-events-none h-[14px] w-[14px] shrink-0";
