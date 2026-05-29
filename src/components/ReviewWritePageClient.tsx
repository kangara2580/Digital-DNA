"use client";

import Link from "next/link";
import { ReviewVideoThumbnail } from "@/components/reviews/ReviewVideoThumbnail";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { GlobalLoading } from "@/components/GlobalLoading";
import { ReviewStars } from "@/components/reviews/ReviewStars";
import { useTranslation } from "@/hooks/useTranslation";
import { BRAND_PRIMARY_BUTTON_CLASS } from "@/lib/brandPrimaryButton";
import { REVIEW_BODY_MAX, REVIEW_BODY_MIN } from "@/lib/reviewConstants";
import { reviewFetch } from "@/lib/reviewClient";
import {
  ACCOUNT_PAGE_CONTAINER_CLASS,
  ACCOUNT_PAGE_MAIN_CLASS,
} from "@/lib/accountSidebarLayout";

type VideoMeta = {
  id: string;
  title: string;
  poster: string;
  creator: string;
};

type ReviewableRow = {
  videoId: string;
  video: VideoMeta;
  review: { rating: number; body: string } | null;
};

export function ReviewWritePageClient({ videoId }: { videoId: string }) {
  const router = useRouter();
  const { t } = useTranslation();
  const [meta, setMeta] = useState<VideoMeta | null>(null);
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  const charCount = body.length;
  const canSubmit = body.trim().length >= REVIEW_BODY_MIN && rating >= 1 && !busy;

  const load = useCallback(async () => {
    setLoading(true);
    setForbidden(false);
    try {
      const res = await fetch("/api/me/reviewable-videos", {
        cache: "no-store",
        credentials: "include",
      });
      const data = (await res.json()) as { ok?: boolean; items?: ReviewableRow[] };
      const row = data.items?.find((x) => x.videoId === videoId);
      if (!data.ok || !row) {
        setForbidden(true);
        return;
      }
      setMeta(row.video);
      if (row.review) {
        setRating(row.review.rating);
        setBody(row.review.body);
      }
    } catch {
      setForbidden(true);
    } finally {
      setLoading(false);
    }
  }, [videoId]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = useCallback(async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError("");
    try {
      const res = await reviewFetch(`/api/reviews/${encodeURIComponent(videoId)}`, {
        method: "POST",
        body: JSON.stringify({ rating, body: body.trim() }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!data.ok) {
        if (data.error === "purchase_required") {
          setForbidden(true);
        } else {
          setError(t("video.reviews.saveFailed"));
        }
        return;
      }
      setSuccess(true);
      setTimeout(() => {
        router.push(`/video/${encodeURIComponent(videoId)}`);
        router.refresh();
      }, 600);
    } catch {
      setError(t("video.reviews.networkError"));
    } finally {
      setBusy(false);
    }
  }, [canSubmit, videoId, rating, body, router, t]);

  const backHref = useMemo(() => "/mypage?tab=reviews", []);

  if (loading) {
    return (
      <main className={ACCOUNT_PAGE_MAIN_CLASS}>
        <div className={`${ACCOUNT_PAGE_CONTAINER_CLASS} py-20`}>
          <GlobalLoading size="lg" label={t("common.loading")} />
        </div>
      </main>
    );
  }

  if (forbidden || !meta) {
    return (
      <main className={ACCOUNT_PAGE_MAIN_CLASS}>
        <div className={`${ACCOUNT_PAGE_CONTAINER_CLASS} max-w-lg py-12 text-center`}>
          <p className="text-[15px] text-zinc-400">{t("mypage.reviews.writeForbidden")}</p>
          <Link href={backHref} className="mt-6 inline-block text-[14px] font-semibold text-[color:var(--reels-point)]">
            {t("mypage.reviews.backToList")}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className={ACCOUNT_PAGE_MAIN_CLASS}>
      <div className={`${ACCOUNT_PAGE_CONTAINER_CLASS} mx-auto max-w-lg pb-16 pt-6 sm:pt-10`}>
        <Link
          href={backHref}
          className="mb-6 inline-flex items-center gap-1 text-[13px] font-semibold text-zinc-400 transition hover:text-zinc-200 [html[data-theme='light']_&]:hover:text-zinc-800"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          {t("mypage.reviews.backToList")}
        </Link>

        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <div className="relative h-[112px] w-[80px] shrink-0 overflow-hidden rounded-xl sm:h-[128px] sm:w-[90px]">
            <ReviewVideoThumbnail
              videoId={videoId}
              poster={meta.poster}
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
          <h1 className="max-w-full px-2 text-[15px] font-extrabold leading-snug text-zinc-100 sm:text-[16px] [html[data-theme='light']_&]:text-zinc-900">
            {meta.title}
          </h1>
        </div>

        <div className="mt-8 space-y-6">
          <div className="flex justify-center">
            <ReviewStars
              rating={rating}
              size="lg"
              interactive
              showNumericLabel
              onRate={setRating}
            />
          </div>

          <div>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value.slice(0, REVIEW_BODY_MAX))}
              rows={5}
              maxLength={REVIEW_BODY_MAX}
              placeholder={t("video.reviews.placeholder")}
              className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-[14px] leading-relaxed text-zinc-200 outline-none transition focus:border-[color:var(--reels-point)]/40 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-900"
            />
            <p className="mt-1.5 text-right text-[11px] tabular-nums text-zinc-500">
              {t("mypage.reviews.charCount", {
                n: charCount,
                max: REVIEW_BODY_MAX,
                min: REVIEW_BODY_MIN,
              })}
            </p>
          </div>

          {error ? <p className="text-center text-[12px] text-red-400">{error}</p> : null}
          {success ? (
            <p className="text-center text-[13px] font-semibold text-[color:var(--reels-point)]">
              {t("video.reviews.done")}
            </p>
          ) : null}

          <div className="flex justify-center px-6 sm:px-10">
            <button
              type="button"
              disabled={!canSubmit || success}
              onClick={() => void submit()}
              className={`${BRAND_PRIMARY_BUTTON_CLASS} h-12 min-w-[10.5rem] px-10 text-[15px] sm:min-w-[11.5rem] sm:px-12`}
            >
              {busy ? t("video.reviews.submitting") : t("video.reviews.submit")}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
