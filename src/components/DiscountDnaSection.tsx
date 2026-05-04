import { DiscountDnaGrid } from "@/components/DiscountDnaGrid";
import { getFlashSaleVideosSafe, videoRowToFeedVideo } from "@/lib/flashSaleVideos";

export async function DiscountDnaSection() {
  const rows = await getFlashSaleVideosSafe(24);
  if (rows.length === 0) return null;

  const videos = rows.map(videoRowToFeedVideo);

  return <DiscountDnaGrid videos={videos} />;
}
