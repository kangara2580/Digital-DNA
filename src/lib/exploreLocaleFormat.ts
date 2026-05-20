import type { SiteLocale } from "@/lib/sitePreferences";

export type ExploreFormatters = {
  formatCompactWon: (n: number) => string;
  formatCompactCount: (n: number) => string;
  formatViewCountRail: (n: number) => string;
  formatLikeApprox: (n: number) => string;
  /** 만/억/k 축약 없이 전체 숫자 */
  formatFullCount: (n: number) => string;
  numberLocale: string;
};

export function getExploreFormatters(locale: SiteLocale): ExploreFormatters {
  const isEn = locale === "en";
  const numberLocale = isEn ? "en-US" : "ko-KR";

  function formatCompactWon(n: number): string {
    const v = Math.max(0, Math.floor(n));
    if (isEn) {
      if (v >= 100_000_000) return `₩${(v / 100_000_000).toFixed(1)}B`;
      if (v >= 10_000_000) return `₩${(v / 1_000_000).toFixed(1)}M`;
      if (v >= 10_000) return `₩${(v / 1_000).toFixed(0)}K`;
      return `₩${v.toLocaleString("en-US")}`;
    }
    if (v >= 100_000_000) return `${(v / 100_000_000).toFixed(1)}억`;
    if (v >= 10_000) return `${Math.round(v / 10_000)}만`;
    return `${v.toLocaleString("ko-KR")}원`;
  }

  function formatCompactCount(n: number): string {
    const v = Math.max(0, Math.floor(n));
    if (isEn) {
      if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
      if (v >= 1_000) return `${(v / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
      return `${v}`;
    }
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 10_000) return `${(v / 10_000).toFixed(1)}만`;
    if (v >= 1_000) return `${(v / 1000).toFixed(1)}k`;
    return `${v}`;
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
    formatCompactWon,
    formatCompactCount,
    formatViewCountRail,
    formatLikeApprox,
    formatFullCount,
    numberLocale,
  };
}

/** Full price label for cards (no 만/k compact). */
export function formatPriceWon(locale: SiteLocale, n: number | null | undefined): string | null {
  if (n == null || !Number.isFinite(n)) return null;
  const v = Math.max(0, Math.floor(n));
  if (locale === "en") return `₩${v.toLocaleString("en-US")}`;
  return `${v.toLocaleString("ko-KR")}원`;
}
