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
        <h2
          id="micro-dna-explore-heading"
          className="text-left text-[18px] font-extrabold leading-snug tracking-tight text-zinc-100 sm:text-[20px] md:text-[22px]"
        >
          영감이 필요한 순간을{" "}
          <span className="text-reels-cyan [text-shadow:0_0_10px_rgba(0,242,234,0.28),0_0_4px_rgba(0,242,234,0.12)]">
            100원
          </span>
          만 준비하세요~
        </h2>

        <div className="mt-4 flex flex-col gap-3 sm:mt-5 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className="min-w-0 text-left">
            <p className="max-w-2xl text-[15px] leading-relaxed text-zinc-500 sm:text-[16px]">
              300원 이하 릴스만 모았어요.
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
