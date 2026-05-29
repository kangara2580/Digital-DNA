"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNestedVerticalScroll } from "@/hooks/useNestedVerticalScroll";
import { ReviewStars } from "@/components/reviews/ReviewStars";
import { useReelsConfirm } from "@/components/ReelsConfirmProvider";
import { VideoDetailReviewCard } from "@/components/reviews/VideoDetailReviewCard";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useTranslation } from "@/hooks/useTranslation";
import { reviewFetch } from "@/lib/reviewClient";
import { MYPAGE_OUTLINE_BTN_SM } from "@/lib/mypageOutlineCta";
import type { PublicReviewRow, ReviewStats } from "@/lib/reviews";
import { textHasHangul } from "@/lib/textHasHangul";

type ReviewSort = "latest" | "rating";

export function VideoDetailReviewsSection({ videoId }: { videoId: string }) {
  const { user } = useAuthSession();
  const { t, locale } = useTranslation();
  const confirm = useReelsConfirm();
  const [sort, setSort] = useState<ReviewSort>("latest");
  const [reviews, setReviews] = useState<PublicReviewRow[]>([]);
  const [stats, setStats] = useState<ReviewStats>({ count: 0, averageRating: null });
  const [mine, setMine] = useState<PublicReviewRow | null>(null);
  const [canWrite, setCanWrite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [ugcEnBodyById, setUgcEnBodyById] = useState<Record<string, string>>({});
  const listScrollRef = useRef<HTMLDivElement>(null);

  useNestedVerticalScroll(listScrollRef, !loading && reviews.length > 0);

  const formatRelativeDate = useCallback(
    (iso: string) => {
      const d = new Date(iso);
      const diffDays = Math.floor((Date.now() - d.getTime()) / 86400000);
      if (diffDays === 0) return t("date.relative.today");
      if (diffDays === 1) return t("date.relative.yesterday");
      if (diffDays < 7) return t("date.relative.daysAgo", { n: diffDays });
      if (diffDays < 30) return t("date.relative.weeksAgo", { n: Math.floor(diffDays / 7) });
      if (diffDays < 365) return t("date.relative.monthsAgo", { n: Math.floor(diffDays / 30) });
      return t("date.relative.yearsAgo", { n: Math.floor(diffDays / 365) });
    },
    [t],
  );

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/reviews/${encodeURIComponent(videoId)}?sort=${sort}`,
        { cache: "no-store", credentials: "include" },
      );
      const data = (await res.json()) as {
        ok?: boolean;
        reviews?: PublicReviewRow[];
        stats?: ReviewStats;
        mine?: PublicReviewRow | null;
        canWrite?: boolean;
      };
      if (data.ok) {
        setReviews(data.reviews ?? []);
        setStats(data.stats ?? { count: 0, averageRating: null });
        setMine(data.mine ?? null);
        setCanWrite(!!data.canWrite);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [videoId, sort]);

  useEffect(() => {
    void fetchReviews();
  }, [fetchReviews]);

  useEffect(() => {
    if (locale !== "en" || loading || reviews.length === 0) return;
    const targets = reviews.filter((r) => textHasHangul(r.body));
    if (targets.length === 0) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/translate-ko-en", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: targets.map((r) => ({ id: r.id, text: r.body })),
          }),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          items?: { id: string; text: string }[];
        };
        if (cancelled || !data.ok || !Array.isArray(data.items)) return;
        const next: Record<string, string> = {};
        for (const it of data.items) {
          if (it.id && it.text) next[it.id] = it.text;
        }
        setUgcEnBodyById((prev) => ({ ...prev, ...next }));
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [locale, loading, reviews]);

  const requestDeleteMine = async () => {
    if (!mine || deleteBusy) return;
    const ok = await confirm({
      message: t("video.reviews.deleteConfirm"),
      confirmLabel: t("video.reviews.deleteConfirmAction"),
      dialogAriaLabel: t("video.reviews.deleteDialogAria"),
    });
    if (!ok) return;
    setDeleteBusy(true);
    try {
      const res = await reviewFetch(`/api/reviews/${encodeURIComponent(videoId)}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as { ok?: boolean };
      if (data.ok) void fetchReviews();
    } finally {
      setDeleteBusy(false);
    }
  };

  const writeHref = `/mypage/reviews/${encodeURIComponent(videoId)}`;
  const avg = stats.averageRating;
  const count = stats.count;
  const showWriteCta = user && canWrite && !mine;

  return (
    <section
      className="border-t border-white/10 pt-10 [html[data-theme='light']_&]:border-zinc-200"
      aria-labelledby="video-reviews-heading"
    >
      <div className="mb-6 flex flex-col items-center gap-4">
        <div className="flex w-full flex-col items-center gap-2">
          <h2
            id="video-reviews-heading"
            className="text-center text-lg font-extrabold tracking-tight text-zinc-100 [html[data-theme='light']_&]:text-zinc-900"
          >
            {t("video.reviews.title")}
          </h2>
          {count > 0 && avg != null ? (
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <span className="text-2xl font-black tabular-nums text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
                {avg.toFixed(1)}
              </span>
              <ReviewStars rating={avg} size="md" />
              <span className="text-[11px] text-zinc-500">
                {t("video.reviews.countParens", { n: count })}
              </span>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setSort("latest")}
            className={`rounded-full px-3 py-1.5 text-[12px] font-bold transition ${
              sort === "latest"
                ? "bg-[color:var(--reels-point)]/20 text-[color:var(--reels-point)]"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {t("video.reviews.sortLatest")}
          </button>
          <button
            type="button"
            onClick={() => setSort("rating")}
            className={`rounded-full px-3 py-1.5 text-[12px] font-bold transition ${
              sort === "rating"
                ? "bg-[color:var(--reels-point)]/20 text-[color:var(--reels-point)]"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {t("video.reviews.sortRating")}
          </button>
        </div>
      </div>

      {showWriteCta ? (
        <p className="mb-4 text-center sm:text-left">
          <Link
            href={writeHref}
            className={`${MYPAGE_OUTLINE_BTN_SM} inline-flex px-4 py-2 text-[14px]`}
          >
            {t("video.reviews.writeCta")}
          </Link>
        </p>
      ) : null}

      {loading ? (
        <p className="py-8 text-center text-[13px] text-zinc-500">{t("common.loading")}</p>
      ) : reviews.length === 0 ? (
        <p className="py-8 text-center text-[13px] text-zinc-500">{t("video.reviews.empty")}</p>
      ) : (
        <div
          ref={listScrollRef}
          data-lenis-prevent
          data-lenis-prevent-wheel
          className="max-h-[calc(9.75rem+0.625rem)] -mr-1 overflow-y-auto overscroll-y-contain pr-1 [scrollbar-gutter:stable] sm:max-h-[calc(10.25rem+0.625rem)]"
          aria-label={t("video.reviews.listAria")}
        >
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            {reviews.map((r) => {
              const isMine = user?.id === r.userId;
              const bodyText =
                locale === "en" && ugcEnBodyById[r.id] ? ugcEnBodyById[r.id] : r.body;
              return (
                <VideoDetailReviewCard
                  key={r.id}
                  review={r}
                  bodyText={bodyText}
                  isMine={!!isMine}
                  dateLabel={formatRelativeDate(r.createdAt)}
                  writeHref={writeHref}
                  deleteBusy={deleteBusy}
                  onDelete={() => void requestDeleteMine()}
                />
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
