import { describe, expect, it } from "vitest";
import {
  normalizeStoredPurchaseGems,
  toGemPrice,
} from "@/lib/gemPrice";

describe("gemPrice", () => {
  it("converts listing KRW to gems", () => {
    expect(toGemPrice(600)).toBe(100);
    expect(toGemPrice(100)).toBe(17);
  });

  it("normalizes legacy purchase rows stored as listing KRW", () => {
    expect(normalizeStoredPurchaseGems(600, 600)).toBe(100);
    expect(normalizeStoredPurchaseGems(1800, 1800)).toBe(300);
  });

  it("keeps gem-era purchase prices", () => {
    expect(normalizeStoredPurchaseGems(100, 600)).toBe(100);
    expect(normalizeStoredPurchaseGems(300, 1800)).toBe(300);
  });
});
