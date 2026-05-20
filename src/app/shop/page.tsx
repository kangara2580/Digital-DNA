import dynamic from "next/dynamic";
import { cache } from "react";
import { Suspense } from "react";
import { buildPageMetadata } from "@/lib/i18n/buildPageMetadata";
import { buildExplorePoolAsync } from "@/lib/publicMarketFeed";

const ExploreReelsFeed = dynamic(
  () =>
    import("@/components/ExploreReelsFeed").then((m) => m.ExploreReelsFeed),
  { ssr: true },
);

const getExplorePool = cache(() => buildExplorePoolAsync());

export async function generateMetadata() {
  return buildPageMetadata({
    titleKey: "meta.shop",
    descriptionKey: "meta.shopDescription",
  });
}

/** 쇼핑몰 — 기존 탐색 그리드, 카드 클릭 시 바로 구매 페이지로 이동 */
export default async function ShopPage() {
  const pool = await getExplorePool();
  return (
    <div className="relative min-h-[calc(100dvh-var(--header-height,4.5rem))] w-full">
      <Suspense fallback={null}>
        <ExploreReelsFeed
          pool={pool}
          initialMode="browse"
          browseCardTarget="purchase"
        />
      </Suspense>
    </div>
  );
}
