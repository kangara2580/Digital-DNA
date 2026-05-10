import { buildPageMetadata } from "@/lib/i18n/buildPageMetadata";
import { SellerVideoAnalyticsDetail } from "@/components/SellerVideoAnalyticsDetail";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return buildPageMetadata({
    titleKey: "meta.videoInsight",
    descriptionKey: "meta.videoInsightDescription",
  });
}

export default async function SellerVideoAnalyticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ videoId: string }>;
  searchParams: Promise<{ days?: string; from?: string; to?: string }>;
}) {
  const { videoId } = await params;
  const sp = await searchParams;
  const daysRaw = typeof sp.days === "string" ? Number.parseInt(sp.days, 10) : 7;
  const days =
    Number.isFinite(daysRaw) && daysRaw > 0 ? Math.min(365, Math.floor(daysRaw)) : 7;
  const from = typeof sp.from === "string" ? sp.from : undefined;
  const to = typeof sp.to === "string" ? sp.to : undefined;

  return (
    <main className="mx-auto min-h-[60vh] max-w-[1100px] px-4 py-10 text-zinc-100 [html[data-theme='light']_&]:text-zinc-900 sm:px-6 lg:px-8">
      <SellerVideoAnalyticsDetail videoId={videoId} days={days} from={from} to={to} />
    </main>
  );
}
