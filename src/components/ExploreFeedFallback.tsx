"use client";

import { GlobalLoading } from "@/components/GlobalLoading";
import { useTranslation } from "@/hooks/useTranslation";

export function ExploreFeedFallback() {
  const { t } = useTranslation();
  return (
    <div
      className="relative flex min-h-[calc(100dvh-var(--header-height,4.5rem))] w-full items-center justify-center px-4"
      aria-live="polite"
    >
      <GlobalLoading size="lg" label={t("explore.feedLoading")} />
    </div>
  );
}
