/**
 * Tests for Toss configuration and commerce helpers (src/lib/tossConfig.ts)
 * - Credit pack lookup
 * - Platform fee calculation
 * - Settlement hold days
 * - Order ID generation
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  getTossCreditPack,
  tossCreditPacks,
  getTossEnvStatus,
  getTossClientKey,
  getSiteUrl,
  createTossOrderId,
  platformFeeRateBps,
  settlementHoldDays,
} from "@/lib/tossConfig";

describe("Toss Config", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("tossCreditPacks", () => {
    it("should have 3 packs", () => {
      expect(tossCreditPacks).toHaveLength(3);
    });

    it("starter pack should have 2200 credits for 9900 KRW", () => {
      const pack = tossCreditPacks.find((p) => p.key === "starter")!;
      expect(pack.credits).toBe(2200);
      expect(pack.priceKrw).toBe(9900);
    });
  });

  describe("getTossCreditPack", () => {
    it("should find valid pack", () => {
      expect(getTossCreditPack("starter")).not.toBeNull();
      expect(getTossCreditPack("creator")).not.toBeNull();
      expect(getTossCreditPack("studio")).not.toBeNull();
    });

    it("should return null for invalid key", () => {
      expect(getTossCreditPack("invalid")).toBeNull();
      expect(getTossCreditPack(null)).toBeNull();
      expect(getTossCreditPack(undefined)).toBeNull();
    });
  });

  describe("getTossEnvStatus", () => {
    it("should report missing keys", () => {
      delete process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
      delete process.env.TOSS_SECRET_KEY;
      const status = getTossEnvStatus();
      expect(status.hasClientKey).toBe(false);
      expect(status.hasSecretKey).toBe(false);
    });

    it("should report present keys", () => {
      process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY = "test_ck_123";
      process.env.TOSS_SECRET_KEY = "test_sk_123";
      const status = getTossEnvStatus();
      expect(status.hasClientKey).toBe(true);
      expect(status.hasSecretKey).toBe(true);
    });
  });

  describe("platformFeeRateBps", () => {
    it("should default to 1000 bps (10%)", () => {
      delete process.env.PLATFORM_FEE_BPS;
      expect(platformFeeRateBps()).toBe(1000);
    });

    it("should use env value when set", () => {
      process.env.PLATFORM_FEE_BPS = "500";
      expect(platformFeeRateBps()).toBe(500);
    });

    it("should cap at 5000 bps (50%)", () => {
      process.env.PLATFORM_FEE_BPS = "9999";
      expect(platformFeeRateBps()).toBe(5000);
    });

    it("should floor at 0 bps", () => {
      process.env.PLATFORM_FEE_BPS = "-100";
      expect(platformFeeRateBps()).toBe(0);
    });

    it("should handle non-numeric values", () => {
      process.env.PLATFORM_FEE_BPS = "abc";
      expect(platformFeeRateBps()).toBe(1000);
    });
  });

  describe("settlementHoldDays", () => {
    it("should default to 7 days", () => {
      delete process.env.SELLER_SETTLEMENT_HOLD_DAYS;
      expect(settlementHoldDays()).toBe(7);
    });

    it("should use env value", () => {
      process.env.SELLER_SETTLEMENT_HOLD_DAYS = "14";
      expect(settlementHoldDays()).toBe(14);
    });

    it("should cap at 60 days", () => {
      process.env.SELLER_SETTLEMENT_HOLD_DAYS = "100";
      expect(settlementHoldDays()).toBe(60);
    });

    it("should floor at 0 days", () => {
      process.env.SELLER_SETTLEMENT_HOLD_DAYS = "-5";
      expect(settlementHoldDays()).toBe(0);
    });

    it("should handle non-numeric values", () => {
      process.env.SELLER_SETTLEMENT_HOLD_DAYS = "abc";
      expect(settlementHoldDays()).toBe(7);
    });
  });

  describe("createTossOrderId", () => {
    it("should start with given prefix", () => {
      const id = createTossOrderId("credits");
      expect(id).toMatch(/^credits_/);
    });

    it("should be at most 64 characters", () => {
      const id = createTossOrderId("credits");
      expect(id.length).toBeLessThanOrEqual(64);
    });

    it("should contain only allowed characters", () => {
      const id = createTossOrderId("video");
      expect(id).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it("should generate unique IDs", () => {
      const id1 = createTossOrderId("credits");
      const id2 = createTossOrderId("credits");
      expect(id1).not.toBe(id2);
    });

    it("should work with different purpose types", () => {
      expect(createTossOrderId("credits")).toMatch(/^credits_/);
      expect(createTossOrderId("video")).toMatch(/^video_/);
      expect(createTossOrderId("cart")).toMatch(/^cart_/);
    });
  });
});
