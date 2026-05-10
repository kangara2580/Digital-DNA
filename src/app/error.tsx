"use client";

import { useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t, locale } = useTranslation();

  useEffect(() => {
    console.error("[app/error]", error);
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

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col gap-4 px-4 py-16 text-center text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
      <h1 className="text-xl font-extrabold">{t("error.boundaryHeading")}</h1>
      <p className="text-[14px] text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
        {error.message?.trim() || t("error.boundaryUnknown")}
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="mx-auto rounded-full bg-reels-crimson px-6 py-2.5 text-[14px] font-bold text-white"
      >
        {t("error.boundaryRetry")}
      </button>
    </div>
  );
}
