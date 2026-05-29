"use client";

import Link from "next/link";
import { ReviewVideoThumbnail } from "@/components/reviews/ReviewVideoThumbnail";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MessageSquare } from "lucide-react";
import { GlobalLoading } from "@/components/GlobalLoading";
import { ReviewStars } from "@/components/reviews/ReviewStars";
import { ReviewUserIdentity } from "@/components/reviews/ReviewUserIdentity";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useTranslation } from "@/hooks/useTranslation";
import { MyPageSortSelect } from "@/components/MyPageSortSelect";
import { reviewFetch } from "@/lib/reviewClient";
import { MYPAGE_OUTLINE_BTN_SM } from "@/lib/mypageOutlineCta";
import { BRAND_PRIMARY_BUTTON_CLASS } from "@/lib/brandPrimaryButton";
import type { PublicReviewRow, SellerReviewSort } from "@/lib/reviews";
import { fallbackReviewAuthor } from "@/lib/reviewAuthorProfileShared";

type SellerReviewRow = PublicReviewRow & {
  videoTitle: string;
  videoPoster: string;
};

type VideoOption = { id: string; title: string; poster: string };

export function SellerReviewsManageClient() {
  const { t, locale } = useTranslation();
  const { user, loading: authLoading } = useAuthSession();
  const [videos, setVideos] = useState<VideoOption[]>([]);
  const [reviews, setReviews] = useState<SellerReviewRow[]>([]);
  const [videoFilter, setVideoFilter] = useState("");
  const [sort, setSort] = useState<SellerReviewSort>("latest");
  const [loading, setLoading] = useState(true);
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({});
  const [replyBusy, setReplyBusy] = useState<string | null>(null);

  const sortOptions = useMemo(
    () => [
      { value: "latest" as const, label: t("seller.reviews.sortLatest") },
      { value: "oldest" as const, label: t("seller.reviews.sortOldest") },
      { value: "high_rating" as const, label: t("seller.reviews.sortHighRating") },
      { value: "low_rating" as const, label: t("seller.reviews.sortLowRating") },
    ],
    [t],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (videoFilter) qs.set("videoId", videoFilter);
      qs.set("sort", sort);
      const res = await reviewFetch(`/api/seller/reviews?${qs.toString()}`);
      const data = (await res.json()) as {
        ok?: boolean;
        videos?: VideoOption[];
        reviews?: SellerReviewRow[];
      };
      if (data.ok) {
        setVideos(data.videos ?? []);
        setReviews(data.reviews ?? []);
        const draft: Record<string, string> = {};
        for (const r of data.reviews ?? []) {
          if (r.sellerReply) draft[r.id] = r.sellerReply;
        }
        setReplyDraft(draft);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [videoFilter, sort]);

  useEffect(() => {
    if (!authLoading && user) void load();
    if (!authLoading && !user) setLoading(false);
  }, [load, authLoading, user]);

  const formatDate = (iso: string | null) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return locale === "en"
      ? d.toLocaleDateString("en-US", { dateStyle: "medium" })
      : d.toLocaleDateString("ko-KR", { dateStyle: "medium" });
  };

  const saveReply = async (reviewId: string) => {
    const body = (replyDraft[reviewId] ?? "").trim();
    if (body.length < 1 || body.length > 500) return;
    setReplyBusy(reviewId);
    try {
      const res = await reviewFetch(`/api/review/${encodeURIComponent(reviewId)}/seller-reply`, {
        method: "POST",
        body: JSON.stringify({ body }),
      });
      const data = (await res.json()) as { ok?: boolean };
      if (data.ok) await load();
    } finally {
      setReplyBusy(null);
    }
  };

  if (authLoading) {
    return (
      <div className="py-16">
        <GlobalLoading size="md" label={t("common.loading")} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="py-12 text-center">
        <p className="text-[15px] text-zinc-500">{t("seller.reviews.loginGate")}</p>
        <Link
          href="/login?redirect=%2Fseller%2Freviews"
          className={`mt-4 inline-flex ${MYPAGE_OUTLINE_BTN_SM}`}
        >
          {t("mypage.loginCta")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Link href="/mypage?tab=listings" className={`inline-flex ${MYPAGE_OUTLINE_BTN_SM}`}>
          {t("seller.reviews.backListings")}
        </Link>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex min-w-[10rem] flex-1 items-center gap-2 text-[13px] text-zinc-500">
          <span className="shrink-0 font-medium">{t("seller.reviews.filterVideo")}</span>
          <select
            value={videoFilter}
            onChange={(e) => setVideoFilter(e.target.value)}
            className="w-full min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-[13px] text-zinc-200 outline-none [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-900"
          >
            <option value="">{t("seller.reviews.allVideos")}</option>
            {videos.map((v) => (
              <option key={v.id} value={v.id}>
                {v.title}
              </option>
            ))}
          </select>
        </label>
        <MyPageSortSelect
          options={[...sortOptions]}
          value={sort}
          onChange={(v) => setSort(v as SellerReviewSort)}
          ariaLabel={t("seller.reviews.sortAria")}
        />
      </div>

      {loading ? (
        <div className="py-12">
          <GlobalLoading size="md" label={t("common.loading")} />
        </div>
      ) : reviews.length === 0 ? (
        <p className="py-12 text-center text-[15px] text-zinc-500">{t("seller.reviews.empty")}</p>
      ) : (
        <ul className="flex list-none flex-col gap-4">
          {reviews.map((r) => (
            <li
              key={r.id}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:shadow-sm"
            >
              <div className="mb-3 flex gap-3">
                <div className="relative h-12 w-9 shrink-0 overflow-hidden rounded-md">
                  <ReviewVideoThumbnail
                    videoId={r.videoId}
                    poster={r.videoPoster}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/video/${encodeURIComponent(r.videoId)}`}
                    className="line-clamp-1 text-[13px] font-bold text-zinc-300 hover:underline [html[data-theme='light']_&]:text-zinc-800"
                  >
                    {r.videoTitle}
                  </Link>
                  <div className="mt-2 min-w-0">
                    <ReviewUserIdentity
                      author={r.author ?? fallbackReviewAuthor(r.userId, r.nickname)}
                      size="sm"
                    />
                    <div className="mt-1">
                      <ReviewStars rating={r.rating} />
                    </div>
                    <p className="mt-1 text-[11px] text-zinc-600">{formatDate(r.createdAt)}</p>
                  </div>
                  <p className="mt-2 text-[13px] leading-relaxed text-zinc-400 [html[data-theme='light']_&]:text-zinc-700">
                    {r.body}
                  </p>
                </div>
              </div>

              <div className="mt-3 rounded-xl border border-[color:var(--reels-point)]/25 bg-[color:var(--reels-point)]/[0.06] p-3">
                <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[color:var(--reels-point)]">
                  <MessageSquare className="h-3.5 w-3.5" aria-hidden />
                  {t("seller.reviews.sellerReplyLabel")}
                </p>
                <textarea
                  value={replyDraft[r.id] ?? ""}
                  onChange={(e) =>
                    setReplyDraft((prev) => ({
                      ...prev,
                      [r.id]: e.target.value.slice(0, 500),
                    }))
                  }
                  rows={2}
                  maxLength={500}
                  placeholder={t("seller.reviews.replyPlaceholder")}
                  className="w-full resize-none rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-[13px] text-zinc-200 outline-none [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50 [html[data-theme='light']_&]:text-zinc-900"
                />
                <button
                  type="button"
                  disabled={replyBusy === r.id || !(replyDraft[r.id] ?? "").trim()}
                  onClick={() => void saveReply(r.id)}
                  className={`mt-2 ${BRAND_PRIMARY_BUTTON_CLASS} h-9 px-4 text-[12px]`}
                >
                  {replyBusy === r.id
                    ? t("seller.reviews.replySaving")
                    : r.sellerReply
                      ? t("seller.reviews.replyUpdate")
                      : t("seller.reviews.replySubmit")}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
