"use client";

import { useEffect } from "react";
import { FriendlyErrorPageContent } from "@/components/FriendlyErrorPageContent";
import { useOptionalSitePreferences } from "@/context/SitePreferencesContext";
import { useTranslation } from "@/hooks/useTranslation";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t, locale } = useTranslation();
  const prefs = useOptionalSitePreferences();
  const displayLocale = prefs?.locale ?? locale;

  useEffect(() => {
    console.error("[app/error]", error.digest ?? error.message, error);
  }, [error]);

  useEffect(() => {
    const suffix = t("meta.brandSuffix");
    const heading = t("meta.errorBoundary");
    document.title = `${heading}${suffix}`;
    let el = document.querySelector('meta[name="description"]');
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute("name", "description");
      document.head.appendChild(el);
    }
    el.setAttribute("content", t("meta.errorBoundaryDescription"));
  }, [locale, t]);

  return <FriendlyErrorPageContent locale={displayLocale} onRetry={reset} />;
}
