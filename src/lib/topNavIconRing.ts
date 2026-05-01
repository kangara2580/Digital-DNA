/** 상단 헤더 프로필(MainTopUserMenu)·`/cart` 링크 등 공통 원형 링 (테두리·블러 배경 동일). */
export const TOP_NAV_ICON_RING_BASE =
  "inline-flex shrink-0 items-center justify-center rounded-full border border-white/40 bg-black/35 text-zinc-100 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur-md transition-[border-color,background-color,color] duration-200 ease-out hover:border-white/55 hover:bg-black/48 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/50 [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:shadow-[0_0_0_1px_rgba(0,0,0,0.06)] [html[data-theme='light']_&]:hover:border-zinc-400";

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
      return "h-[18px] w-[18px]";
    default:
      return "h-[18px] w-[18px]";
  }
}
