import type { ReactNode } from "react";

/**
 * 페이지 전환 래퍼 — Framer Motion 제거(일부 Safari/WebKit에서 blur/opacity 조합 시
 * 본문이 안 그려지는 사례 방지). 애니메이션은 각 섹션에서만 사용합니다.
 */
export default function Template({ children }: { children: ReactNode }) {
  return children;
}
