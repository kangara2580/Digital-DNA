import { clipsUnder5000Won, SAMPLE_VIDEOS } from "@/data/videos";
import { VideoCard } from "./VideoCard";

const BUDGET_ROW = clipsUnder5000Won(SAMPLE_VIDEOS).slice(0, 6);

export function BudgetClipsSection() {
  return (
    <section
      className="border-t border-slate-200/90 bg-[#FFFFFF]"
      aria-labelledby="budget-clips-heading"
    >
      <div className="mx-auto max-w-[1800px] px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-14 lg:px-8">
        <div className="text-left">
          <h2
            id="budget-clips-heading"
            className="text-[22px] font-bold leading-snug tracking-tight text-[#0f172a] sm:text-[26px] md:text-[28px]"
          >
            죄책감 없는 조각 사치
          </h2>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-slate-600 sm:text-[16px]">
            커피 한 잔 값도 안 되는 일상의 순간들. 500원·1,000원대부터 부담 없이
            담아 보세요.
          </p>
        </div>

        <div className="mt-3 overflow-hidden rounded-lg border border-slate-200/90 bg-white shadow-sm sm:mt-3.5">
          <div className="grid grid-cols-2 divide-x divide-slate-200 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {BUDGET_ROW.map((video) => (
              <VideoCard
                key={`budget-${video.id}`}
                video={video}
                flush
                className="min-w-0 w-full"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
