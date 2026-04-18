export type ExternalProvider = "tiktok" | "youtube" | "instagram";

export type ParsedExternalMediaUrl = {
  provider: ExternalProvider;
  /** 정규화된 https 페이지 URL (oEmbed·통계용) */
  pageUrl: string;
  /** 플랫폼별 안정 키 — TikTok 숫자 id, YouTube 11자 id, Instagram shortcode */
  canonicalKey: string;
};

export type ExternalLiveStats = {
  provider: ExternalProvider;
  canonicalKey: string;
  playCount: number;
  diggCount: number;
  /** 일부 플랫폼은 HTML 파싱 실패 시 조회·좋아요 중 하나만 신뢰 가능 */
  partial?: boolean;
};
