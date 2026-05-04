"use client";

import { useEffect } from "react";
import type { SiteLocale } from "@/lib/sitePreferences";
import { translate } from "@/lib/i18n/dictionaries";

function localeFromDocumentCookie(): SiteLocale {
  if (typeof document === "undefined") return "ko";
  const m = document.cookie.match(/(?:^|;\s)reels-locale=([^;]+)/);
  const v = m ? decodeURIComponent(m[1].trim()) : "";
  return v === "en" ? "en" : "ko";
}

/**
 * Root-level error surface when the root layout fails. Keeps its own `html`/`body`
 * per Next.js rules; locale follows `reels-locale` (no React providers).
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
    console.error("[app/global-error]", error);
  }, [error]);

  useEffect(() => {
    const suffix = translate(locale, "meta.brandSuffix");
    const heading = translate(locale, "error.globalHeading");
    document.title = `${heading}${suffix}`;
    let el = document.querySelector('meta[name="description"]');
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute("name", "description");
      document.head.appendChild(el);
    }
    el.setAttribute("content", translate(locale, "error.globalBody"));
  }, [locale]);

  return (
    <html lang={locale === "en" ? "en" : "ko"}>
      <body className="min-h-screen bg-[#02040a] font-sans text-zinc-100 antialiased">
        <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col gap-4 px-4 py-16 text-center">
          <h1 className="text-xl font-extrabold">
            {translate(locale, "error.globalHeading")}
          </h1>
          <p className="text-[14px] text-zinc-400">
            {error.message?.trim() ||
              translate(locale, "error.globalBody")}
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="mx-auto rounded-full bg-reels-crimson px-6 py-2.5 text-[14px] font-bold text-white"
          >
            {translate(locale, "error.globalRetry")}
          </button>
        </div>
      </body>
    </html>
  );
}
