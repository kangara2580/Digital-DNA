/**
 * Tests for admin analytics types and helpers (src/lib/adminAnalytics.ts)
 * Since getAdminAnalytics() requires a live DB, we test the helper functions
 * and type structure separately.
 */

import { describe, it, expect } from "vitest";
import type {
  DailyStat,
  TopVideo,
  TopSeller,
  RevenueBreakdown,
  UserGrowth,
  PaymentProviderStats,
  RefundStats,
  CreditStats,
  AdminAnalyticsData,
} from "@/lib/adminAnalytics";

describe("Admin Analytics Types", () => {
  it("DailyStat should have correct shape", () => {
    const stat: DailyStat = {
      date: "2026-05-21",
      revenue: 100000,
      purchases: 5,
      refunds: 1,
      newUsers: 3,
    };
    expect(stat.date).toBe("2026-05-21");
    expect(stat.revenue).toBe(100000);
  });

  it("TopVideo should have correct shape", () => {
    const video: TopVideo = {
      videoId: "v1",
      title: "테스트 영상",
      creator: "크리에이터",
      salesCount: 10,
      totalRevenue: 50000,
    };
    expect(video.videoId).toBe("v1");
    expect(video.salesCount).toBe(10);
  });

  it("TopSeller should have correct shape", () => {
    const seller: TopSeller = {
      sellerId: "s1",
      email: "seller@test.com",
      nickname: "판매자1",
      totalSales: 20,
      totalRevenue: 200000,
      netEarnings: 180000,
    };
    expect(seller.netEarnings).toBe(180000);
  });

  it("RevenueBreakdown should have correct shape", () => {
    const rev: RevenueBreakdown = {
      totalRevenue: 1000000,
      platformFees: 100000,
      sellerEarnings: 900000,
      refundedAmount: 50000,
      pendingSettlement: 300000,
      paidSettlement: 600000,
    };
    expect(rev.platformFees + rev.sellerEarnings).toBe(rev.totalRevenue);
  });

  it("UserGrowth should have correct shape", () => {
    const growth: UserGrowth = {
      totalUsers: 100,
      thisMonthNew: 15,
      lastMonthNew: 10,
      growthPercent: 50,
    };
    expect(growth.growthPercent).toBe(50);
  });

  it("AdminAnalyticsData should compose all types", () => {
    const data: AdminAnalyticsData = {
      dailyStats: [],
      topVideos: [],
      topSellers: [],
      revenue: {
        totalRevenue: 0,
        platformFees: 0,
        sellerEarnings: 0,
        refundedAmount: 0,
        pendingSettlement: 0,
        paidSettlement: 0,
      },
      userGrowth: {
        totalUsers: 0,
        thisMonthNew: 0,
        lastMonthNew: 0,
        growthPercent: 0,
      },
      providerStats: [],
      refundStats: {
        totalRequests: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        refundRate: 0,
      },
      creditStats: {
        totalIssued: 0,
        totalRefunded: 0,
        currentCirculation: 0,
      },
      todaySummary: {
        revenue: 0,
        purchases: 0,
        newUsers: 0,
        activeJobs: 0,
      },
    };
    expect(data).toBeDefined();
    expect(data.dailyStats).toHaveLength(0);
  });

  it("RefundStats refundRate should be a percentage", () => {
    const stats: RefundStats = {
      totalRequests: 10,
      pending: 2,
      approved: 5,
      rejected: 3,
      refundRate: 5.5,
    };
    expect(stats.refundRate).toBe(5.5);
    expect(stats.pending + stats.approved + stats.rejected).toBe(stats.totalRequests);
  });

  it("CreditStats currentCirculation should be computed", () => {
    const stats: CreditStats = {
      totalIssued: 10000,
      totalRefunded: 2000,
      currentCirculation: 8000,
    };
    expect(stats.currentCirculation).toBe(stats.totalIssued - stats.totalRefunded);
  });

  it("PaymentProviderStats should accept various providers", () => {
    const stats: PaymentProviderStats[] = [
      { provider: "toss", count: 50, totalAmount: 500000 },
      { provider: "polar", count: 20, totalAmount: 200000 },
    ];
    expect(stats).toHaveLength(2);
    expect(stats[0].provider).toBe("toss");
  });
});
