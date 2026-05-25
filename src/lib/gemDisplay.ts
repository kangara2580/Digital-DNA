import type { SiteLocale } from "@/lib/sitePreferences";
import { toGemPrice } from "@/lib/gemPrice";

/** Gem amount (already in 💎 units) — full number + suffix */
export function formatGemsLocale(locale: SiteLocale, gems: number): string {
  const v = Math.max(0, Math.floor(gems));
  const loc = locale === "en" ? "en-US" : "ko-KR";
  return `${v.toLocaleString(loc)}💎`;
}

/** Gem amount — compact (만/억/K/M) + suffix */
export function formatGemsCompact(locale: SiteLocale, gems: number): string {
  const v = Math.max(0, Math.floor(gems));
  const isEn = locale === "en";
  if (isEn) {
    if (v >= 1_000_000) {
      return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, "")}M💎`;
    }
    if (v >= 1_000) {
      return `${(v / 1_000).toFixed(1).replace(/\.0$/, "")}K💎`;
    }
    return `${v.toLocaleString("en-US")}💎`;
  }
  if (v >= 100_000_000) return `${(v / 100_000_000).toFixed(1)}억💎`;
  if (v >= 10_000) return `${Math.round(v / 10_000)}만💎`;
  return `${v.toLocaleString("ko-KR")}💎`;
}

/** Listing/list price stored as KRW won in DB — show as gems */
export function formatListingPriceWon(
  locale: SiteLocale,
  priceWon: number | null | undefined,
): string | null {
  if (priceWon == null || !Number.isFinite(priceWon)) return null;
  return formatGemsLocale(locale, toGemPrice(priceWon));
}

/** Legacy KRW revenue total → gems for metrics display */
export function revenueWonToDisplayGems(revenueWon: number): number {
  return toGemPrice(revenueWon);
}

/** Admin tables (ko-KR locale fixed) */
export function formatAdminGems(gems: number): string {
  const v = Math.max(0, Math.floor(gems));
  return `${new Intl.NumberFormat("ko-KR").format(v)}💎`;
}

export function formatAdminListingPriceWon(priceWon: number): string {
  return formatAdminGems(toGemPrice(priceWon));
}
