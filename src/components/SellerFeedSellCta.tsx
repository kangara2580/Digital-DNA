"use client";

import Link from "next/link";
import { Upload } from "lucide-react";
import { SellerFeedOwnerQuickMenu } from "@/components/SellerFeedOwnerQuickMenu";
import { useAuthSession } from "@/hooks/useAuthSession";
import { MYPAGE_OUTLINE_BTN_MD } from "@/lib/mypageOutlineCta";

/** 내 피드(`/seller/{내 user id}`)에서만 — 프로필 카드 테두리 바깥 상단 */
export function SellerFeedSellCta({ sellerId }: { sellerId: string }) {
  const { user, loading: authLoading } = useAuthSession();

  if (authLoading || !user?.id || user.id !== sellerId) return null;

  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-3 sm:mb-4">
      <div className="flex min-w-0 items-center gap-3">
        <span
          className="h-9 w-[3px] shrink-0 rounded-full bg-[color:var(--reels-point)] shadow-[0_0_14px_-2px_rgba(228,41,128,0.55)]"
          aria-hidden
        />
        <Link href="/sell" className={`${MYPAGE_OUTLINE_BTN_MD} gap-2`}>
          <Upload className="h-[1.05rem] w-[1.05rem] shrink-0" strokeWidth={2.5} aria-hidden />
          판매하기
        </Link>
      </div>
      <SellerFeedOwnerQuickMenu sellerId={sellerId} />
    </div>
  );
}
