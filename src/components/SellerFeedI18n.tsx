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

export function SellerFeedEmptyListings() {
  const { t } = useTranslation();
  return (
    <div className="bg-[var(--background)] px-2 py-16 text-center sm:py-20 [html[data-theme='light']_&]:bg-white">
      <p className="text-[15px] font-semibold text-white/80 [html[data-theme='light']_&]:text-zinc-800">
        {t("seller.feed.emptyTitle")}
      </p>
    </div>
  );
}
