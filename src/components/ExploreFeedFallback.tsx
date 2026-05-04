"use client";

import { useTranslation } from "@/hooks/useTranslation";

export function ExploreFeedFallback() {
  const { t } = useTranslation();
  return (
    <div
      className="relative flex min-h-[calc(100dvh-var(--header-height,4.5rem))] w-full items-center justify-center px-4 text-[14px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600"
      aria-live="polite"
    >
      {t("explore.feedLoading")}
    </div>
  );
}
