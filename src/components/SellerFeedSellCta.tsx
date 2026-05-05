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
        className="min-w-0 inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[16px] font-semibold outline-none transition-[background-color] hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--reels-point)]/35 [html[data-theme='light']_&]:hover:bg-zinc-200/50 [html[data-theme='light']_&]:focus-visible:ring-reels-crimson/25"
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
