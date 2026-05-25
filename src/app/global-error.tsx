"use client";

import { useEffect } from "react";
import { FriendlyErrorPageContent } from "@/components/FriendlyErrorPageContent";
import type { SiteLocale } from "@/lib/sitePreferences";
import { translate } from "@/lib/i18n/dictionaries";

function localeFromDocumentCookie(): SiteLocale {
  if (typeof document === "undefined") return "ko";
  const m = document.cookie.match(/(?:^|;\s)reels-locale=([^;]+)/);
  const v = m ? decodeURIComponent(m[1].trim()) : "";
  return v === "en" ? "en" : "ko";
}

/**
 * Root layout 실패 시 — 기술 메시지 없이 404와 동일 톤의 연결 오류 UI.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = localeFromDocumentCookie();

  useEffect(() => {
    console.error("[app/global-error]", error.digest ?? error.message, error);
  }, [error]);

  useEffect(() => {
    const suffix = translate(locale, "meta.brandSuffix");
    const heading = translate(locale, "meta.errorBoundary");
    document.title = `${heading}${suffix}`;
    let el = document.querySelector('meta[name="description"]');
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute("name", "description");
      document.head.appendChild(el);
    }
    el.setAttribute("content", translate(locale, "meta.errorBoundaryDescription"));
  }, [locale]);

  return (
    <html lang={locale === "en" ? "en" : "ko"}>
      <body className="min-h-screen bg-[#02040a] font-sans text-zinc-100 antialiased">
        <FriendlyErrorPageContent locale={locale} onRetry={reset} />
      </body>
    </html>
  );
}
