import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { InspirationVideoCell } from "@/components/InspirationVideoCell";
import { getInspirationCategories } from "@/data/inspirationCategories";
import type { FeedVideo } from "@/data/videos";

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
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="min-w-0 flex-1 text-left text-base font-bold leading-tight text-[var(--text-main)]">
          {title}
        </h3>
        <Link
          href={href}
          className="group/btn inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--primary-color)]/45 bg-[var(--primary-color)]/12 px-3 py-1.5 text-[13px] font-semibold leading-none text-[var(--primary-color)] shadow-[0_1px_0_rgba(255,255,255,0.06)_inset] transition-[background-color,border-color,box-shadow,transform,color] hover:border-[var(--primary-color)]/70 hover:bg-[var(--primary-color)]/20 hover:shadow-sm active:scale-[0.98] sm:px-3.5 sm:py-2 sm:text-sm"
        >
          더보기
          <ArrowRight
            className="h-4 w-4 shrink-0 transition-transform duration-200 ease-out group-hover/btn:translate-x-0.5"
            strokeWidth={2}
            aria-hidden
          />
        </Link>
      </div>
      <div className="inspiration-card__grid grid grid-cols-2 gap-2">
        {videos.map((v) => (
          <InspirationVideoCell key={v.id} video={v} />
        ))}
      </div>
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
            카테고리별로 큐레이션된 동영상을 둘러보세요
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
