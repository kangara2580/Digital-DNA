import type { PurchasedListItem } from "@/context/PurchasedVideosContext";

export const PURCHASE_SORT_VALUES = [
  "recent",
  "oldest",
  "price-asc",
  "price-desc",
] as const;

export type PurchaseSort = (typeof PURCHASE_SORT_VALUES)[number];

export function isPurchaseSort(value: string): value is PurchaseSort {
  return (PURCHASE_SORT_VALUES as readonly string[]).includes(value);
}

/** 정렬·표시에 쓸 구매(권한) 시각(ms). 없으면 0 */
export function purchaseAcquiredAtMs(row: PurchasedListItem): number {
  if (Number.isFinite(row.acquiredAt) && row.acquiredAt > 0) {
    return row.acquiredAt;
  }
  const listingMs = row.feed.listing?.createdAtMs;
  if (typeof listingMs === "number" && Number.isFinite(listingMs) && listingMs > 0) {
    return listingMs;
  }
  return 0;
}

export function sortPurchasedItems(
  rows: readonly PurchasedListItem[],
  sort: PurchaseSort,
  locale: "ko" | "en" = "ko",
): PurchasedListItem[] {
  const copy = [...rows];
  const noPrice = 1e12;
  const titleCmp = (a: PurchasedListItem, b: PurchasedListItem) =>
    a.feed.title.localeCompare(b.feed.title, locale === "ko" ? "ko" : "en");

  const cmpAcquired = (a: PurchasedListItem, b: PurchasedListItem, dir: "asc" | "desc") => {
    const ta = purchaseAcquiredAtMs(a);
    const tb = purchaseAcquiredAtMs(b);
    const aMissing = ta <= 0;
    const bMissing = tb <= 0;
    if (aMissing && bMissing) return titleCmp(a, b);
    if (aMissing) return 1;
    if (bMissing) return -1;
    const byT = dir === "asc" ? ta - tb : tb - ta;
    if (byT !== 0) return byT;
    return titleCmp(a, b);
  };

  switch (sort) {
    case "recent":
      return copy.sort((a, b) => cmpAcquired(a, b, "desc"));
    case "oldest":
      return copy.sort((a, b) => cmpAcquired(a, b, "asc"));
    case "price-asc":
      return copy.sort((a, b) => {
        const byP = (a.paidPriceWon ?? noPrice) - (b.paidPriceWon ?? noPrice);
        if (byP !== 0) return byP;
        return cmpAcquired(a, b, "desc");
      });
    case "price-desc":
      return copy.sort((a, b) => {
        const byP = (b.paidPriceWon ?? -1) - (a.paidPriceWon ?? -1);
        if (byP !== 0) return byP;
        return cmpAcquired(a, b, "desc");
      });
    default:
      return copy;
  }
}
