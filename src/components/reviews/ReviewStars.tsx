"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

export function ReviewStars({
  rating,
  size = "sm",
  interactive,
  onRate,
  showNumericLabel,
}: {
  rating: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onRate?: (r: number) => void;
  /** 선택·호버 중인 점수를 별 옆에 숫자로 표시 (작성 폼용) */
  showNumericLabel?: boolean;
}) {
  const { t } = useTranslation();
  const [hover, setHover] = useState(0);
  const filled = interactive ? hover || rating : rating;
  const cls =
    size === "lg"
      ? "h-7 w-7 sm:h-8 sm:w-8"
      : size === "md"
        ? "h-5 w-5 sm:h-6 sm:w-6"
        : "h-3.5 w-3.5";
  const numericCls =
    size === "lg"
      ? "min-w-[1.25rem] text-[28px] font-black leading-none tabular-nums sm:text-[32px]"
      : "min-w-[1rem] text-[15px] font-bold leading-none tabular-nums";

  return (
    <span
      className={`inline-flex items-center ${showNumericLabel ? "gap-2 sm:gap-3" : ""}`}
      role={interactive ? "radiogroup" : undefined}
      aria-label={t("home.reviews.starsAria", { n: Math.round(filled) })}
    >
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => {
        const starCls = `${cls} shrink-0 transition-colors ${
          i <= filled
            ? "review-star-filled fill-[color:var(--reels-point)] text-[color:var(--reels-point)]"
            : "fill-transparent text-white/30 [html[data-theme='light']_&]:text-zinc-300"
        } ${interactive ? "cursor-pointer hover:text-[color:var(--reels-point)]" : ""}`;
        if (interactive) {
          return (
            <button
              key={i}
              type="button"
              className="inline-flex p-0"
              onClick={() => onRate?.(i)}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(0)}
              aria-label={t("video.reviews.starPick", { n: i })}
            >
              <Star className={starCls} strokeWidth={1.5} aria-hidden />
            </button>
          );
        }
        return <Star key={i} className={starCls} strokeWidth={1.5} aria-hidden />;
      })}
    </span>
    {showNumericLabel && filled >= 1 ? (
      <span
        className={`${numericCls} text-[color:var(--reels-point)]`}
        aria-hidden
      >
        {filled}
      </span>
    ) : null}
    </span>
  );
}

export function ReviewAvatar({ nickname }: { nickname: string }) {
  const letter = (nickname.trim()[0] ?? "?").toUpperCase();
  return (
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[color:var(--reels-point)]/20 text-[13px] font-black text-[color:var(--reels-point)] ring-1 ring-[color:var(--reels-point)]/30 [html[data-theme='light']_&]:bg-[color:var(--reels-point)]/10"
      aria-hidden
    >
      {letter}
    </span>
  );
}
