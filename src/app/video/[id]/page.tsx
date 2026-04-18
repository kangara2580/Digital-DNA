import { notFound } from "next/navigation";
import { VideoDetailView } from "@/components/VideoDetailView";
import { getMarketVideoById } from "@/data/videoCommerce";
import { getManualTikTokPriceWonByVideoId } from "@/data/tiktokData";
import { videoRowToFeedVideo } from "@/lib/flashSaleVideos";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type TikTokOEmbed = {
  title?: string;
  author_name?: string;
  thumbnail_url?: string;
};

export default async function VideoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (id.startsWith("tiktok-")) {
    const embedId = id.slice("tiktok-".length).trim();
    if (!embedId) notFound();
    const embedUrl = `https://www.tiktok.com/embed/v2/${embedId}`;
    const priceWon = getManualTikTokPriceWonByVideoId(embedId);
    let title = `TikTok 영상 ${embedId}`;
    let creator = "@tiktok";
    let poster = "";

    try {
      const oembedUrl = new URL("https://www.tiktok.com/oembed");
      oembedUrl.searchParams.set("url", `https://www.tiktok.com/@tiktok/video/${embedId}`);
      const res = await fetch(oembedUrl, { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as TikTokOEmbed;
        title = data.title?.trim() || title;
        creator = data.author_name?.trim() || creator;
        poster = data.thumbnail_url?.trim() || poster;
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
          priceWon,
        }}
      />
    );
  }

  const catalogVideo = getMarketVideoById(id);
  if (catalogVideo) {
    return <VideoDetailView video={catalogVideo} />;
  }

  try {
    const row = await prisma.video.findUnique({ where: { id } });
    if (row) {
      return <VideoDetailView video={videoRowToFeedVideo(row)} />;
    }
  } catch {
    /* DB 미연결 등 */
  }

  notFound();
}
