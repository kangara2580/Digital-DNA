/**
 * 인기순위·탐색·홈 마퀴 등 세로 영상 카드 — TikTok/Reels형 우측 액션 레일.
 * 부모 미디어 래퍼에 `@container`(inline-size)가 있어야 `cqw` 비율이 맞습니다.
 */

export const videoReelMediaContainer = "@container";

/** 미디어 래퍼 — `globals.css` `.video-reel-media-root` 라이트 오버레이(가격·아이콘·시간) */
export const videoReelMediaRootClass = "video-reel-media-root";

export const videoReelMediaRootClassName = `${videoReelMediaContainer} ${videoReelMediaRootClass}`;

/** 숏폼 세로 프레임 — 쇼핑몰·카테고리·탐색 그리드·인기순위·VideoCard 등 공통 9:16 */
export const videoShortFormAspectClassName = "aspect-[9/16] w-full";

/** 영상 위 텍스트·아이콘 (라이트에서 body `.text-white` 보정 예외) */
export const videoCardPriceOnMediaClass = "video-card-price-on-media";
export const videoCardDurationBadgeClass = "video-card-duration-badge";

/** 몰·랭킹 카드 하단 크레딧 가격 — 호버 시 브랜드 핑크, 회색 pill 배경 없음 */
export const videoCardMallPriceClass =
  "video-card-mall-price shrink-0 text-right font-extrabold tabular-nums transition-colors duration-200 motion-reduce:transition-none text-zinc-50 [html[data-theme='light']_&]:text-zinc-950 group-hover:text-[color:var(--reels-point)]";
export const reelsActionIconOnMediaClass = "reels-action-icon-on-media";

/** 비활성 액션 아이콘 색 — 활성 시 브랜드 핑크 */
export function reelActionIconColorClass(active: boolean): string {
  return active
    ? "text-[var(--reels-point)]"
    : `text-white ${reelsActionIconOnMediaClass}`;
}

/** 우측 세로 중앙 정렬 레일 */
export const reelActionRailOuter =
  "pointer-events-none absolute inset-y-0 right-0 z-[7] flex items-center pr-[2.5%] min-[480px]:pr-2 sm:pr-2";

export const reelActionRailColumn =
  "flex flex-col items-center gap-[max(0.28rem,min(1.75cqw,0.55rem))] translate-x-2 opacity-0 transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:duration-150 group-hover:translate-x-0 group-hover:opacity-100 group-focus-within:translate-x-0 group-focus-within:opacity-100";

/** 라이트: 영상 위 반투명 화이트 글래스 (globals `.reels-action-glass-btn` 색 보정) */
const reelActionBtnLightGlass =
  "[html[data-theme='light']_&]:border-white/45 [html[data-theme='light']_&]:bg-white/22 [html[data-theme='light']_&]:backdrop-blur-[3px] [html[data-theme='light']_&]:shadow-[0_2px_14px_rgba(0,0,0,0.14)] [html[data-theme='light']_&]:hover:border-white/55 [html[data-theme='light']_&]:hover:bg-white/32";

/** 기본 원형 — 카드 너비의 ~16cqw, 상하한 clamp */
export const reelActionBtn =
  `reels-action-glass-btn pointer-events-none relative z-[8] inline-flex aspect-square shrink-0 items-center justify-center rounded-full border border-white/25 bg-black/45 text-white shadow-none transition-[transform,background-color,border-color,color,box-shadow] duration-200 ease-out hover:border-white/35 hover:bg-black/52 active:scale-[0.94] w-[max(1.875rem,min(16cqw,2.75rem))] group-hover:pointer-events-auto group-focus-within:pointer-events-auto ${reelActionBtnLightGlass}`;

/** 좁은 카드·compactHoverActions */
export const reelActionBtnCompact =
  `reels-action-glass-btn pointer-events-none relative z-[8] inline-flex aspect-square shrink-0 items-center justify-center rounded-full border border-white/25 bg-black/45 text-white shadow-none transition-[transform,background-color,border-color,color,box-shadow] duration-200 ease-out hover:border-white/35 hover:bg-black/52 active:scale-[0.94] w-[max(1.625rem,min(14cqw,2.45rem))] group-hover:pointer-events-auto group-focus-within:pointer-events-auto ${reelActionBtnLightGlass}`;

/** Micro DNA 등 초소형 그리드 */
export const reelActionBtnDense =
  `reels-action-glass-btn pointer-events-none relative z-[8] inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/25 bg-black/45 text-white shadow-none transition-[transform,background-color,border-color,color,box-shadow] duration-200 ease-out hover:border-white/35 hover:bg-black/52 active:scale-[0.94] group-hover:pointer-events-auto group-focus-within:pointer-events-auto ${reelActionBtnLightGlass}`;

export const reelActionBtnActive =
  "border-[color:var(--reels-point)]/78 bg-[var(--reels-point)]/14 text-[var(--reels-point)] shadow-[0_0_0_1px_rgba(255,45,141,0.28)] hover:bg-[var(--reels-point)]/22";

/** 버튼 정사각형 안에서 아이콘 ~50% */
export const reelActionIcon =
  "pointer-events-none h-[50%] w-[50%] max-h-[1.35rem] max-w-[1.35rem] shrink-0";

export const reelActionIconCompact =
  "pointer-events-none h-[50%] w-[50%] max-h-[1.2rem] max-w-[1.2rem] shrink-0";

export const reelActionIconDense =
  "pointer-events-none h-[14px] w-[14px] shrink-0";
