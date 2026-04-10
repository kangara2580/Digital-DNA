import Link from "next/link";
import { getInspirationCategories } from "@/data/inspirationCategories";
import type { FeedVideo } from "@/data/videos";

function formatPrice(v: FeedVideo): string {
  if (v.priceWon != null) {
    return `${v.priceWon.toLocaleString("ko-KR")}원`;
  }
  return "—";
}

function InspirationVideoCell({ video }: { video: FeedVideo }) {
  return (
    <div className="inspiration-cell flex min-w-0 flex-col gap-1.5">
      <div className="inspiration-cell__media overflow-hidden rounded-[12px]">
        <video
          className="inspiration-cell__video aspect-square h-auto w-full object-cover"
          src={video.src}
          autoPlay
          loop
          muted
          playsInline
          aria-hidden
        />
      </div>
      <div className="min-w-0 px-0.5">
        <p className="truncate text-[13px] font-medium leading-snug text-[var(--text-main)]">
          {video.title}
        </p>
        <p className="text-[13px] font-bold text-[var(--primary-color)]">
          {formatPrice(video)}
        </p>
      </div>
    </div>
  );
}

function InspirationCard({
  title,
  href,
  videos,
}: {
  title: string;
  href: string;
  videos: FeedVideo[];
}) {
  return (
    <article className="inspiration-card flex min-w-0 flex-col">
      <h3 className="mb-3 text-left text-base font-bold leading-tight text-[var(--text-main)]">
        {title}
      </h3>
      <div className="inspiration-card__grid mb-3 grid grid-cols-2 gap-2">
        {videos.map((v) => (
          <InspirationVideoCell key={v.id} video={v} />
        ))}
      </div>
      <Link
        href={href}
        className="mt-auto self-start text-sm font-semibold text-[var(--primary-color)] underline-offset-2 hover:underline"
      >
        더보기
      </Link>
    </article>
  );
}

/**
 * 「영감이 필요한 순간」 — 3열 카테고리 카드, 카드당 2×2 비디오 (타이트 여백)
 */
export function InspirationCategoryGrid() {
  const categories = getInspirationCategories();

  return (
    <section
      className="inspiration-section w-full"
      aria-labelledby="inspiration-section-heading"
    >
      <div className="mx-auto max-w-[1200px] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-6 text-center">
          <h2
            id="inspiration-section-heading"
            className="text-2xl font-extrabold tracking-tight text-[var(--text-main)] sm:text-[26px]"
          >
            영감이 필요한 순간
          </h2>
          <p className="mt-2 text-[15px] text-[var(--text-sub)]">
            카테고리별로 큐레이션된 릴스를 둘러보세요
          </p>
        </div>

        <div className="inspiration-section__columns grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-4">
          {categories.map((cat) => (
            <InspirationCard
              key={cat.href}
              title={cat.title}
              href={cat.href}
              videos={cat.videos}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
