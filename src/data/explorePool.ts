import {
  ALL_MARKET_VIDEOS,
  getVideosForCategory,
} from "@/data/videoCatalog";
import type { FeedVideo } from "@/data/videos";
import { shuffleVideos } from "@/data/videos";

/**
 * 탐색(/explore) 피드용 풀. 서버 컴포넌트에서 한 번 생성해 props로 넘기면
 * SSR·클라이언트가 동일 순서를 보장해 하이드레이션 불일치를 막을 수 있음.
 */
export function buildExplorePool(): FeedVideo[] {
  const rec = getVideosForCategory("recommend");
  const portrait = rec.filter((v) => v.orientation === "portrait");
  const base = portrait.length ? portrait : rec;
  const fb =
    base.length > 0
      ? base
      : ALL_MARKET_VIDEOS.filter((v) => v.orientation === "portrait");
  const list = fb.length > 0 ? fb : ALL_MARKET_VIDEOS;
  return shuffleVideos([...list]);
}
