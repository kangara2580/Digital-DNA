"use client";

import { useCallback, useSyncExternalStore } from "react";
import { useOptionalSitePreferences } from "@/context/SitePreferencesContext";
import type { SiteLocale } from "@/lib/sitePreferences";
import { translate } from "@/lib/i18n/dictionaries";

function subscribeHtmlLang(onStoreChange: () => void) {
  if (typeof document === "undefined") return () => {};
  const el = document.documentElement;
  const mo = new MutationObserver(() => {
    onStoreChange();
  });
  mo.observe(el, { attributes: true, attributeFilter: ["lang"] });
  return () => mo.disconnect();
}

function getHtmlLang(): SiteLocale {
  if (typeof document === "undefined") return "ko";
  return document.documentElement.lang === "en" ? "en" : "ko";
}

/**
 * 번역용 로케일은 `SitePreferencesProvider`가 있으면 그 값을 쓰고,
 * 컨텍스트가 비어 있을 때(예: 프로바이더 밖 렌더·번들 이중 로딩)에는
 * 루트 레이아웃이 맞춰 둔 `document.documentElement.lang`을 따릅니다.
 */
export function useTranslation() {
  const prefs = useOptionalSitePreferences();
  const localeFromHtml = useSyncExternalStore(subscribeHtmlLang, getHtmlLang, getHtmlLang);
  const locale = (prefs?.locale ?? localeFromHtml) as SiteLocale;

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => translate(locale, key, vars),
    [locale],
  );

  return { t, locale };
}
