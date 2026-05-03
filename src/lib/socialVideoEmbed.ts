/** 판매 등록폼 미리보기: YouTube · TikTok · Instagram 공유 링크 → iframe 공식 임베드 주소 */

export type SocialEmbedAspect = "16:9" | "9:16";

export type SocialVideoEmbed = {
  iframeSrc: string;
  provider: "youtube" | "tiktok" | "instagram";
  aspect: SocialEmbedAspect;
};

/** YouTube 표준 길이(11)·Shorts 등에 흔한 길이(11 또는 그 이상 문자열) 허용 */
const YOUTUBE_ID = /^[a-zA-Z0-9_-]{11}$/;

function extractYouTubeId(u: URL): string | null {
  const host = u.hostname.replace(/^www\./, "");
  if (host === "youtu.be") {
    const id = u.pathname.replace(/^\//, "").split("/")[0]?.split("?")[0] ?? "";
    return YOUTUBE_ID.test(id) ? id : null;
  }
  if (
    host === "youtube.com" ||
    host === "m.youtube.com" ||
    host === "music.youtube.com" ||
    host === "www.youtube-nocookie.com"
  ) {
    const v = u.searchParams.get("v");
    if (v && YOUTUBE_ID.test(v)) return v;
    const embed = u.pathname.match(/^\/embed\/([a-zA-Z0-9_-]{11})/);
    if (embed?.[1]) return embed[1];
    const shorts = u.pathname.match(/^\/shorts\/([a-zA-Z0-9_-]{11})/);
    if (shorts?.[1]) return shorts[1];
    const live = u.pathname.match(/^\/live\/([a-zA-Z0-9_-]{11})/);
    if (live?.[1]) return live[1];
  }
  return null;
}

/**
 * TikTok 페이지 URL에서 숫자 video id만 추출합니다.
 * `vm.tiktok.com` 등 단축 URL은 페이지 자체 리다이렉트 후 `/video/[id]` 가 있는 경우에만 처리할 수 있습니다(여기선 미지원).
 */
function extractTikTokVideoId(parsed: URL): string | null {
  const host = parsed.hostname.replace(/^www\./, "");
  const isTiktok =
    host === "tiktok.com" ||
    host.endsWith(".tiktok.com") ||
    host.endsWith(".tiktokv.com");

  if (!isTiktok) return null;

  const m = parsed.pathname.match(/\/video\/(\d{8,})/);
  if (m?.[1]) return m[1];

  const mQs = parsed.searchParams.get("item_id") ?? parsed.searchParams.get("video_id");
  if (mQs && /^\d{8,}$/.test(mQs)) return mQs;

  return null;
}

function extractInstagram(parsed: URL): { kind: string; shortcode: string } | null {
  const host = parsed.hostname.replace(/^www\./, "");
  if (host !== "instagram.com" && host !== "instagr.am") return null;

  const m = parsed.pathname.match(/^\/(p|reel|reels|tv)\/([^/?#]+)/i);
  if (!m?.[2]) return null;
  const rawKind = m[1].toLowerCase();
  const kind = rawKind === "reels" ? "reel" : rawKind;
  return { kind, shortcode: m[2] };
}

export function parseSocialVideoEmbed(rawUrl: string): SocialVideoEmbed | null {
  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed.startsWith("blob:")) return null;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;

  const ytId = extractYouTubeId(parsed);
  if (ytId) {
    return {
      provider: "youtube",
      iframeSrc: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(
        ytId,
      )}?rel=0&modestbranding=1`,
      aspect: "16:9",
    };
  }

  const tikId = extractTikTokVideoId(parsed);
  if (tikId) {
    return {
      provider: "tiktok",
      iframeSrc: `https://www.tiktok.com/embed/v2/${encodeURIComponent(tikId)}`,
      aspect: "9:16",
    };
  }

  const ig = extractInstagram(parsed);
  if (ig) {
    return {
      provider: "instagram",
      iframeSrc: `https://www.instagram.com/${ig.kind}/${encodeURIComponent(
        ig.shortcode,
      )}/embed?cr=1&v=14`,
      aspect: "9:16",
    };
  }

  return null;
}
