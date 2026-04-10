import { ExploreReelsFeed } from "@/components/ExploreReelsFeed";

/** 탐색 — 틱톡/릴스형 세로 스냅 무한 스크롤 */
export default function ExplorePage() {
  return (
    <div className="relative min-h-[calc(100dvh-var(--header-height,4.5rem))] w-full">
      <ExploreReelsFeed />
    </div>
  );
}
