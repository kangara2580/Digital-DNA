"use client";

import { useSitePreferences } from "@/context/SitePreferencesContext";
import { useTranslation } from "@/hooks/useTranslation";
import type { SiteLocale } from "@/lib/sitePreferences";

export function SellerFeedListingCount({
  videoCount,
  isDbSeller,
}: {
  videoCount: number;
  isDbSeller: boolean;
}) {
  const { t } = useTranslation();
  const { locale } = useSitePreferences();
  const loc = locale as SiteLocale;

  return (
    <p className="mt-3 text-[13px] font-medium tabular-nums text-white/[0.58] [html[data-theme='light']_&]:text-zinc-600">
      {loc === "ko" ? (
        <>
          판매 중{" "}
          <span className="font-semibold text-[color:var(--reels-point)]">{videoCount}</span>개
          {isDbSeller ? (
            <span className="text-white/35 [html[data-theme='light']_&]:text-zinc-400">
              {t("seller.feed.liveDataBadge")}
            </span>
          ) : null}
        </>
      ) : (
        <>
          {t("seller.feed.listingCount", { n: videoCount })}
          {isDbSeller ? (
            <span className="text-white/35 [html[data-theme='light']_&]:text-zinc-400">
              {t("seller.feed.liveDataBadge")}
            </span>
          ) : null}
        </>
      )}
    </p>
  );
}

export function SellerFeedClipsHeading() {
  const { t } = useTranslation();
  return (
    <h2 className="text-[clamp(1.05rem,2.6vw,1.2rem)] font-extrabold tracking-tight text-white [html[data-theme='light']_&]:text-zinc-900">
      {t("seller.feed.sectionClips")}
    </h2>
  );
}

export function SellerFeedEmptyListings() {
  const { t } = useTranslation();
  return (
    <div className="relative overflow-hidden rounded-2xl border border-dashed border-white/[0.18] bg-white/[0.02] px-6 py-14 text-center [html[data-theme='light']_&]:border-zinc-300/65 [html[data-theme='light']_&]:bg-white">
      <p className="text-[15px] font-semibold text-white/[0.92] [html[data-theme='light']_&]:text-zinc-800">
        {t("seller.feed.emptyTitle")}
      </p>
      <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-white/45 [html[data-theme='light']_&]:text-zinc-500">
        {t("seller.feed.emptyHint")}
      </p>
    </div>
  );
}
