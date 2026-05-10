"use client";

import { useTranslation } from "@/hooks/useTranslation";

/** 탐색 페이지 초기 로드·컴파일 중 스켈레톤 */
export default function ExploreLoading() {
  const { t } = useTranslation();
  return (
    <div
      className="min-h-[calc(100dvh-var(--header-height,4.5rem))] w-full bg-[#050508] [html[data-theme='light']_&]:bg-zinc-100"
      aria-busy
      aria-label={t("explore.pageLoadingAria")}
    >
      <div className="mx-auto max-w-[1800px] px-4 pb-20 pt-6 sm:px-6 md:pl-[calc(var(--reels-rail-w,0px)+1rem)] lg:px-8">
        <div className="mb-4 h-4 w-48 animate-pulse rounded bg-white/10 [html[data-theme='light']_&]:bg-zinc-200" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[9/16] animate-pulse rounded-xl bg-white/[0.06] [html[data-theme='light']_&]:bg-zinc-200/80"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
