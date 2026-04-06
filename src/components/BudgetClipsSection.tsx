import { clipsUnder5000Won, SAMPLE_VIDEOS } from "@/data/videos";
import { MeltingDollarIcon } from "./icons/MeltingDollarIcon";
import { SectionMoreLink } from "./SectionMoreLink";
import { VideoCard } from "./VideoCard";

const BUDGET_ROW = clipsUnder5000Won(SAMPLE_VIDEOS).slice(0, 6);

export function BudgetClipsSection() {
  return (
    <section
      className="border-t border-white/10 bg-transparent"
      aria-labelledby="budget-clips-heading"
    >
      <div className="mx-auto max-w-[1800px] px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-14 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className="min-w-0 text-left">
            <h2
              id="budget-clips-heading"
              className="flex items-center gap-2.5 text-[22px] font-extrabold leading-snug tracking-tight text-zinc-100 sm:gap-3 sm:text-[26px] md:text-[28px]"
            >
              <MeltingDollarIcon className="h-7 w-7 shrink-0 text-reels-cyan sm:h-8 sm:w-8" />
              죄책감 없는 조각 사치
            </h2>
            <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-zinc-500 sm:text-[16px]">
              가벼운 조각 쇼핑으로 채우는 오늘의 도파민
            </p>
          </div>
          <SectionMoreLink
            category="daily"
            className="shrink-0 self-stretch sm:self-center"
          />
        </div>

        <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] shadow-none backdrop-blur-md sm:mt-3.5">
          <div className="grid grid-cols-2 divide-x divide-white/10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {BUDGET_ROW.map((video) => (
              <VideoCard
                key={`budget-${video.id}`}
                video={video}
                flush
                domId={`clip-${video.id}`}
                showRelatedQuilt
                className="min-w-0 w-full"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
