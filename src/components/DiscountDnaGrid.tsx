"use client";

import type { FeedVideo } from "@/data/videos";
import { FlashSaleCountdown } from "@/components/FlashSaleCountdown";
import { SectionMoreLink } from "@/components/SectionMoreLink";
import { VideoCard } from "@/components/VideoCard";
import { useTranslation } from "@/hooks/useTranslation";

export function DiscountDnaGrid({ videos }: { videos: FeedVideo[] }) {
  const { t } = useTranslation();

  return (
    <section
      className="mx-auto w-full max-w-[1800px] px-4 pb-6 pt-2 sm:px-6 lg:px-8"
      aria-labelledby="discount-dna-heading"
    >
      <div className="mb-3 flex flex-col gap-3 border-b border-white/10 pb-3 [html[data-theme='light']_&]:border-zinc-200 sm:flex-row sm:items-end sm:justify-between sm:gap-4 sm:pb-2">
        <div className="min-w-0 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-reels-crimson">
              Flash Sale
            </p>
            <FlashSaleCountdown />
          </div>
          <h2
            id="discount-dna-heading"
            className="text-lg font-extrabold tracking-tight text-zinc-100 [html[data-theme='light']_&]:text-zinc-900 sm:text-xl"
          >
            {t("home.discount.title")}
          </h2>
          <p className="mt-0.5 max-w-xl text-[13px] leading-snug text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
            {t("home.discount.subtitle")}
          </p>
        </div>
        <SectionMoreLink
          category="best"
          className="w-full shrink-0 sm:w-auto sm:self-end"
        />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-2.5 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {videos.map((v) => (
          <VideoCard
            key={v.id}
            video={v}
            dense
            topBadge={t("home.discount.cardBadge")}
            className="min-w-0"
          />
        ))}
      </div>
    </section>
  );
}
