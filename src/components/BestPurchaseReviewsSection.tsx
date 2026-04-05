import Image from "next/image";
import type { PurchaseReviewPickTone } from "@/data/marketing";
import { BEST_PURCHASE_REVIEWS } from "@/data/marketing";
import { HighlightedQuote } from "@/lib/highlightText";

const PICK_BADGE: Record<
  PurchaseReviewPickTone,
  string
> = {
  rose: "bg-rose-500/[0.14] text-rose-900 ring-1 ring-rose-400/40",
  sky: "bg-sky-500/[0.14] text-sky-950 ring-1 ring-sky-400/40",
  violet: "bg-violet-500/[0.14] text-violet-950 ring-1 ring-violet-400/40",
  amber: "bg-amber-500/[0.16] text-amber-950 ring-1 ring-amber-400/45",
  emerald: "bg-emerald-500/[0.14] text-emerald-950 ring-1 ring-emerald-400/40",
  fuchsia: "bg-fuchsia-500/[0.14] text-fuchsia-950 ring-1 ring-fuchsia-400/40",
  cyan: "bg-cyan-500/[0.14] text-cyan-950 ring-1 ring-cyan-400/40",
  orange: "bg-orange-500/[0.14] text-orange-950 ring-1 ring-orange-400/40",
  indigo: "bg-indigo-500/[0.14] text-indigo-950 ring-1 ring-indigo-400/40",
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
      className="border-t border-slate-200/90 bg-gradient-to-b from-slate-50/80 to-white"
      aria-labelledby="best-reviews-heading"
    >
      <div className="mx-auto max-w-[1800px] px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-14 lg:px-8">
        <div className="text-left">
          <h2
            id="best-reviews-heading"
            className="text-[22px] font-bold leading-snug tracking-tight text-[#0f172a] sm:text-[26px] md:text-[28px]"
          >
            오늘의 베스트 구매평
          </h2>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-slate-600 sm:text-[16px]">
            &quot;이걸 어디다 써?&quot;를 사라지게 하는 실제 활용 사례예요. 남들이
            이 조각으로 무엇을 만들었는지 보면, 나도 할 수 있겠다는 감이 옵니다.
          </p>
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
                className="relative snap-start shrink-0 border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6"
                style={{ width: "min(82vw, 320px)" }}
              >
                <div
                  className="absolute right-3 top-3 z-[1] flex items-center gap-1 rounded-full border border-white/20 bg-gradient-to-br from-emerald-600 to-teal-600 px-2 py-0.5 text-[9px] font-bold tracking-wide text-white shadow-[0_2px_8px_-2px_rgba(16,185,129,0.55)] sm:right-3.5 sm:top-3.5 sm:px-2.5 sm:py-1 sm:text-[10px]"
                  title={card.dealBadge}
                >
                  <DealCornerIcon className="h-3 w-3 shrink-0 opacity-95 sm:h-3.5 sm:w-3.5" />
                  <span className="leading-none">{card.dealBadge}</span>
                </div>

                <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3 pr-[4.5rem] sm:pr-[5rem]">
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide sm:text-[11px] ${PICK_BADGE[card.pickTone]}`}
                  >
                    {card.pickLabel}
                  </span>
                  <span className="rounded-md bg-slate-500/10 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                    {card.badge}
                  </span>
                  <span className="text-[11px] font-medium text-slate-400">
                    카드 뉴스
                  </span>
                </div>

                <p className="mt-4 text-[15px] font-medium leading-[1.65] tracking-tight text-slate-800 sm:text-[16px] sm:leading-[1.7]">
                  <HighlightedQuote
                    text={card.quote}
                    phrases={card.highlightPhrases}
                  />
                </p>

                <div className="mt-5 flex items-center gap-2.5">
                  {/* 소셜 피드 감성 아바타 — Dicebear (데모용) */}
                  <Image
                    src={`https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(card.author)}&backgroundType=gradientLinear`}
                    width={40}
                    height={40}
                    alt=""
                    unoptimized
                    className="h-9 w-9 shrink-0 rounded-full object-cover shadow-md ring-2 ring-white ring-offset-2 ring-offset-white sm:h-10 sm:w-10"
                  />
                  <p className="min-w-0 truncate text-[13px] font-semibold text-slate-700">
                    {card.author}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <p className="mx-auto mt-3 max-w-xl text-center text-[12px] font-medium tracking-wide text-slate-500 sm:mt-4 sm:text-[13px]">
          옆으로 스크롤하여 더 많은 구매평을 확인하세요
        </p>
      </div>
    </section>
  );
}
