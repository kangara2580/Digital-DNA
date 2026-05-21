/**
 * Tests for commerce ledger functions (src/lib/commerceLedger.ts)
 * - Platform fee calculation (pure function, no DB needed)
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { calculatePlatformFee } from "@/lib/commerceLedger";

describe("Commerce Ledger — calculatePlatformFee", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should calculate 10% fee by default (1000 bps)", () => {
    delete process.env.PLATFORM_FEE_BPS;
    const result = calculatePlatformFee(10000);
    expect(result.feeRateBps).toBe(1000);
    expect(result.platformFee).toBe(1000);
    expect(result.netAmount).toBe(9000);
  });

  it("should floor the platform fee (no fractions)", () => {
    delete process.env.PLATFORM_FEE_BPS;
    const result = calculatePlatformFee(9999);
    // 9999 * 1000 / 10000 = 999.9 → floor → 999
    expect(result.platformFee).toBe(999);
    expect(result.netAmount).toBe(9000);
  });

  it("should handle zero amount", () => {
    delete process.env.PLATFORM_FEE_BPS;
    const result = calculatePlatformFee(0);
    expect(result.platformFee).toBe(0);
    expect(result.netAmount).toBe(0);
  });

  it("should handle small amounts", () => {
    delete process.env.PLATFORM_FEE_BPS;
    const result = calculatePlatformFee(5);
    // 5 * 1000 / 10000 = 0.5 → floor → 0
    expect(result.platformFee).toBe(0);
    expect(result.netAmount).toBe(5);
  });

  it("should use custom fee rate from env", () => {
    process.env.PLATFORM_FEE_BPS = "2000"; // 20%
    const result = calculatePlatformFee(10000);
    expect(result.feeRateBps).toBe(2000);
    expect(result.platformFee).toBe(2000);
    expect(result.netAmount).toBe(8000);
  });

  it("should ensure net amount is never negative", () => {
    // Even though platformFeeRateBps caps at 5000, test the net amount logic
    process.env.PLATFORM_FEE_BPS = "5000"; // 50%
    const result = calculatePlatformFee(100);
    expect(result.platformFee).toBe(50);
    expect(result.netAmount).toBeGreaterThanOrEqual(0);
  });

  it("should return all three fields", () => {
    const result = calculatePlatformFee(50000);
    expect(result).toHaveProperty("feeRateBps");
    expect(result).toHaveProperty("platformFee");
    expect(result).toHaveProperty("netAmount");
  });

  it("fee + net should equal gross", () => {
    delete process.env.PLATFORM_FEE_BPS;
    const gross = 15700;
    const result = calculatePlatformFee(gross);
    expect(result.platformFee + result.netAmount).toBe(gross);
  });

  it("fee + net should equal gross with custom rate", () => {
    process.env.PLATFORM_FEE_BPS = "1500"; // 15%
    const gross = 20000;
    const result = calculatePlatformFee(gross);
    expect(result.platformFee + result.netAmount).toBe(gross);
  });

  it("should handle large amounts", () => {
    delete process.env.PLATFORM_FEE_BPS;
    const result = calculatePlatformFee(1_000_000);
    expect(result.platformFee).toBe(100_000);
    expect(result.netAmount).toBe(900_000);
  });
});
