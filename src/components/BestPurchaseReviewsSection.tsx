import { BEST_PURCHASE_REVIEWS } from "@/data/marketing";

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
                className="snap-start shrink-0 border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6"
                style={{ width: "min(82vw, 320px)" }}
              >
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <span className="rounded-md bg-[#708090]/12 px-2 py-0.5 text-[11px] font-bold text-[#5a6a78]">
                    {card.badge}
                  </span>
                  <span className="text-[11px] font-medium text-slate-400">
                    카드 뉴스
                  </span>
                </div>
                <p className="mt-4 text-[15px] font-medium leading-[1.65] tracking-tight text-slate-800 sm:text-[16px] sm:leading-[1.7]">
                  {card.quote}
                </p>
                <p className="mt-5 text-[13px] font-semibold text-slate-500">
                  {card.author}
                </p>
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
