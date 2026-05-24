import type { SiteLocale } from "@/lib/sitePreferences";

export function formatWhen(iso: string | null, locale: SiteLocale): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return new Intl.DateTimeFormat(locale === "ko" ? "ko-KR" : "en-US", {
    timeZone: "Asia/Seoul",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

export function formatCredits(n: number, locale: SiteLocale): string {
  return new Intl.NumberFormat(locale === "ko" ? "ko-KR" : "en-US").format(n);
}

export function formatWon(n: number, locale: SiteLocale): string {
  return `${new Intl.NumberFormat(locale === "ko" ? "ko-KR" : "en-US").format(n)}💎`;
}

export function formatGem(n: number, locale: SiteLocale): string {
  return `${new Intl.NumberFormat(locale === "ko" ? "ko-KR" : "en-US").format(n)}💎`;
}

export function ledgerTypeLabel(type: string, t: (k: string) => string): string {
  const key = `assets.ledger.type.${type}`;
  const label = t(key);
  return label === key ? type : label;
}
