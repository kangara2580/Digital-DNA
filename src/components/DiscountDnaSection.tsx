import { VideoCard } from "@/components/VideoCard";
import { getFlashSaleVideosSafe, videoRowToFeedVideo } from "@/lib/flashSaleVideos";

export async function DiscountDnaSection() {
  const rows = await getFlashSaleVideosSafe(24);
  if (rows.length === 0) return null;

  const videos = rows.map(videoRowToFeedVideo);

  return (
    <section
      className="mx-auto w-full max-w-[1800px] px-4 pb-6 pt-2 sm:px-6 lg:px-8"
      aria-labelledby="discount-dna-heading"
    >
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2 border-b border-slate-200/90 pb-2">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">
            Flash Sale
          </p>
          <h2
            id="discount-dna-heading"
            className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl"
          >
            할인 중인 DNA
          </h2>
          <p className="mt-0.5 max-w-xl text-[13px] leading-snug text-slate-600">
            방금 끌올된 100원 전략 조각들이 촘촘히 모여 있어요. 작은 가격 변화로 새로운 시선을
            불러보세요.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-2.5 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {videos.map((v) => (
          <VideoCard
            key={v.id}
            video={v}
            dense
            topBadge="할인 DNA"
            className="min-w-0"
          />
        ))}
      </div>
    </section>
  );
}
