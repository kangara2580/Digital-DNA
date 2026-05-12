import Link from "next/link";
import { redirect } from "next/navigation";
import { getMarketVideoById } from "@/data/videoCommerce";
import { buildPageMetadata } from "@/lib/i18n/buildPageMetadata";
import { translate } from "@/lib/i18n/dictionaries";
import { getSiteLocale } from "@/lib/i18n/serverLocale";
import { prisma } from "@/lib/prisma";
import { isPurchasableMarketListing } from "@/lib/purchasedListingAvailability";
import { MYPAGE_OUTLINE_BTN_MD, MYPAGE_OUTLINE_BTN_SM } from "@/lib/mypageOutlineCta";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const locale = await getSiteLocale();
  const row = await prisma.video.findUnique({ where: { id }, select: { title: true } }).catch(() => null);
  const catalog = getMarketVideoById(id);
  const title = row?.title ?? catalog?.title ?? translate(locale, "video.unavailableGenericTitle");
  return buildPageMetadata({
    titleKey: "meta.videoUnavailablePurchase",
    titleVars: { title },
    descriptionKey: "meta.videoUnavailablePurchaseDescription",
  });
}

export default async function VideoNotSellingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const locale = await getSiteLocale();

  let row: { title: string; status: string } | null = null;
  try {
    const found = await prisma.video.findUnique({
      where: { id },
      select: { title: true, status: true },
    });
    row = found;
  } catch {
    row = null;
  }

  if (isPurchasableMarketListing(id, row)) {
    redirect(`/video/${encodeURIComponent(id)}`);
  }

  const catalog = getMarketVideoById(id);
  const title = row?.title ?? catalog?.title ?? translate(locale, "video.unavailableGenericTitle");

  return (
    <main className="min-h-[65vh] bg-zinc-950 px-4 py-16 text-zinc-100 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-900">
      <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-12 text-center shadow-[0_20px_60px_-24px_rgba(0,0,0,0.75)] [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50 [html[data-theme='light']_&]:shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500 [html[data-theme='light']_&]:text-zinc-500">
          ARA
        </p>
        <h1 className="mt-3 text-[1.25rem] font-semibold leading-snug tracking-tight text-zinc-50 [html[data-theme='light']_&]:text-zinc-900 sm:text-[1.375rem]">
          {title}
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
          {translate(locale, "video.unavailableNotSelling")}
        </p>
        <p className="mt-2 text-[13px] leading-relaxed text-zinc-500 [html[data-theme='light']_&]:text-zinc-500">
          {translate(locale, "video.unavailableSubcopy")}
        </p>
        <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/explore"
            className={`inline-flex justify-center ${MYPAGE_OUTLINE_BTN_MD}`}
          >
            {translate(locale, "video.unavailableBrowse")}
          </Link>
          <Link
            href="/mypage?tab=purchases"
            className={`inline-flex justify-center ${MYPAGE_OUTLINE_BTN_SM}`}
          >
            {translate(locale, "video.unavailableToPurchases")}
          </Link>
        </div>
      </div>
    </main>
  );
}
