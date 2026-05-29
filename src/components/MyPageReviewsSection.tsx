"use client";

import Link from "next/link";
import { ReviewVideoThumbnail } from "@/components/reviews/ReviewVideoThumbnail";
import { useCallback, useEffect, useState } from "react";
import { useReelsConfirm } from "@/components/ReelsConfirmProvider";
import { GlobalLoading } from "@/components/GlobalLoading";
import { ReviewStars } from "@/components/reviews/ReviewStars";
import { useTranslation } from "@/hooks/useTranslation";
import { MYPAGE_OUTLINE_BTN_SM } from "@/lib/mypageOutlineCta";
import { reviewFetch } from "@/lib/reviewClient";

type ReviewableItem = {
  videoId: string;
  purchasedAt: string;
  price: number;
  video: {
    id: string;
    title: string;
    poster: string;
    creator: string;
  };
  review: {
    id: string;
    rating: number;
    body: string;
    createdAt: string;
    updatedAt: string;
  } | null;
};

function formatWhen(iso: string, locale: string) {
  const d = new Date(iso);
  return locale === "en"
    ? d.toLocaleDateString("en-US", { dateStyle: "medium" })
    : d.toLocaleDateString("ko-KR", { dateStyle: "medium" });
}

export function MyPageReviewsSection() {
  const { t, locale } = useTranslation();
  const reelsConfirm = useReelsConfirm();
  const [items, setItems] = useState<ReviewableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [deletingVideoId, setDeletingVideoId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/me/reviewable-videos", {
        cache: "no-store",
        credentials: "include",
      });
      const data = (await res.json()) as { ok?: boolean; items?: ReviewableItem[] };
      if (data.ok && Array.isArray(data.items)) {
        setItems(data.items);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const deleteReview = useCallback(
    async (videoId: string) => {
      const ok = await reelsConfirm({
        message: t("video.reviews.deleteConfirm"),
        confirmLabel: t("video.reviews.deleteConfirmAction"),
        dialogAriaLabel: t("video.reviews.deleteDialogAria"),
      });
      if (!ok) return;
      setDeletingVideoId(videoId);
      try {
        const res = await reviewFetch(`/api/reviews/${encodeURIComponent(videoId)}`, {
          method: "DELETE",
        });
        const data = (await res.json()) as { ok?: boolean };
        if (data.ok) void load();
      } finally {
        setDeletingVideoId(null);
      }
    },
    [load, reelsConfirm, t],
  );

  if (loading) {
    return (
      <div className="py-16">
        <GlobalLoading size="md" label={t("common.loading")} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="text-[15px] text-zinc-500">{t("mypage.reviews.loadError")}</p>
        <button type="button" onClick={() => void load()} className={`mt-4 ${MYPAGE_OUTLINE_BTN_SM}`}>
          {t("listings.retry")}
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-[16px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
          {t("mypage.reviews.empty")}
        </p>
        <Link href="/explore" className={`mt-5 inline-flex ${MYPAGE_OUTLINE_BTN_SM}`}>
          {t("mypage.wishlist.browse")}
        </Link>
      </div>
    );
  }

  return (
    <ul className="flex list-none flex-col gap-3">
      {items.map((row) => {
        const hasReview = !!row.review;
        const writeHref = `/mypage/reviews/${encodeURIComponent(row.videoId)}`;
        return (
          <li
            key={row.videoId}
            className="flex items-stretch gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:gap-4 sm:p-4 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:shadow-sm"
          >
            <Link
              href={`/video/${encodeURIComponent(row.videoId)}`}
              className="relative block h-[96px] w-[68px] shrink-0 overflow-hidden rounded-lg border border-white/15 sm:h-[104px] sm:w-[74px] [html[data-theme='light']_&]:border-zinc-200"
            >
              <ReviewVideoThumbnail
                videoId={row.videoId}
                poster={row.video.poster}
                className="absolute inset-0 h-full w-full object-cover"
              />
            </Link>
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-2 sm:gap-x-3">
                <Link
                  href={`/video/${encodeURIComponent(row.videoId)}`}
                  className="min-w-0 max-w-[min(100%,14rem)] truncate text-[14px] font-bold text-zinc-100 hover:underline sm:max-w-[min(100%,20rem)] [html[data-theme='light']_&]:text-zinc-900 sm:text-[15px]"
                  title={row.video.title}
                >
                  {row.video.title}
                </Link>
                <span className="text-zinc-600" aria-hidden>
                  ·
                </span>
                <span className="shrink-0 whitespace-nowrap text-[12px] text-zinc-500 sm:text-[13px]">
                  {t("mypage.reviews.purchasedAt", {
                    when: formatWhen(row.purchasedAt, locale),
                  })}
                </span>
                <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-2">
                  <Link
                    href={writeHref}
                    className={`${MYPAGE_OUTLINE_BTN_SM} px-4 py-2 text-[14px] sm:px-5`}
                  >
                    {hasReview ? t("mypage.reviews.editCta") : t("mypage.reviews.writeCta")}
                  </Link>
                  {hasReview ? (
                    <button
                      type="button"
                      disabled={deletingVideoId === row.videoId}
                      onClick={() => void deleteReview(row.videoId)}
                      className={`${MYPAGE_OUTLINE_BTN_SM} px-4 py-2 text-[14px] sm:px-5 disabled:opacity-50`}
                    >
                      {deletingVideoId === row.videoId
                        ? t("common.loading")
                        : t("mypage.reviews.deleteCta")}
                    </button>
                  ) : null}
                </div>
              </div>
              {hasReview && row.review ? (
                <div className="rounded-lg border border-white/[0.08] bg-black/20 px-2.5 py-2 [html[data-theme='light']_&]:border-zinc-100 [html[data-theme='light']_&]:bg-zinc-50">
                  <ReviewStars rating={row.review.rating} />
                  <p className="mt-1 line-clamp-2 text-[12px] text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
                    {row.review.body}
                  </p>
                </div>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
