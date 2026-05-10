"use client";

import { useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";

/** Sets `document.title` from a dictionary key + `meta.brandSuffix` (SPA locale sync). */
export function DocumentTitleI18n({ titleKey }: { titleKey: string }) {
  const { t, locale } = useTranslation();

  useEffect(() => {
    document.title = `${t(titleKey)}${t("meta.brandSuffix")}`;
  }, [titleKey, locale, t]);

  return null;
}
