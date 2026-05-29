import type { Video } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  buildSellerAnalyticsFromVideos,
  resolveAnalyticsRange,
  type SellerAnalyticsPurchase,
} from "@/lib/sellerAnalyticsFromDb";

const NOW = new Date("2026-05-26T12:00:00.000Z");

function mockVideo(overrides: Partial<Video> = {}): Video {
  return {
    id: "video-1",
    title: "테스트 영상",
    creator: "판매자",
    src: "/v.mp4",
    poster: "/p.jpg",
    orientation: "portrait",
    durationSec: 30,
    price: 12_000,
    views: 500,
    salesCount: 5,
    editionKind: "open",
    editionCap: null,
    sellerId: "seller-1",
    createdAt: new Date("2025-06-01T00:00:00.000Z"),
    updatedAt: NOW,
    flashSaleUntil: null,
    description: null,
    hashtags: null,
    isAiGenerated: false,
    category: null,
    sourcePageUrl: null,
    externalProvider: null,
    externalKey: null,
    processedVideoUrl: null,
    processedVideoStatus: "pending",
    processedVideoError: null,
    status: "approved",
    moderationReason: null,
    approvedAt: NOW,
    approvedBy: null,
    ...overrides,
  };
}

function purchaseOnDay(
  dayYmd: string,
  videoId = "video-1",
  price = 12_000,
): SellerAnalyticsPurchase {
  const [y, m, d] = dayYmd.split("-").map(Number);
  return {
    videoId,
    price,
    createdAt: new Date(Date.UTC(y!, m! - 1, d!, 14, 0, 0)),
  };
}

describe("resolveAnalyticsRange", () => {
  it("maps preset days 7 / 30 / 365", () => {
    expect(resolveAnalyticsRange({ kind: "preset", days: 7 }, NOW).periodDays).toBe(7);
    expect(resolveAnalyticsRange({ kind: "preset", days: 30 }, NOW).periodDays).toBe(30);
    expect(resolveAnalyticsRange({ kind: "preset", days: 365 }, NOW).periodDays).toBe(365);
    expect(resolveAnalyticsRange({ kind: "preset", days: 30 }, NOW).periodLabel).toBe(
      "최근 한달",
    );
    expect(resolveAnalyticsRange({ kind: "preset", days: 365 }, NOW).periodLabel).toBe(
      "최근 1년",
    );
  });
});

describe("buildSellerAnalyticsFromVideos with purchases", () => {
  it("fills revenue bars for 7-day period", () => {
    const purchases: SellerAnalyticsPurchase[] = [
      purchaseOnDay("2026-05-20"),
      purchaseOnDay("2026-05-22"),
      purchaseOnDay("2026-05-25", "video-1", 12_000),
      purchaseOnDay("2026-05-25", "video-2", 6_000),
    ];
    const videos = [
      mockVideo(),
      mockVideo({ id: "video-2", title: "두번째", price: 6_000 }),
    ];

    const snap = buildSellerAnalyticsFromVideos(
      videos,
      { kind: "preset", days: 7 },
      { now: NOW, purchases },
    );

    expect(snap.totals.totalSalesCount).toBeGreaterThan(0);
    expect(snap.totals.cumulativeRevenueWon).toBeGreaterThan(0);
    expect(snap.revenueByDay.length).toBe(7);
    expect(snap.revenueByDay.some((b) => b.revenueWon > 0)).toBe(true);
    expect(snap.revenueByDay[0]?.label).toMatch(/\d{2}\/\d{2}/);
  });

  it("uses compact bucket labels and non-zero bars for 1-year period", () => {
    const purchases: SellerAnalyticsPurchase[] = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(NOW);
      d.setUTCDate(d.getUTCDate() - i * 28);
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, "0");
      const day = String(d.getUTCDate()).padStart(2, "0");
      purchases.push(purchaseOnDay(`${y}-${m}-${day}`));
    }

    const snap = buildSellerAnalyticsFromVideos(
      [mockVideo()],
      { kind: "preset", days: 365 },
      { now: NOW, purchases },
    );

    expect(snap.revenueByDay.length).toBe(12);
    expect(snap.revenueByDay.every((b) => !b.label.includes("2025. 0"))).toBe(true);
    expect(snap.revenueByDay.some((b) => b.revenueWon > 0)).toBe(true);
  });

  it("aligns video table metrics with selected period", () => {
    const purchases = [
      purchaseOnDay("2026-05-24"),
      purchaseOnDay("2026-05-25"),
      purchaseOnDay("2026-01-10"),
    ];
    const snap = buildSellerAnalyticsFromVideos(
      [mockVideo()],
      { kind: "preset", days: 7 },
      { now: NOW, purchases },
    );

    expect(snap.totals.totalSalesCount).toBe(2);
    expect(snap.videos[0]?.salesCount).toBe(2);
    expect(snap.videos[0]?.cumulativeRevenueWon).toBeGreaterThan(0);
  });
});
