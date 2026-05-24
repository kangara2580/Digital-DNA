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

/** Format gem amount with 💎 suffix for display. */
export function formatGems(gems: number): string {
  return `${gems.toLocaleString()}💎`;
}

/** Format gem amount with commas only (no emoji). */
export function formatGemsPlain(gems: number): string {
  return gems.toLocaleString();
}

/** Minimum settlement amount in gems. */
export const MIN_SETTLEMENT_GEMS = 500;

/** Platform fee rate: 15% = 1500 bps. */
export const PLATFORM_FEE_BPS = 1500;
