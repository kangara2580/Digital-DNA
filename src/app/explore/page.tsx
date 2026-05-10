import dynamic from "next/dynamic";
import { cache, Suspense } from "react";
import { buildPageMetadata } from "@/lib/i18n/buildPageMetadata";
import { ExploreFeedFallback } from "@/components/ExploreFeedFallback";
import { buildExplorePool } from "@/data/explorePool";

/** HMR·첫 컴파일 시 청크 로딩 경쟁으로 MODULE_NOT_FOUND가 나는 경우를 줄이기 위해 클라이언트 번들 분리 */
const ExploreReelsFeed = dynamic(
  () =>
    import("@/components/ExploreReelsFeed").then((m) => m.ExploreReelsFeed),
  { ssr: true },
);

const getExplorePool = cache(() => buildExplorePool());

export async function generateMetadata() {
  return buildPageMetadata({
    titleKey: "meta.explore",
    descriptionKey: "meta.exploreDescription",
  });
}

/** 탐색 — 틱톡/동영상형 세로 스냅 무한 스크롤 (풀은 서버에서 생성해 하이드레이션 일치) */
export default function ExplorePage() {
  const pool = getExplorePool();
  return (
    <div className="relative min-h-[calc(100dvh-var(--header-height,4.5rem))] w-full">
      <Suspense fallback={<ExploreFeedFallback />}>
        <ExploreReelsFeed pool={pool} initialMode="watch" />
      </Suspense>
    </div>
  );
}
