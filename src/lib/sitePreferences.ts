/** Browser localStorage keys — aligned with `/cookies` Preferences (personalization). */
export const STORAGE_THEME = "reels-theme";
/** Language preference; also stored as a first-party cookie of the same name for SSR/SEO. */
export const STORAGE_LOCALE = "reels-locale";

export type SiteLocale = "ko" | "en";

export function readStoredLocale(): SiteLocale {
  if (typeof window === "undefined") return "ko";
  try {
    const v = window.localStorage.getItem(STORAGE_LOCALE);
    return v === "en" ? "en" : "ko";
  } catch {
    return "ko";
  }
}

export function applyLocaleToDocument(locale: SiteLocale): void {
  if (typeof document === "undefined") return;
  document.documentElement.lang = locale === "en" ? "en" : "ko";
  try {
    window.localStorage.setItem(STORAGE_LOCALE, locale);
  } catch {
    /* quota / private mode */
  }
  try {
    const secure =
      typeof window !== "undefined" && window.location?.protocol === "https:";
    document.cookie = `${STORAGE_LOCALE}=${encodeURIComponent(locale)};path=/;max-age=31536000;samesite=lax${secure ? ";secure" : ""}`;
  } catch {
    /* private mode */
  }
}
