/** 상단 헤더 프로필(MainTopUserMenu)·`/cart` 등 — 레거시 단일 원형 링 (필요 시). */
export const TOP_NAV_ICON_RING_BASE =
  "inline-flex shrink-0 items-center justify-center rounded-full border border-white/40 bg-black/24 text-zinc-100 shadow-[0_0_0_1px_rgba(255,255,255,0.05)] backdrop-blur-md transition-[border-color,background-color,color] duration-200 ease-out hover:border-white/52 hover:bg-black/36 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/50 [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:bg-white/[0.68] [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:shadow-[0_0_0_1px_rgba(0,0,0,0.05)] [html[data-theme='light']_&]:hover:border-zinc-400 [html[data-theme='light']_&]:hover:bg-white/80";

/** 메인 h-11 기준 — 계정(+선택 시 장바구니) 공용 캡슐. overflow-visible 로 계정 드롭다운이 바깥으로 나옴 (hidden이면 호버 메뉴가 잘림). */
export const TOP_NAV_ACCOUNT_CART_PILL_OUTER =
  "relative z-[130] inline-grid h-11 min-h-[2.75rem] shrink-0 items-stretch overflow-visible rounded-full border border-white/40 bg-black/20 text-zinc-100 shadow-[0_0_0_1px_rgba(255,255,255,0.05)] backdrop-blur-md transition-[border-color,background-color] duration-200 ease-out hover:border-white/52 hover:bg-black/28 [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:bg-white/[0.6] [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:shadow-[0_0_0_1px_rgba(0,0,0,0.05)] [html[data-theme='light']_&]:hover:border-zinc-400 [html[data-theme='light']_&]:hover:bg-white/[0.72]";

/** 한 칸 캡슐(게스트·푸터) — grid 한 열 */
export const TOP_NAV_ACCOUNT_CART_PILL_GRID_SINGLE = "grid-cols-1";

/** 계정·장바구니 묶음 최소 가로(아이콘 24px + 양칸 동일 패딩 기준) */
export const TOP_NAV_ACCOUNT_CART_DUAL_MIN_WIDTH =
  "min-w-[6.875rem] sm:min-w-[7rem]";

/**
 * 우상단 계정·장바구니 고정 위치(뷰포트·safe-area).
 * 메인 히어로(Highlight24)와 MallTopNav 플로팅 크롬이 동일 오프셋을 쓰도록 통일.
 */
export const MAIN_TOP_USER_FLOAT_BOX_CLASS =
  "fixed z-[120] right-[max(1rem,env(safe-area-inset-right))] top-[max(1rem,env(safe-area-inset-top))] sm:right-6 sm:top-5";

/** 2칸 — grid로 절반 대칭 + 가운데 1px 구분선 (부모는 inline-grid) */
export const TOP_NAV_ACCOUNT_CART_PILL_DUAL_LAYOUT =
  `${TOP_NAV_ACCOUNT_CART_DUAL_MIN_WIDTH} grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]`;

/** 캡슐 내부 셀 — grid/flex 공통, flex-1 대신 w-full(그리드 칸 채움) */
export const TOP_NAV_ACCOUNT_CART_PILL_CELL =
  "flex h-full min-h-[2.75rem] w-full min-w-0 items-center justify-center overflow-visible border-0 bg-transparent px-0 text-inherit shadow-none transition-colors hover:bg-white/[0.09] active:bg-white/[0.065] focus-visible:z-[2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-white/45 [html[data-theme='light']_&]:hover:bg-zinc-200/55 [html[data-theme='light']_&]:active:bg-zinc-200/40 [html[data-theme='light']_&]:focus-visible:outline-zinc-500/65";

/** 캡슐 세로 구분선 — 그리드 중앙열용(전 높이) */
export const TOP_NAV_ACCOUNT_CART_PILL_DIVIDER =
  "pointer-events-none w-px shrink-0 self-stretch bg-white/[0.14] [html[data-theme='light']_&]:bg-zinc-300/42";

/** 계정 캡슐 — lucide 프로필·장바구니 동일 픽셀 박스 (strokeWidth 2 권장). */
export function topNavHeroCapsuleGlyphIconClass(): string {
  return "h-6 w-6 shrink-0";
}

export function topNavHeroProfileGlyphIconClass(): string {
  return topNavHeroCapsuleGlyphIconClass();
}

export function topNavHeroCartGlyphIconClass(): string {
  return topNavHeroCapsuleGlyphIconClass();
}

export type TopNavIconRingSize = "compact" | "default" | "hero";

export function topNavIconRingSizeClass(size: TopNavIconRingSize): string {
  switch (size) {
    case "compact":
      return "h-8 w-8";
    case "hero":
      return "h-11 w-11";
    default:
      return "h-9 w-9";
  }
}

/** 프로필 트리거·장바구니 링크에 그대로 사용 */
export function topNavIconRingFullClass(size: TopNavIconRingSize): string {
  return `${TOP_NAV_ICON_RING_BASE} ${topNavIconRingSizeClass(size)}`;
}

/** lucide `ShoppingCart` — 링 안에 넣을 때 크기 */
export function topNavShoppingCartGlyphClass(size: TopNavIconRingSize): string {
  switch (size) {
    case "compact":
      return "h-4 w-4";
    case "hero":
      return "h-6 w-6";
    default:
      return "h-[18px] w-[18px]";
  }
}
