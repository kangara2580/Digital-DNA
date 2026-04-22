/** 틱톡·인스타·유튜브 등 URL → 임베드용 (클라이언트 미리보기) */

import { tryExtractTikTokVideoIdFromUrl } from "@/lib/tiktokUrlParse";

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
      platform: "youtube";
      videoId: string;
      embedUrl: string;
    }
  | {
      platform: "twitter";
      href: string;
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
      const videoId = tryExtractTikTokVideoIdFromUrl(u.toString());
      if (videoId) {
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

    if (u.hostname === "youtu.be") {
      const id = u.pathname.replace(/^\//, "").split("/")[0];
      if (id && /^[\w-]{11}$/.test(id)) {
        return {
          platform: "youtube",
          videoId: id,
          embedUrl: `https://www.youtube.com/embed/${id}`,
        };
      }
    }

    if (u.hostname.includes("youtube.com") || u.hostname.includes("youtu.be")) {
      const v = u.searchParams.get("v");
      if (v && /^[\w-]{11}$/.test(v)) {
        return {
          platform: "youtube",
          videoId: v,
          embedUrl: `https://www.youtube.com/embed/${v}`,
        };
      }
      const shorts = u.pathname.match(/\/shorts\/([\w-]{11})/);
      if (shorts) {
        const videoId = shorts[1];
        return {
          platform: "youtube",
          videoId,
          embedUrl: `https://www.youtube.com/embed/${videoId}`,
        };
      }
      const embed = u.pathname.match(/\/embed\/([\w-]{11})/);
      if (embed) {
        const videoId = embed[1];
        return {
          platform: "youtube",
          videoId,
          embedUrl: `https://www.youtube.com/embed/${videoId}`,
        };
      }
    }

    if (u.hostname.includes("twitter.com") || u.hostname === "x.com" || u.hostname.endsWith(".x.com")) {
      return { platform: "twitter", href: u.toString() };
    }
  } catch {
    return { platform: "unknown", href: input };
  }

  return { platform: "unknown", href: input };
}
