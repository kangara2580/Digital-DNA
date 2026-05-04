"use client";

import { useCallback } from "react";
import { useSitePreferences } from "@/context/SitePreferencesContext";
import type { SiteLocale } from "@/lib/sitePreferences";
import { translate } from "@/lib/i18n/dictionaries";

export function useTranslation() {
  const { locale } = useSitePreferences();

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => translate(locale as SiteLocale, key, vars),
    [locale],
  );

  return { t, locale: locale as SiteLocale };
}
