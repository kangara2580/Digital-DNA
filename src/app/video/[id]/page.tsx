import { notFound } from "next/navigation";
import { VideoDetailView } from "@/components/VideoDetailView";
import { ALL_MARKET_VIDEO_IDS, getMarketVideoById } from "@/data/videoCommerce";

export const dynamic = "force-static";

export function generateStaticParams() {
  return ALL_MARKET_VIDEO_IDS.map((id) => ({ id }));
}

export default async function VideoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const video = getMarketVideoById(id);
  if (!video) notFound();
  return <VideoDetailView video={video} />;
}
