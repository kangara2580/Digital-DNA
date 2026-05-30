/** 마이페이지 사이드바 · 피드 햄버거 메뉴 공통 탭 */
export type MyPageTab =
  | "wishlist"
  | "likes"
  | "purchases"
  | "reviews"
  | "drafts"
  | "listings"
  | "analytics";

export const MYPAGE_TAB_DEFS: { id: MyPageTab; href: string }[] = [
  { id: "wishlist", href: "/mypage?tab=wishlist" },
  { id: "likes", href: "/mypage?tab=likes" },
  { id: "purchases", href: "/mypage?tab=purchases" },
  { id: "reviews", href: "/mypage?tab=reviews" },
  { id: "drafts", href: "/mypage?tab=drafts" },
  { id: "listings", href: "/mypage?tab=listings" },
  { id: "analytics", href: "/mypage?tab=analytics" },
];

export function normalizeMyPageTab(input: string | null): MyPageTab {
  if (input === "saved") return "wishlist";
  if (
    input === "drafts" ||
    input === "analytics" ||
    input === "listings" ||
    input === "wishlist" ||
    input === "likes" ||
    input === "purchases" ||
    input === "reviews"
  ) {
    return input;
  }
  return "wishlist";
}

/** 피드 등 좁은 메뉴 — listings만 짧은 라벨 키 */
export function mypageTabLabelKey(tab: MyPageTab): string {
  return tab === "listings" ? "listingsShort" : tab;
}
