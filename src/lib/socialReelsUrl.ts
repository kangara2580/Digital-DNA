/** 틱톡·인스타 릴스 URL → 임베드용 (클라이언트 미리보기) */

export type ParsedSocialReelsUrl =
  | {
      platform: "tiktok";
      videoId: string;
      embedUrl: string;
    }
  | {
      platform: "instagram";
      shortcode: string;
      embedUrl: string;
    }
  | {
      platform: "unknown";
      href: string;
    };

/**
 * TikTok: /@user/video/{id} 형태에서 숫자 ID 추출 → /embed/v2/{id}
 * Instagram: /reel|reels|p/{shortcode} → /reel/{code}/embed/
 */
export function parseSocialReelsUrl(raw: string): ParsedSocialReelsUrl | null {
  const input = raw.trim();
  if (!input) return null;

  try {
    const u = new URL(input.startsWith("http") ? input : `https://${input}`);

    if (u.hostname.includes("tiktok.com")) {
      const path = u.pathname;
      const m = path.match(/\/video\/(\d{10,20})/);
      if (m) {
        const videoId = m[1];
        return {
          platform: "tiktok",
          videoId,
          embedUrl: `https://www.tiktok.com/embed/v2/${videoId}`,
        };
      }
    }

    if (u.hostname.includes("instagram.com")) {
      const path = u.pathname;
      const m = path.match(/\/(?:reel|reels|p)\/([^/?#]+)/);
      if (m) {
        const shortcode = m[1];
        return {
          platform: "instagram",
          shortcode,
          embedUrl: `https://www.instagram.com/reel/${shortcode}/embed/`,
        };
      }
    }
  } catch {
    return { platform: "unknown", href: input };
  }

  return { platform: "unknown", href: input };
}
