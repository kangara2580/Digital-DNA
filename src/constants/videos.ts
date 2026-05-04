import type { VideoData } from "@/types/video";

/**
 * 페이스 스왑·홈 「인기순위」 로컬 클립 단일 출처 (`LOCAL_TRENDING_FEED_VIDEOS`가 여기만 참조).
 *
 * - **영상**: `public/videos/` 아래 MP4 (예: `/videos/sample1.mp4`)
 * - **썸네일**: (선택) `thumbnail_url`에 정적 이미지 경로를 넣거나, 비워 두면 코드가
 *   같은 이름의 JPG를 씁니다 — `sample1.mp4` 옆에 `public/videos/sample1.jpg` 를 두면 자동 매칭.
 *   둘 다 없으면 포스터 없이 비디오 첫 프레임만 사용합니다.
 * - **주의**: 인덱스로 다른 목록(SAMPLE_VIDEOS 등)과 썸네일을 섞지 마세요. (과거 버그 원인)
 */
export const MOCK_VIDEOS: VideoData[] = [
  {
    id: "v1",
    video_url: "/videos/sample1.mp4",
    thumbnail_url: "",
    title: "샘플 클립 1",
    titleEn: "Sample clip 1",
  },
  {
    id: "v2",
    video_url: "/videos/sample2.mp4",
    thumbnail_url: "",
    title: "샘플 클립 2",
    titleEn: "Sample clip 2",
  },
  {
    id: "v3",
    video_url: "/videos/sample3.mp4",
    thumbnail_url: "",
    title: "샘플 클립 3",
    titleEn: "Sample clip 3",
  },
  {
    id: "v4",
    video_url: "/videos/sample4.mp4",
    thumbnail_url: "",
    title: "샘플 클립 4",
    titleEn: "Sample clip 4",
  },
  {
    id: "v5",
    video_url: "/videos/sample5.mp4",
    thumbnail_url: "",
    title: "샘플 클립 5",
    titleEn: "Sample clip 5",
  },
  {
    id: "v6",
    video_url: "/videos/sample6.mp4",
    thumbnail_url: "",
    title: "샘플 클립 6",
    titleEn: "Sample clip 6",
  },
  {
    id: "v7",
    video_url: "/videos/sample7.mp4",
    thumbnail_url: "",
    title: "샘플 클립 7",
    titleEn: "Sample clip 7",
  },
  {
    id: "v8",
    video_url: "/videos/sample8.mp4",
    thumbnail_url: "",
    title: "샘플 클립 8",
    titleEn: "Sample clip 8",
  },
  {
    id: "v9",
    video_url: "/videos/sample9.mp4",
    thumbnail_url: "",
    title: "샘플 클립 9",
    titleEn: "Sample clip 9",
  },
  {
    id: "v10",
    video_url: "/videos/sample10.mp4",
    thumbnail_url: "",
    title: "샘플 클립 10",
    titleEn: "Sample clip 10",
  },
];

/** 구매 없이 맞춤 리스킨(얼굴 스왑) 스튜디오를 열 수 있는 로컬 클립 id */
export const LOCAL_FACE_SWAP_VIDEO_IDS = MOCK_VIDEOS.map((v) => v.id);
