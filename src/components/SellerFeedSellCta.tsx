"use client";

import Link from "next/link";
import { SellerFeedOwnerQuickMenu } from "@/components/SellerFeedOwnerQuickMenu";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useTranslation } from "@/hooks/useTranslation";

/** 내 피드(`/seller/{내 user id}`)에서만 — 프로필 카드 테두리 바깥 상단 */
export function SellerFeedSellCta({ sellerId }: { sellerId: string }) {
  const { user, loading: authLoading } = useAuthSession();
  const { t } = useTranslation();

  if (authLoading || !user?.id || user.id !== sellerId) return null;

  return (
    <div className="mb-3 flex flex-wrap items-center gap-3 sm:mb-4">
      <SellerFeedOwnerQuickMenu sellerId={sellerId} />
      <Link
        href="/sell"
        className="min-w-0 inline-flex items-center gap-1 text-[16px] font-semibold hover:underline"
      >
        <span
          className="shrink-0 text-[22px] font-semibold leading-none text-[color:var(--reels-point)]"
          aria-hidden
        >
          +
        </span>
        <span className="text-white [html[data-theme='light']_&]:text-zinc-900">
          {t("seller.feed.sellCta")}
        </span>
      </Link>
    </div>
  );
}
