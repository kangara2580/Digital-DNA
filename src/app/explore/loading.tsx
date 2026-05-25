"use client";

import { PageLoadingShell } from "@/components/GlobalLoading";
import { useTranslation } from "@/hooks/useTranslation";

export default function ExploreLoading() {
  const { t } = useTranslation();
  return (
    <div
      className="w-full bg-[#050508] [html[data-theme='light']_&]:bg-zinc-100"
      aria-busy
      aria-label={t("explore.pageLoadingAria")}
    >
      <PageLoadingShell fullViewport label={t("common.loading")} />
    </div>
  );
}
