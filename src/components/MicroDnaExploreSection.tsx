import { VideoCard } from "@/components/VideoCard";
import { SectionMoreLink } from "@/components/SectionMoreLink";
import { ALL_MARKET_VIDEOS } from "@/data/videoCatalog";
import { isMicroDna } from "@/data/videoCommerce";

/** 300원 이하 Micro DNA — 세포처럼 촘촘한 그리드 */
export function MicroDnaExploreSection() {
  const micro = [...ALL_MARKET_VIDEOS]
    .filter(isMicroDna)
    .sort((a, b) => (a.priceWon ?? 0) - (b.priceWon ?? 0));

  if (micro.length === 0) return null;

  const half = Math.ceil(micro.length / 2);
  const firstRow = micro.slice(0, half);
  const secondRow = micro.slice(half);

  return (
    <section
      className="border-t border-white/10 bg-transparent"
      aria-labelledby="micro-dna-explore-heading"
    >
      <div className="mx-auto max-w-[1800px] px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-14 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className="min-w-0 text-left">
            <h2
              id="micro-dna-explore-heading"
              className="text-[22px] font-extrabold leading-snug tracking-tight sm:text-[26px] md:text-[28px]"
            >
              <span className="text-zinc-100">단 ! </span>
              <span className="text-reels-crimson">100~</span>
              <span className="text-zinc-100"> 원만 준비하세요 !</span>
            </h2>
            <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-zinc-500 sm:text-[16px]">
              300원 이하 조각만 모았어요.
            </p>
          </div>
          <SectionMoreLink
            category="daily"
            label="더보기"
            className="shrink-0 self-stretch sm:self-center"
          />
        </div>
        <div className="isolate mt-3 flex flex-col gap-1 sm:mt-3.5">
          <div className="flex min-h-0 w-full gap-1">
            {firstRow.map((v) => (
              <VideoCard
                key={`micro-explore-${v.id}`}
                video={v}
                dense
                overlapOnHover
                domId={`clip-${v.id}`}
                className="min-w-0 flex-1"
              />
            ))}
          </div>
          {secondRow.length > 0 ? (
            <div className="flex min-h-0 w-full gap-1">
              {secondRow.map((v) => (
                <VideoCard
                  key={`micro-explore-${v.id}`}
                  video={v}
                  dense
                  overlapOnHover
                  domId={`clip-${v.id}`}
                  className="min-w-0 flex-1"
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
