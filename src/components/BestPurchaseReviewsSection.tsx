import Image from "next/image";
import { SectionMoreLink } from "@/components/SectionMoreLink";
import { buildNotionistsAvatarUrl } from "@/data/reelsAvatarPresets";
import { BEST_PURCHASE_REVIEWS } from "@/data/marketing";

export function BestPurchaseReviewsSection() {
  const quickReviews = BEST_PURCHASE_REVIEWS.slice(0, 3);

  return (
    <section
      className="border-t border-white/10 bg-transparent"
      aria-labelledby="best-reviews-heading"
    >
      <div className="mx-auto max-w-[1800px] px-4 pb-16 pt-24 sm:px-6 sm:pb-20 sm:pt-28 lg:px-8">
        <div className="relative">
          <h2
            id="best-reviews-heading"
            className="text-center text-[26px] font-extrabold leading-snug tracking-tight text-zinc-100 sm:text-[30px] md:text-[32px]"
          >
            구매 후기
          </h2>
          <SectionMoreLink
            category="best"
            className="mt-3 ml-auto w-fit shrink-0 sm:absolute sm:right-0 sm:top-1/2 sm:mt-0 sm:-translate-y-1/2"
          />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:mt-8 sm:grid-cols-2 lg:grid-cols-3">
          {quickReviews.map((card) => (
            <article
              key={card.id}
              className="rounded-2xl border border-white/12 bg-white/[0.04] p-5 backdrop-blur-sm"
            >
              <div className="mb-3 inline-flex rounded-full border border-[#00F2EA]/30 bg-[#00F2EA]/10 px-2.5 py-1 text-[10px] font-bold text-[#aafcf8]">
                {card.badge}
              </div>
              <p className="line-clamp-4 text-[15px] leading-6 text-zinc-100">
                {card.quote}
              </p>
              <div className="mt-4 flex items-center gap-2.5">
                <div className="relative h-9 w-9 overflow-hidden rounded-full">
                  <Image
                    src={buildNotionistsAvatarUrl(card.author)}
                    fill
                    alt=""
                    unoptimized
                    className="object-cover"
                  />
                </div>
                <p className="min-w-0 truncate text-[13px] font-semibold text-zinc-300">
                  {card.author}
                </p>
              </div>
            </article>
          ))}
        </div>

      </div>
    </section>
  );
}
