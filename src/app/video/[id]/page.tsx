import { notFound } from "next/navigation";
import { VideoDetailView } from "@/components/VideoDetailView";
import { getMarketVideoById } from "@/data/videoCommerce";
import {
  getExternalRankDemoPriceWonByCanonical,
  getManualTikTokPriceWonByVideoId,
} from "@/data/tiktokData";
import { videoRowToFeedVideo } from "@/lib/flashSaleVideos";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
const DB_TIMEOUT_MS = 1200;

type TikTokOEmbed = {
  title?: string;
  author_name?: string;
  thumbnail_url?: string;
};

async function withTimeout<T>(work: Promise<T>, timeoutMs: number): Promise<T> {
  return await Promise.race([
    work,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error("db_timeout")), timeoutMs);
    }),
  ]);
}

export default async function VideoDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { id } = await params;
  const { from: fromCategory } = await searchParams;

  if (id.startsWith("tiktok-")) {
    const embedId = id.slice("tiktok-".length).trim();
    if (!embedId) notFound();
    const embedUrl = `https://www.tiktok.com/embed/v2/${embedId}`;
    const pageUrl = `https://www.tiktok.com/@tiktok/video/${embedId}`;
    const priceWon = getManualTikTokPriceWonByVideoId(embedId);
    let title = `TikTok 영상 ${embedId}`;
    let creator = "@tiktok";
    let poster = `/api/embed/poster?url=${encodeURIComponent(pageUrl)}`;

    try {
      const oembedUrl = new URL("https://www.tiktok.com/oembed");
      oembedUrl.searchParams.set("url", pageUrl);
      const res = await fetch(oembedUrl, { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as TikTokOEmbed;
        title = data.title?.trim() || title;
        creator = data.author_name?.trim() || creator;
        if (data.thumbnail_url?.trim()) {
          poster = data.thumbnail_url.trim();
        }
      }
    } catch {
      /* ignore */
    }

    return (
      <VideoDetailView
        video={{
          id,
          title,
          creator,
          src: embedUrl,
          previewSrc: embedUrl,
          poster: poster || "https://picsum.photos/seed/tiktok-detail/720/1280",
          orientation: "portrait",
          tiktokEmbedId: embedId,
          sourcePageUrl: pageUrl,
          priceWon,
        }}
        fromCategory={fromCategory}
      />
    );
  }

  if (id.startsWith("youtube-")) {
    const vid = id.slice("youtube-".length).trim();
    if (!/^[\w-]{11}$/.test(vid)) notFound();
    const pageUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(vid)}`;
    const embedUrl = `https://www.youtube.com/embed/${encodeURIComponent(vid)}`;
    const priceWon = getExternalRankDemoPriceWonByCanonical("youtube", vid);
    let title = `YouTube ${vid}`;
    let creator = "YouTube";

    try {
      const oembedUrl = new URL("https://www.youtube.com/oembed");
      oembedUrl.searchParams.set("format", "json");
      oembedUrl.searchParams.set("url", pageUrl);
      const res = await fetch(oembedUrl, { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as TikTokOEmbed;
        title = data.title?.trim() || title;
        creator = data.author_name?.trim() || creator;
      }
    } catch {
      /* ignore */
    }

    return (
      <VideoDetailView
        video={{
          id,
          title,
          creator,
          src: embedUrl,
          previewSrc: embedUrl,
          poster: `/api/embed/poster?url=${encodeURIComponent(pageUrl)}`,
          orientation: "portrait",
          youtubeVideoId: vid,
          sourcePageUrl: pageUrl,
          priceWon: priceWon ?? undefined,
        }}
        fromCategory={fromCategory}
      />
    );
  }

  if (id.startsWith("instagram-")) {
    const code = id.slice("instagram-".length).trim();
    if (!/^[A-Za-z0-9_-]{5,32}$/.test(code)) notFound();
    const pageUrl = `https://www.instagram.com/reel/${encodeURIComponent(code)}/`;
    const embedUrl = `https://www.instagram.com/p/${encodeURIComponent(code)}/embed`;
    const priceWon = getExternalRankDemoPriceWonByCanonical("instagram", code);

    return (
      <VideoDetailView
        video={{
          id,
          title: `Instagram ${code}`,
          creator: "Instagram",
          src: embedUrl,
          previewSrc: embedUrl,
          poster: `/api/embed/poster?url=${encodeURIComponent(pageUrl)}`,
          orientation: "portrait",
          instagramShortcode: code,
          sourcePageUrl: pageUrl,
          priceWon: priceWon ?? undefined,
        }}
        fromCategory={fromCategory}
      />
    );
  }

  const catalogVideo = getMarketVideoById(id);
  if (catalogVideo) {
    return <VideoDetailView video={catalogVideo} fromCategory={fromCategory} />;
  }

  try {
    const row = await withTimeout(
      prisma.video.findUnique({ where: { id } }),
      DB_TIMEOUT_MS,
    );
    if (row) {
      return <VideoDetailView video={videoRowToFeedVideo(row)} fromCategory={fromCategory} />;
    }
  } catch {
    /* DB 미연결 등 */
  }

  notFound();
}
