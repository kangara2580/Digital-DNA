/**
 * Gem (보석) pricing utilities.
 *
 * Conversion basis: Creator pack = $24.99 = 6,200 gems.
 * 1 gem ≈ 6 KRW.  toGemPrice rounds to nearest integer.
 */

const GEM_KRW_RATE = 6;

/** Convert KRW price to gem price. */
export function toGemPrice(priceWon: number): number {
  if (priceWon <= 0) return 0;
  return Math.round(priceWon / GEM_KRW_RATE);
}

/** Format gem amount (no emoji — pair with PaymentDiamondIcon). */
export function formatGems(gems: number): string {
  return gems.toLocaleString();
}

/** Format gem amount with commas only (no emoji). */
export function formatGemsPlain(gems: number): string {
  return gems.toLocaleString();
}

/**
 * DB `purchases.price` — gem-era values vs legacy listing KRW stored as price.
 * Compare with listing `video.price` (KRW) when available.
 */
export function normalizeStoredPurchaseGems(
  purchasePrice: number,
  listingPriceWon = 0,
): number {
  const p = Math.max(0, Math.floor(purchasePrice));
  if (p <= 0) return 0;
  const listing = Math.max(0, Math.floor(listingPriceWon));
  if (listing <= 0) {
    return p >= 500 ? toGemPrice(p) : p;
  }
  const expectedGems = toGemPrice(listing);
  if (p === expectedGems) return p;
  if (p === listing) return expectedGems;
  if (p > expectedGems * 2) return toGemPrice(p);
  return p;
}

/** Minimum settlement amount in gems. */
export const MIN_SETTLEMENT_GEMS = 500;

/** Platform fee rate: 15% = 1500 bps. */
export const PLATFORM_FEE_BPS = 1500;
