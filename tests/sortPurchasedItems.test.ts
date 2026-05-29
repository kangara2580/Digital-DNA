import { describe, expect, it } from "vitest";
import { purchaseAcquiredAtMs, sortPurchasedItems } from "@/lib/sortPurchasedItems";
import type { PurchasedListItem } from "@/context/PurchasedVideosContext";

function row(
  id: string,
  acquiredAt: number,
  paidPriceWon: number,
  title?: string,
): PurchasedListItem {
  return {
    videoId: id,
    acquiredAt,
    paidPriceWon,
    listPriceWon: paidPriceWon,
    listedForSale: true,
    feed: {
      id,
      title: title ?? id,
      creator: "c",
      src: "/x.mp4",
      poster: "/p.jpg",
      orientation: "portrait",
      priceWon: paidPriceWon,
    },
  };
}

describe("sortPurchasedItems", () => {
  const sample = [
    row("b", 2000, 300),
    row("a", 1000, 100),
    row("c", 3000, 200),
  ];

  it("sorts recent purchase first (newest acquiredAt first)", () => {
    const sorted = sortPurchasedItems(sample, "recent");
    expect(sorted.map((r) => r.videoId)).toEqual(["c", "b", "a"]);
  });

  it("sorts oldest purchase first", () => {
    const sorted = sortPurchasedItems(sample, "oldest");
    expect(sorted.map((r) => r.videoId)).toEqual(["a", "b", "c"]);
  });

  it("sorts by price ascending then recent", () => {
    const sorted = sortPurchasedItems(sample, "price-asc");
    expect(sorted.map((r) => r.videoId)).toEqual(["a", "c", "b"]);
  });

  it("sorts by price descending then recent", () => {
    const sorted = sortPurchasedItems(sample, "price-desc");
    expect(sorted.map((r) => r.videoId)).toEqual(["b", "c", "a"]);
  });

  it("puts rows without acquiredAt at the end for recent sort", () => {
    const mixed = [row("old", 1000, 10), row("unknown", 0, 50), row("new", 3000, 20)];
    const sorted = sortPurchasedItems(mixed, "recent");
    expect(sorted.map((r) => r.videoId)).toEqual(["new", "old", "unknown"]);
  });

  it("puts rows without acquiredAt at the end for oldest sort", () => {
    const mixed = [row("old", 1000, 10), row("unknown", 0, 50), row("new", 3000, 20)];
    const sorted = sortPurchasedItems(mixed, "oldest");
    expect(sorted.map((r) => r.videoId)).toEqual(["old", "new", "unknown"]);
  });
});

describe("purchaseAcquiredAtMs", () => {
  it("falls back to listing createdAtMs", () => {
    const r = row("x", 0, 10);
    r.feed.listing = { sellerId: "s", views: 0, salesCount: 0, createdAtMs: 4242 };
    expect(purchaseAcquiredAtMs(r)).toBe(4242);
  });
});
