"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { ReviewStars } from "@/components/reviews/ReviewStars";
import { ReviewUserIdentity } from "@/components/reviews/ReviewUserIdentity";
import { useTranslation } from "@/hooks/useTranslation";
import type { PublicReviewRow } from "@/lib/reviews";

const BODY_PREVIEW_MAX = 52;
const reviewActionClass =
  "inline-flex items-center gap-0.5 text-[11px] font-semibold text-[color:var(--reels-point)] transition hover:underline";

type Props = {
  review: PublicReviewRow;
  bodyText: string;
  isMine: boolean;
  dateLabel: string;
  writeHref: string;
  deleteBusy: boolean;
  onDelete: () => void;
};

export function VideoDetailReviewCard({
  review,
  bodyText,
  isMine,
  dateLabel,
  writeHref,
  deleteBusy,
  onDelete,
}: Props) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const canExpand = useMemo(
    () => bodyText.trim().length > BODY_PREVIEW_MAX || bodyText.includes("\n"),
    [bodyText],
  );

  return (
    <article
      className={`relative flex min-h-[9.75rem] flex-col rounded-xl border p-3 ${
        isMine
          ? "border-[color:var(--reels-point)]/30 bg-[color:var(--reels-point)]/[0.04]"
          : "border-white/[0.07] bg-white/[0.03] [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50"
      }`}
    >
      <span className="absolute right-2.5 top-2.5 text-[10px] text-zinc-500">
        {dateLabel}
      </span>

      <div className="min-w-0 pr-12">
        <div className="flex min-w-0 flex-wrap items-center gap-1">
          <ReviewUserIdentity author={review.author} size="sm" />
          {isMine ? (
            <span className="shrink-0 text-[9px] font-semibold text-[color:var(--reels-point)]">
              {t("video.reviews.mineBadge")}
            </span>
          ) : null}
        </div>
        <div className="mt-1">
          <ReviewStars rating={review.rating} />
        </div>
      </div>

      <p
        className={`mt-2 flex-1 text-[12px] leading-snug text-zinc-400 [html[data-theme='light']_&]:text-zinc-700 ${
          expanded ? "" : "line-clamp-2"
        }`}
      >
        {bodyText}
      </p>

      {canExpand ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 self-start text-[11px] font-semibold text-[color:var(--reels-point)] hover:underline"
        >
          {expanded ? t("video.reviews.collapse") : t("video.reviews.readMore")}
        </button>
      ) : null}

      {isMine ? (
        <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-white/[0.08] pt-2 [html[data-theme='light']_&]:border-zinc-200">
          <Link href={writeHref} className={reviewActionClass}>
            <Pencil className="h-3 w-3" aria-hidden />
            {t("video.reviews.editCta")}
          </Link>
          <button
            type="button"
            disabled={deleteBusy}
            onClick={onDelete}
            className={`${reviewActionClass} disabled:opacity-50`}
          >
            <Trash2 className="h-3 w-3" aria-hidden />
            {t("video.reviews.deleteCta")}
          </button>
        </div>
      ) : null}

      {review.sellerReply ? (
        <div className="mt-2 rounded-md border border-[color:var(--reels-point)]/15 bg-[color:var(--reels-point)]/[0.04] px-2 py-1.5">
          <p className="text-[9px] font-bold text-[color:var(--reels-point)]">
            {t("video.reviews.sellerReply")}
          </p>
          <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-zinc-500">
            {review.sellerReply}
          </p>
        </div>
      ) : null}
    </article>
  );
}
