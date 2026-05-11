"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePurchasedVideos } from "@/context/PurchasedVideosContext";
import { useTranslation } from "@/hooks/useTranslation";
import { MYPAGE_OUTLINE_BTN_MD } from "@/lib/mypageOutlineCta";

export function MyPageAccountOverview() {
  const { purchasedItems } = usePurchasedVideos();
  const { t, locale } = useTranslation();

  const rows = useMemo(() => {
    return [...purchasedItems].sort((a, b) =>
      a.title.localeCompare(b.title, locale === "ko" ? "ko" : "en"),
    );
  }, [purchasedItems, locale]);

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
    <div className="mb-3">
      <ul className="max-h-60 space-y-1.5 overflow-y-auto pr-1 text-left text-[15px]">
        {rows.map((row) => (
          <li key={row.videoId}>
            <Link
              href={`/video/${row.videoId}`}
              className="font-medium text-zinc-200 transition hover:text-[#F07AB0] [html[data-theme='light']_&]:text-zinc-800 [html[data-theme='light']_&]:hover:text-[#E42980]"
            >
              {row.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
