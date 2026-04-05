import { VideoCard } from "@/components/VideoCard";
import { ALL_MARKET_VIDEOS } from "@/data/videoCatalog";
import { isMicroDna } from "@/data/videoCommerce";

/** 300원 이하 Micro DNA — 세포처럼 촘촘한 그리드 */
export function MicroDnaExploreSection() {
  const micro = [...ALL_MARKET_VIDEOS]
    .filter(isMicroDna)
    .sort((a, b) => (a.priceWon ?? 0) - (b.priceWon ?? 0));

  if (micro.length === 0) return null;

  return (
    <section
      className="border-t border-slate-200/90 bg-[#FFFFFF]"
      aria-labelledby="micro-dna-explore-heading"
    >
      <div className="mx-auto max-w-[1800px] px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <h2
          id="micro-dna-explore-heading"
          className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl"
        >
          Explore Micro DNA: 100원의 영감
        </h2>
        <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-slate-600 sm:text-[14px]">
          300원 이하 조각만 모았어요. 세포(Cell)처럼 촘촘히 붙어 있는 마이크로 DNA를 훑다 보면
          작은 영감이 바로 튀어나와요.
        </p>
        <div className="mt-4 grid grid-cols-4 gap-1 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12">
          {micro.map((v) => (
            <VideoCard
              key={`micro-explore-${v.id}`}
              video={v}
              dense
              domId={`clip-${v.id}`}
              className="min-w-0"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
