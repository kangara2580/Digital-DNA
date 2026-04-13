export type NoticeItem = {
  id: string;
  title: string;
  /** YYYY-MM-DD */
  date: string;
  pinned?: boolean;
  body: string;
};

/**
 * 공지사항 본문 — 운영에서 이 배열을 갱신하거나 추후 CMS로 대체할 수 있습니다.
 */
export const NOTICES: NoticeItem[] = [
  {
    id: "welcome-2026",
    title: "Digital DNA · REELS MARKET 오픈 안내",
    date: "2026-04-01",
    pinned: true,
    body:
      "안녕하세요.\n\n" +
      "숏폼 소스 마켓 Digital DNA가 정식으로 문을 열었습니다.\n" +
      "트렌드에 맞춰 큐레이션된 릴스 조각을 탐색하고, 라이선스 범위 안에서 자유롭게 창작에 활용해 보세요.\n\n" +
      "앞으로도 서비스 안내와 정책 변경은 공지사항을 통해 안내드리겠습니다.\n\n" +
      "감사합니다.",
  },
  {
    id: "policy-license-update",
    title: "라이선스 규정 페이지 개편 안내",
    date: "2026-04-10",
    body:
      "라이선스 규정 페이지가 개편되어 Free to Create(권장)·Rules for Respect(금지) 안내를 보기 쉽게 정리했습니다.\n\n" +
      "자세한 내용은 상단 메뉴의 라이선스 규정 페이지에서 확인해 주세요.",
  },
  {
    id: "maintenance-sample",
    title: "[안내] 정기 점검 일정 (예시)",
    date: "2026-04-14",
    body:
      "더 안정적인 서비스 제공을 위해 아래 시간대에 정기 점검이 진행될 수 있습니다.\n\n" +
      "· 일시: 추후 공지 시 확정\n" +
      "· 영향: 점검 시간 중 일시적으로 접속이 지연되거나 일부 기능이 제한될 수 있습니다.\n\n" +
      "실제 점검 일정이 잡히면 본 공지를 수정하거나 별도 공지로 안내드리겠습니다.",
  },
];

function sortNotices(list: NoticeItem[]): NoticeItem[] {
  return [...list].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.date.localeCompare(a.date);
  });
}

export function getSortedNotices(): NoticeItem[] {
  return sortNotices(NOTICES);
}

export function getNoticeById(id: string): NoticeItem | undefined {
  return NOTICES.find((n) => n.id === id);
}

export function getAllNoticeIds(): string[] {
  return NOTICES.map((n) => n.id);
}
