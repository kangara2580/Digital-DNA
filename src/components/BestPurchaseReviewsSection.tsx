import Image from "next/image";
import { ReviewBeforeAfter } from "@/components/ReviewBeforeAfter";
import { SectionMoreLink } from "@/components/SectionMoreLink";
import { buildNotionistsAvatarUrl } from "@/data/reelsAvatarPresets";
import type { PurchaseReviewPickTone } from "@/data/marketing";
import { BEST_PURCHASE_REVIEWS } from "@/data/marketing";
import { HighlightedQuote } from "@/lib/highlightText";

const PICK_BADGE: Record<
  PurchaseReviewPickTone,
  string
> = {
  rose: "bg-reels-crimson/15 text-reels-crimson ring-1 ring-reels-crimson/35",
  sky: "bg-sky-400/15 text-sky-300 ring-1 ring-sky-400/35",
  violet: "bg-violet-400/15 text-violet-300 ring-1 ring-violet-400/35",
  amber: "bg-amber-400/15 text-amber-300 ring-1 ring-amber-400/35",
  emerald: "bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-400/35",
  fuchsia: "bg-fuchsia-400/15 text-fuchsia-300 ring-1 ring-fuchsia-400/35",
  cyan: "bg-reels-cyan/15 text-reels-cyan ring-1 ring-reels-cyan/40",
  orange: "bg-orange-400/15 text-orange-300 ring-1 ring-orange-400/35",
  indigo: "bg-indigo-400/15 text-indigo-300 ring-1 ring-indigo-400/35",
};

function DealCornerIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      <path
        d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BestPurchaseReviewsSection() {
  return (
    <section
      className="border-t border-white/10 bg-gradient-to-b from-reels-void/90 via-reels-abyss to-reels-void/80 [html[data-theme='light']_&]:border-black/10 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:from-white [html[data-theme='light']_&]:via-white [html[data-theme='light']_&]:to-white"
      aria-labelledby="best-reviews-heading"
    >
      <div className="mx-auto max-w-[1800px] px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-14 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className="min-w-0 text-left">
            <h2
              id="best-reviews-heading"
              className="text-[22px] font-extrabold leading-snug tracking-tight text-zinc-100 sm:text-[26px] md:text-[28px]"
            >
              오늘의 베스트 구매평
            </h2>
          </div>
          <SectionMoreLink
            category="best"
            className="shrink-0 self-stretch sm:self-center"
          />
        </div>

        <div className="mt-6 sm:mt-8">
          <div
            className="feed-scroll feed-scroll-wide -mx-4 flex gap-4 overflow-x-auto px-4 pb-7 pt-1 sm:-mx-6 sm:gap-5 sm:px-6 sm:pb-9 lg:-mx-8 lg:px-8"
            role="region"
            aria-label="베스트 구매평 가로 목록"
            tabIndex={0}
          >
            {BEST_PURCHASE_REVIEWS.map((card) => (
              <article
                key={card.id}
                className="relative snap-start shrink-0 rounded-xl border border-white/10 bg-white/[0.045] p-5 shadow-none backdrop-blur-md [html[data-theme='light']_&]:border-black/10 [html[data-theme='light']_&]:bg-white/80 sm:p-6"
                style={{ width: "min(82vw, 320px)" }}
              >
                <div
                  className="absolute right-3 top-3 z-[1] flex items-center gap-1 rounded-full border border-reels-cyan/30 bg-gradient-to-br from-reels-cyan/25 to-reels-crimson/20 px-2 py-0.5 text-[9px] font-bold tracking-wide text-zinc-100 shadow-reels-cyan/25 sm:right-3.5 sm:top-3.5 sm:px-2.5 sm:py-1 sm:text-[10px]"
                  title={card.dealBadge}
                >
                  <DealCornerIcon className="h-3 w-3 shrink-0 opacity-95 sm:h-3.5 sm:w-3.5" />
                  <span className="leading-none">{card.dealBadge}</span>
                </div>

                <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3 pr-[4.5rem] sm:pr-[5rem]">
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide sm:text-[11px] ${PICK_BADGE[card.pickTone]}`}
                  >
                    {card.pickLabel}
                  </span>
                  <span className="rounded-md bg-white/8 px-2 py-0.5 text-[11px] font-semibold text-zinc-400">
                    {card.badge}
                  </span>
                  <span className="text-[11px] font-medium text-zinc-600">
                    카드 뉴스
                  </span>
                </div>

                <p className="mt-4 text-[15px] font-medium leading-[1.65] tracking-tight text-zinc-200 sm:text-[16px] sm:leading-[1.7]">
                  <HighlightedQuote
                    text={card.quote}
                    phrases={card.highlightPhrases}
                    markClassName="rounded-sm bg-reels-cyan/20 px-0.5 font-bold text-reels-cyan [box-decoration-break:clone]"
                  />
                </p>

                {card.reskinCompare ? (
                  <ReviewBeforeAfter
                    beforeSrc={card.reskinCompare.before}
                    afterSrc={card.reskinCompare.after}
                  />
                ) : null}

                <div className="mt-5 flex items-center gap-2.5">
                  <Image
                    src={buildNotionistsAvatarUrl(card.author)}
                    width={40}
                    height={40}
                    alt=""
                    unoptimized
                    className="h-9 w-9 shrink-0 rounded-full object-cover shadow-md ring-2 ring-white/10 ring-offset-2 ring-offset-[var(--reels-void)] sm:h-10 sm:w-10"
                  />
                  <p className="min-w-0 truncate text-[13px] font-bold text-zinc-300">
                    {card.author}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <p className="mx-auto mt-3 max-w-xl text-center text-[12px] font-medium tracking-wide text-zinc-600 [html[data-theme='light']_&]:text-zinc-700 sm:mt-4 sm:text-[13px]">
          옆으로 스크롤하여 더 많은 구매평을 확인하세요
        </p>
      </div>
    </section>
  );
}
