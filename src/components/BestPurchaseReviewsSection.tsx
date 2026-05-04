import Image from "next/image";
import Link from "next/link";
import { buildNotionistsAvatarUrl } from "@/data/reelsAvatarPresets";
import { BEST_PURCHASE_REVIEWS } from "@/data/marketing";
import { LOCAL_TRENDING_FEED_VIDEOS } from "@/data/videos";
import { homeSectionHeadingH2ClassName } from "@/lib/homeSectionHeadingTypography";

type ReviewDetailMeta = {
  videoTitle: string;
  rating: number;
  poster: string;
  previewSrc: string;
};

const REVIEW_DETAIL_BY_ID: Record<string, ReviewDetailMeta> = {
  "rv-1": {
    videoTitle: "라면 끓이는 일상 릴스",
    rating: 5,
    poster: LOCAL_TRENDING_FEED_VIDEOS[0]?.poster ?? "",
    previewSrc: LOCAL_TRENDING_FEED_VIDEOS[0]?.src ?? "",
  },
  "rv-2": {
    videoTitle: "비 오는 창가 무드 클립",
    rating: 4,
    poster: LOCAL_TRENDING_FEED_VIDEOS[1]?.poster ?? "",
    previewSrc: LOCAL_TRENDING_FEED_VIDEOS[1]?.src ?? "",
  },
  "rv-3": {
    videoTitle: "넘어지는 순간 숏클립",
    rating: 5,
    poster: LOCAL_TRENDING_FEED_VIDEOS[2]?.poster ?? "",
    previewSrc: LOCAL_TRENDING_FEED_VIDEOS[2]?.src ?? "",
  },
  "rv-4": {
    videoTitle: "카페 거품 ASMR 하이라이트",
    rating: 4,
    poster: LOCAL_TRENDING_FEED_VIDEOS[3]?.poster ?? "",
    previewSrc: LOCAL_TRENDING_FEED_VIDEOS[3]?.src ?? "",
  },
};

function pickReviewVideoById(reviewId: string) {
  const pool = LOCAL_TRENDING_FEED_VIDEOS.filter((v) => Boolean(v.id));
  if (pool.length === 0) return null;
  let hash = 0;
  for (let i = 0; i < reviewId.length; i++) {
    hash = (hash * 31 + reviewId.charCodeAt(i)) >>> 0;
  }
  return pool[hash % pool.length] ?? pool[0] ?? null;
}

function ReviewStars({ rating }: { rating: number }) {
  return (
    <div
      className="flex items-center gap-1 leading-none py-[2px] text-white/72 [html[data-theme='light']_&]:text-amber-500"
      aria-label={`별점 ${rating}점`}
    >
        {Array.from({ length: 5 }).map((_, i) => {
          const fillRatio = Math.max(0, Math.min(1, rating - i));
          return (
            <span
              key={`star-${i}`}
              className="relative inline-flex h-[17px] w-[17px] shrink-0 overflow-visible"
            >
              <svg
                viewBox="-2 -2 28 28"
                className="h-full w-full overflow-visible"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="1.75"
                aria-hidden
              >
                <path
                  d="M12 3.8l2.52 5.11 5.64.82-4.08 3.98.96 5.62L12 16.7 6.96 19.33l.96-5.62-4.08-3.98 5.64-.82L12 3.8z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span
                className="absolute inset-y-0 left-0 overflow-hidden"
                style={{ width: `${fillRatio * 100}%` }}
              >
                <svg
                  viewBox="-2 -2 28 28"
                  className="h-full w-[17px] overflow-visible"
                  fill="currentColor"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  aria-hidden
                >
                  <path
                    d="M12 3.8l2.52 5.11 5.64.82-4.08 3.98.96 5.62L12 16.7 6.96 19.33l.96-5.62-4.08-3.98 5.64-.82L12 3.8z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </span>
        );
      })}
    </div>
  );
}

export function BestPurchaseReviewsSection() {
  const quickReviews = BEST_PURCHASE_REVIEWS.slice(0, 4);
  const marqueeReviews = [...quickReviews, ...quickReviews];

  return (
    <section
      id="best-reviews"
      className="home-ranked-strip bg-[color:var(--home-ranked-strip-bg)]"
      aria-labelledby="best-reviews-heading"
    >
      <div className="mx-auto max-w-[1800px] px-4 pb-16 pt-28 sm:px-6 sm:pb-20 sm:pt-32 lg:px-8">
        <div className="relative">
          <h2 id="best-reviews-heading" className={homeSectionHeadingH2ClassName}>
            구매 후기
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-center text-[16px] font-medium leading-relaxed tracking-[0.01em] text-white/60 [html[data-theme='light']_&]:text-zinc-700/72">
            좋다고 떠들지 않겠습니다. 직접 써본 분들의 안목을 믿어보세요.
          </p>
        </div>

        <div className="review-marquee mx-auto mt-2 max-w-[760px] pt-8 sm:mt-3 sm:pt-10">
          <div className="review-marquee-track">
            {marqueeReviews.map((card, idx) => {
              const sampleVideo = pickReviewVideoById(card.id);
              const detail = REVIEW_DETAIL_BY_ID[card.id] ?? {
                videoTitle: sampleVideo?.title ?? "인기 영상 클립 후기",
                rating: 4,
                poster: sampleVideo?.poster ?? "",
                previewSrc: sampleVideo?.src ?? "",
              };
              const detailHref = sampleVideo ? `/video/${sampleVideo.id}` : "/category/best";
              return (
                <Link
                  key={`${card.id}-${idx}`}
                  href={detailHref}
                  className="relative block h-[410px] w-[min(68vw,216px)] shrink-0 lg:w-[216px]"
                  aria-label={`${card.author} 후기 상세 영상 보기`}
                >
                  <article className="review-motion-card group absolute left-0 top-1/2 flex h-[180px] w-full -translate-y-1/2 flex-col justify-center rounded-2xl border border-white/12 bg-white/[0.04] p-4 backdrop-blur-sm transition-[height,border-color,background-color,box-shadow] duration-500 ease-out [html[data-theme='light']_&]:border-zinc-200/90 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:shadow-[0_12px_32px_-18px_rgba(15,23,42,0.12)] hover:h-[385px] hover:justify-start hover:border-white/28 hover:bg-white/[0.06] hover:shadow-[0_18px_42px_-24px_rgba(0,0,0,0.6)] [html[data-theme='light']_&]:hover:border-zinc-300 [html[data-theme='light']_&]:hover:bg-zinc-50 [html[data-theme='light']_&]:hover:shadow-[0_18px_42px_-24px_rgba(15,23,42,0.14)]">
                    <div className="review-hidden-meta mb-0 max-h-0 overflow-hidden opacity-0 transition-all duration-500 ease-out group-hover:mb-3 group-hover:max-h-[270px] group-hover:opacity-100">
                      <div className="relative mx-auto mb-2.5 aspect-[9/16] w-[54%] overflow-hidden rounded-lg border border-white/20 bg-black/35 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-100">
                        {detail.poster ? (
                          <Image
                            src={detail.poster}
                            fill
                            alt=""
                            unoptimized
                            className="object-cover"
                          />
                        ) : detail.previewSrc ? (
                          <video
                            className="h-full w-full object-cover"
                            src={detail.previewSrc}
                            muted
                            playsInline
                            loop
                            autoPlay
                            preload="metadata"
                          />
                        ) : null}
                      </div>
                      <div className="flex items-center justify-center gap-1.5">
                        <ReviewStars rating={detail.rating} />
                        <span className="text-[11px] font-semibold text-zinc-300/90 [html[data-theme='light']_&]:text-zinc-600">
                          {detail.rating.toFixed(1)}
                        </span>
                      </div>
                      <p className="mt-1.5 line-clamp-2 text-[12px] font-medium leading-relaxed text-zinc-300 [html[data-theme='light']_&]:text-zinc-600">
                        사용 영상: {detail.videoTitle}
                      </p>
                    </div>
                    <p
                      className="overflow-hidden text-[15px] leading-[1.55] text-zinc-100 [html[data-theme='light']_&]:text-zinc-900"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {card.quote}
                    </p>
                    <div className="mt-2.5 flex items-center gap-2">
                      <div className="relative h-8 w-8 overflow-hidden rounded-full">
                        <Image
                          src={buildNotionistsAvatarUrl(card.author)}
                          fill
                          alt=""
                          unoptimized
                          className="object-cover"
                        />
                      </div>
                      <p className="min-w-0 truncate text-[12px] font-semibold text-zinc-300 [html[data-theme='light']_&]:text-zinc-700">
                        {card.author}
                      </p>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
