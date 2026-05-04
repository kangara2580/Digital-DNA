import { getMarketVideoById } from "@/data/videoCommerce";
import { videoRowToFeedVideo } from "@/lib/flashSaleVideos";
import { prisma } from "@/lib/prisma";

const DB_TIMEOUT_MS = 1200;

type OEmbed = {
  title?: string;
  author_name?: string;
};

async function withTimeout<T>(work: Promise<T>, timeoutMs: number): Promise<T> {
  return await Promise.race([
    work,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error("db_timeout")), timeoutMs);
    }),
  ]);
}

/** Title string for `<title>` / Open Graph (mirrors `video/[id]/page` resolution). */
export async function resolveVideoDetailSeoTitle(id: string): Promise<string | null> {
  if (id.startsWith("tiktok-")) {
    const embedId = id.slice("tiktok-".length).trim();
    if (!embedId) return null;
    const pageUrl = `https://www.tiktok.com/@tiktok/video/${embedId}`;
    let title = `TikTok · ${embedId}`;
    try {
      const oembedUrl = new URL("https://www.tiktok.com/oembed");
      oembedUrl.searchParams.set("url", pageUrl);
      const res = await fetch(oembedUrl, { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as OEmbed;
        title = data.title?.trim() || title;
      }
    } catch {
      /* ignore */
    }
    return title;
  }

  if (id.startsWith("youtube-")) {
    const vid = id.slice("youtube-".length).trim();
    if (!/^[\w-]{11}$/.test(vid)) return null;
    const pageUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(vid)}`;
    let title = `YouTube · ${vid}`;
    try {
      const oembedUrl = new URL("https://www.youtube.com/oembed");
      oembedUrl.searchParams.set("format", "json");
      oembedUrl.searchParams.set("url", pageUrl);
      const res = await fetch(oembedUrl, { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as OEmbed;
        title = data.title?.trim() || title;
      }
    } catch {
      /* ignore */
    }
    return title;
  }

  if (id.startsWith("instagram-")) {
    const code = id.slice("instagram-".length).trim();
    if (!/^[A-Za-z0-9_-]{5,32}$/.test(code)) return null;
    return `Instagram · ${code}`;
  }

  const catalogVideo = getMarketVideoById(id);
  if (catalogVideo?.title?.trim()) {
    return catalogVideo.title.trim();
  }

  try {
    const row = await withTimeout(
      prisma.video.findUnique({ where: { id } }),
      DB_TIMEOUT_MS,
    );
    if (row) {
      const v = videoRowToFeedVideo(row);
      if (v.title?.trim()) return v.title.trim();
    }
  } catch {
    /* DB unavailable */
  }

  return null;
}
