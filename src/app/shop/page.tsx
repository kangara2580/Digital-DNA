import dynamic from "next/dynamic";
import { cache } from "react";
import { buildExplorePool } from "@/data/explorePool";

const ExploreReelsFeed = dynamic(
  () =>
    import("@/components/ExploreReelsFeed").then((m) => m.ExploreReelsFeed),
  { ssr: true },
);

const getExplorePool = cache(() => buildExplorePool());

/** 쇼핑몰 — 기존 탐색 그리드, 카드 클릭 시 바로 구매 페이지로 이동 */
export default function ShopPage() {
  const pool = getExplorePool();
  return (
    <div className="relative min-h-[calc(100dvh-var(--header-height,4.5rem))] w-full">
      <ExploreReelsFeed
        pool={pool}
        initialMode="browse"
        browseCardTarget="purchase"
      />
    </div>
  );
}
