/** 브라우저 로컬 저장소 키 — 쿠키 정책 Preferences(개인화)와 대응 */
export const STORAGE_THEME = "reels-theme";
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
}
