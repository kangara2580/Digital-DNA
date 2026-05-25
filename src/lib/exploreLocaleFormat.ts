import type { SiteLocale } from "@/lib/sitePreferences";
import {
  formatGemsCompact,
  formatGemsLocale,
  formatListingPriceWon,
} from "@/lib/gemDisplay";

export type ExploreFormatters = {
  /** @deprecated name — value is gems; use formatCompactGem */
  formatCompactWon: (n: number) => string;
  formatCompactGem: (n: number) => string;
  formatCompactCount: (n: number) => string;
  formatViewCountRail: (n: number) => string;
  formatLikeApprox: (n: number) => string;
  formatFullCount: (n: number) => string;
  numberLocale: string;
};

export function getExploreFormatters(locale: SiteLocale): ExploreFormatters {
  const isEn = locale === "en";
  const numberLocale = isEn ? "en-US" : "ko-KR";

  function formatCompactGem(n: number): string {
    return formatGemsCompact(locale, n);
  }

  /** 0 · 12 · 328 · 1.2K · 12K · 1.3M — 탐색 모바일 레일·스택 공통 */
  function formatCompactCount(n: number): string {
    const v = Math.max(0, Math.floor(n));
    if (v < 1000) return `${v}`;
    if (v < 1_000_000) {
      const k = v / 1000;
      if (k >= 100) return `${Math.round(k)}K`;
      return `${k.toFixed(1).replace(/\.0$/, "")}K`;
    }
    const m = v / 1_000_000;
    if (m >= 100) return `${Math.round(m)}M`;
    return `${m.toFixed(1).replace(/\.0$/, "")}M`;
  }

  function formatViewCountRail(n: number): string {
    const v = Math.max(0, Math.floor(n));
    if (isEn) {
      if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
      if (v >= 1_000) return `${(v / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
      return v.toLocaleString("en-US");
    }
    if (v >= 10_000) return `${(v / 10_000).toFixed(1).replace(/\.0$/, "")}만`;
    return v.toLocaleString("ko-KR");
  }

  function formatLikeApprox(n: number): string {
    const v = Math.max(0, Math.floor(n));
    if (isEn) {
      if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
      if (v >= 1_000) return `${(v / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
      return v.toLocaleString("en-US");
    }
    if (v >= 10_000) return `${(v / 10_000).toFixed(1).replace(/\.0$/, "")}만`;
    if (v >= 1000) return `${(v / 1000).toFixed(1).replace(/\.0$/, "")}천`;
    return v.toLocaleString("ko-KR");
  }

  function formatFullCount(n: number): string {
    const v = Math.max(0, Math.floor(n));
    return v.toLocaleString(numberLocale);
  }

  return {
    formatCompactWon: formatCompactGem,
    formatCompactGem,
    formatCompactCount,
    formatViewCountRail,
    formatLikeApprox,
    formatFullCount,
    numberLocale,
  };
}

/** Listing price in DB (KRW won) → gem label for cards */
export function formatPriceWon(
  locale: SiteLocale,
  n: number | null | undefined,
): string | null {
  return formatListingPriceWon(locale, n);
}
