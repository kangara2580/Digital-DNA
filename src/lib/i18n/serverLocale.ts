import { cookies, headers } from "next/headers";
import type { SiteLocale } from "@/lib/sitePreferences";
import { STORAGE_LOCALE } from "@/lib/sitePreferences";
import { parseAcceptLanguageLocale } from "@/lib/localeNegotiation";

/**
 * Effective locale for SSR/metadata. Uses `reels-locale` cookie when present;
 * otherwise falls back to `Accept-Language` (same rule as middleware) so the
 * first HTML response matches the browser language before the cookie is stored.
 */
export async function getSiteLocale(): Promise<SiteLocale> {
  const jar = await cookies();
  const v = jar.get(STORAGE_LOCALE)?.value;
  if (v === "en" || v === "ko") return v;
  const h = await headers();
  return parseAcceptLanguageLocale(h.get("accept-language"));
}
