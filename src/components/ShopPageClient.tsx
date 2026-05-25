"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CategoryClipsClient } from "@/components/CategoryClipsClient";
import { CATEGORY_SLUGS, type CategorySlug } from "@/data/videoCatalog";

function ShopPageInner() {
  const searchParams = useSearchParams();
  const raw = searchParams.get("cat") ?? "best";
  const slug: CategorySlug = CATEGORY_SLUGS.includes(raw as CategorySlug)
    ? (raw as CategorySlug)
    : "best";

  return <CategoryClipsClient slug={slug} cardTarget="purchase" />;
}

/** 쇼핑몰 — 카테고리 헤더·필터·그리드(카테고리 페이지와 동일, 카드 탭 시 구매 플로우) */
export function ShopPageClient() {
  return (
    <div className="relative min-h-[calc(100dvh-var(--header-height,4.5rem))] w-full">
      <Suspense fallback={null}>
        <ShopPageInner />
      </Suspense>
    </div>
  );
}
