"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { VideoCard } from "@/components/VideoCard";
import { MyPageSortSelect } from "@/components/MyPageSortSelect";
import { usePurchasedVideos, type PurchasedListItem } from "@/context/PurchasedVideosContext";
import { useTranslation } from "@/hooks/useTranslation";
import { MYPAGE_OUTLINE_BTN_MD } from "@/lib/mypageOutlineCta";

type Sort = "recent" | "oldest" | "price-asc" | "price-desc";

function formatPurchasedWhen(ms: number, locale: string): string {
  if (!Number.isFinite(ms) || ms <= 0) return "—";
  const d = new Date(ms);
  return locale === "en"
    ? d.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })
    : d.toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" });
}

function sortPurchasedRows(rows: PurchasedListItem[], sort: Sort, locale: "ko" | "en"): PurchasedListItem[] {
  const copy = [...rows];
  const noPrice = 1e12;
  const titleCmp = (a: PurchasedListItem, b: PurchasedListItem) =>
    a.feed.title.localeCompare(b.feed.title, locale === "ko" ? "ko" : "en");
  switch (sort) {
    case "recent":
      return copy.sort((a, b) => {
        const byT = b.acquiredAt - a.acquiredAt;
        if (byT !== 0) return byT;
        return titleCmp(a, b);
      });
    case "oldest":
      return copy.sort((a, b) => {
        const byT = a.acquiredAt - b.acquiredAt;
        if (byT !== 0) return byT;
        return titleCmp(a, b);
      });
    case "price-asc":
      return copy.sort((a, b) => {
        const byP = (a.paidPriceWon ?? noPrice) - (b.paidPriceWon ?? noPrice);
        if (byP !== 0) return byP;
        return titleCmp(a, b);
      });
    case "price-desc":
      return copy.sort((a, b) => {
        const byP = (b.paidPriceWon ?? -1) - (a.paidPriceWon ?? -1);
        if (byP !== 0) return byP;
        return titleCmp(a, b);
      });
    default:
      return copy;
  }
}

export function MyPageAccountOverview() {
  const { purchasedItems } = usePurchasedVideos();
  const { t, locale } = useTranslation();
  const [sort, setSort] = useState<Sort>("recent");

  const sortOptions = useMemo(
    () =>
      [
        { value: "recent" as const, label: t("mypage.sort.recentPurchased") },
        { value: "oldest" as const, label: t("mypage.sort.oldestPurchased") },
        { value: "price-asc" as const, label: t("mypage.sort.priceAsc") },
        { value: "price-desc" as const, label: t("mypage.sort.priceDesc") },
      ] as const,
    [t],
  );

  const rows = useMemo(
    () => sortPurchasedRows([...purchasedItems], sort, locale === "en" ? "en" : "ko"),
    [purchasedItems, sort, locale],
  );

  if (rows.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-[16px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
          {t("accountOverview.noPurchases")}
        </p>
        <Link href="/explore" className={`mt-5 inline-flex ${MYPAGE_OUTLINE_BTN_MD}`}>
          {t("mypage.wishlist.browse")}
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-[15px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
          <span className="hidden font-medium sm:inline">{t("mypage.sort.label")}</span>
          <MyPageSortSelect
            options={[...sortOptions]}
            value={sort}
            onChange={(v) => setSort(v as Sort)}
            ariaLabel={t("mypage.purchases.sortAria")}
          />
        </label>
      </div>

      <ul className="grid list-none grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
        {rows.map((row) => {
          const sellerId = row.feed.listing?.sellerId?.trim();
          const hideSeller = !sellerId;
          const cardVideo = { ...row.feed, priceWon: row.paidPriceWon };
          const href = row.listedForSale
            ? `/video/${encodeURIComponent(row.videoId)}`
            : `/video/${encodeURIComponent(row.videoId)}/unavailable`;
          return (
            <li key={row.videoId} className="relative min-w-0">
              <VideoCard
                video={cardVideo}
                domId={`mypage-purchase-${row.videoId}`}
                className="min-w-0"
                compactHoverActions
                mypageListCard
                hideHoverActions
                hideCreatorMeta={hideSeller}
                detailHref={href}
                footerExtension={
                  <p className="border-t border-white/10 px-2.5 py-2 text-left text-[11px] leading-snug text-white [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:text-zinc-900 sm:px-3 sm:text-[12px]">
                    {t("mypage.purchases.purchasedAt", {
                      when: formatPurchasedWhen(row.acquiredAt, locale),
                    })}
                  </p>
                }
              />
            </li>
          );
        })}
      </ul>
    </>
  );
}
