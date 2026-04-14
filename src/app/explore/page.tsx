import { ExploreReelsFeed } from "@/components/ExploreReelsFeed";
import { buildExplorePool } from "@/data/explorePool";

/** 탐색 — 틱톡/릴스형 세로 스냅 무한 스크롤 (풀은 서버에서 생성해 하이드레이션 일치) */
export default function ExplorePage() {
  const pool = buildExplorePool();
  return (
    <div className="relative min-h-[calc(100dvh-var(--header-height,4.5rem))] w-full">
      <ExploreReelsFeed pool={pool} />
    </div>
  );
}
