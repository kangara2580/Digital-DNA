"use client";

import Image from "next/image";
import { CheckCircle2, Star, ThumbsUp } from "lucide-react";
import { buildNotionistsAvatarUrl } from "@/data/reelsAvatarPresets";
import {
  getAverageRatingForVideo,
  getReviewCountForVideo,
  getReviewsForVideo,
} from "@/data/videoDetailReviews";

function StarRow({ rating }: { rating: number }) {
  const rounded = Math.min(5, Math.max(0, Math.round(rating)));
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Star
          key={i}
          className={`h-4 w-4 shrink-0 ${
            i < rounded
              ? "fill-amber-400 text-amber-400"
              : "text-zinc-600 [html[data-theme='light']_&]:text-zinc-400"
          }`}
          strokeWidth={i < rounded ? 0 : 1.25}
          aria-hidden
        />
      ))}
    </span>
  );
}

/** Amazon / App Store 스타일 — 평점 요약 + 검증된 구매 + 리스트 */
export function VideoDetailReviewsSection({ videoId }: { videoId: string }) {
  const reviews = getReviewsForVideo(videoId);
  const avg = getAverageRatingForVideo(videoId);
  const total = getReviewCountForVideo(videoId);

  if (reviews.length === 0 || avg == null) return null;

  return (
    <section
      className="border-t border-white/10 pt-10 [html[data-theme='light']_&]:border-zinc-200"
      aria-labelledby="video-reviews-heading"
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2
            id="video-reviews-heading"
            className="text-xl font-extrabold tracking-tight text-zinc-100 [html[data-theme='light']_&]:text-zinc-900"
          >
            Reviews & ratings
          </h2>
          <p className="mt-1 text-[13px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
            구매 후 작성된 리뷰입니다. 같은 조각으로 제작한 크리에이터들의 피드백이에요.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-4 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50">
          <p className="text-[42px] font-black tabular-nums leading-none text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
            {avg.toFixed(1)}
          </p>
          <div>
            <StarRow rating={avg} />
            <p className="mt-1 text-[12px] font-semibold text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
              {total.toLocaleString("en-US")} global ratings
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-6">
        {reviews.map((r) => (
          <article
            key={r.id}
            className="rounded-xl border border-white/10 bg-black/[0.2] p-4 sm:p-5 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white"
          >
            <div className="flex gap-3 sm:gap-4">
              <Image
                src={buildNotionistsAvatarUrl(r.author)}
                width={44}
                height={44}
                alt=""
                unoptimized
                className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-white/10 [html[data-theme='light']_&]:ring-zinc-200"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <p className="text-[14px] font-bold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
                    {r.author}
                  </p>
                  {r.verifiedPurchase ? (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-400 ring-1 ring-emerald-500/30 [html[data-theme='light']_&]:text-emerald-700">
                      <CheckCircle2 className="h-3 w-3" aria-hidden />
                      Verified purchase
                    </span>
                  ) : null}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <StarRow rating={r.rating} />
                  <span className="text-[12px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
                    {r.dateLabel}
                  </span>
                </div>
                {r.title ? (
                  <h3 className="mt-3 text-[15px] font-bold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
                    {r.title}
                  </h3>
                ) : null}
                <p className="mt-2 text-[14px] leading-relaxed text-zinc-300 [html[data-theme='light']_&]:text-zinc-700">
                  {r.body}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-semibold text-zinc-400 transition hover:border-reels-cyan/35 hover:text-reels-cyan [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:text-zinc-600"
                  >
                    <ThumbsUp className="h-3.5 w-3.5" aria-hidden />
                    Helpful · {r.helpfulCount.toLocaleString("en-US")}
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
