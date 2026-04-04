import type { FeedVideo } from "./videos";
import { SAMPLE_VIDEOS } from "./videos";

export type PurchaseReviewCard = {
  id: string;
  quote: string;
  author: string;
  badge: string;
};

export const BEST_PURCHASE_REVIEWS: PurchaseReviewCard[] = [
  {
    id: "rv-1",
    quote:
      "900원짜리 '라면 끓이는 영상' 사서 제 브이로그 인트로에 붙였는데 조회수 터졌어요. '이걸 어디다 쓰지?'가 한 번에 해결됐어요.",
    author: "@clip_editor_mina",
    badge: "실제 활용 샷",
  },
  {
    id: "rv-2",
    quote:
      "비 오는 창가 클립만 샀는데 숏폼 BGM 구간이랑 무드가 딱 맞아서 재편집 시간이 반으로 줄었습니다.",
    author: "@shorts_lab",
    badge: "실제 활용 샷",
  },
  {
    id: "rv-3",
    quote:
      "500원짜리 '넘어지는 순간' 짤 넣었더니 댓글에 웃음 이모지만 달렸어요. 비싼 스톡보다 반응이 좋았어요.",
    author: "@daily_fail_log",
    badge: "실제 활용 샷",
  },
];

function byId(id: string): FeedVideo {
  const v = SAMPLE_VIDEOS.find((x) => x.id === id);
  if (!v) throw new Error(`missing video ${id}`);
  return v;
}

export type EditorCuration = {
  id: string;
  title: string;
  description: string;
  clips: FeedVideo[];
};

export const EDITOR_CURATIONS: EditorCuration[] = [
  {
    id: "cur-apology",
    title: "여자친구한테 혼나서 빌 때 쓰기 좋은 영상 5선",
    description: "분위기 풀어 줄 잔잔·진심 무드 클립만 모았어요.",
    clips: ["5", "9", "3", "7", "11"].map(byId),
  },
  {
    id: "cur-burnout",
    title: "밤샘 과제 중 현타 올 때 넣는 짤 모음",
    description: "공감 한 방에 스트레스 날리는 리얼 타이밍.",
    clips: ["8", "5", "12", "6"].map(byId),
  },
  {
    id: "cur-monday",
    title: "월요일 아침 출근길의 지옥철 풍경",
    description: "출근 브이로그·썰 영상에 바로 얹을 수 있는 도시 리듬.",
    clips: ["2", "7", "10", "4"].map(byId),
  },
];
