"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { Bookmark, Heart } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { CartIcon } from "@/components/CartIcon";
import { useDopamineBasketOptional } from "@/context/DopamineBasketContext";
import type { FeedVideo } from "@/data/videos";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useVideoDisplayTitle } from "@/hooks/useVideoDisplayTitle";
import { redirectToLoginStart } from "@/lib/authRequiredRedirect";
import {
  reelActionBtn,
  reelActionBtnActive,
  reelActionIcon,
  reelActionRailColumn,
  reelActionRailOuter,
  videoReelMediaContainer,
} from "@/lib/videoReelActionStyles";
import { safePlayVideo } from "@/lib/safeVideoPlay";
import { useVideoLike } from "@/hooks/useVideoLike";
import { useVideoWishlistAction } from "@/hooks/useVideoWishlistAction";
import { useVideoCartAction } from "@/hooks/useVideoCartAction";

function formatPrice(v: FeedVideo): string {
  if (v.priceWon != null) {
    return `${v.priceWon.toLocaleString("ko-KR")}원`;
  }
  return "—";
}

/** 「영감이 필요한 순간」 그리드 셀 — VideoCard와 동일하게 호버 시 장바구니·좋아요·찜 노출 */
export function InspirationVideoCell({ video }: { video: FeedVideo }) {
  const dopamine = useDopamineBasketOptional();
  const { user, loading: authLoading, supabaseConfigured } = useAuthSession();
  const displayTitle = useVideoDisplayTitle();
  const reduceMotion = useReducedMotion() ?? false;
  const cartBtnRef = useRef<HTMLButtonElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const inView = useInView(wrapRef, { amount: 0.2, margin: "0px 0px -8% 0px", once: false });
  const requireAuth = useCallback(() => {
    if (authLoading) return false;
    if (!supabaseConfigured || !user) {
      redirectToLoginStart();
      return false;
    }
    return true;
  }, [authLoading, supabaseConfigured, user]);
  const { wishlisted, toggleWishlist } = useVideoWishlistAction(video, requireAuth);
  const { inCart, toggleCartFromButton } = useVideoCartAction(
    video,
    dopamine ?? undefined,
    requireAuth,
  );
  const { likedByMe, likeBusy, toggleLike } = useVideoLike({
    videoId: video.id,
    requireAuth,
    onError: () => {
      if (typeof window !== "undefined") {
        window.alert("좋아요 처리 중 문제가 발생했어요. 다시 시도해 주세요.");
      }
    },
  });
  const [likePulse, setLikePulse] = useState(false);
  const isPexelsBlockedVideo = /^https?:\/\/videos\.pexels\.com\//i.test(video.src);
  const fallbackPoster = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 600'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='#E42980'/><stop offset='100%' stop-color='#FF2D8D'/></linearGradient></defs><rect width='600' height='600' fill='#050505'/><rect x='20' y='20' width='560' height='560' rx='36' fill='url(#g)' opacity='0.86'/></svg>",
  )}`;
  const normalizedPoster = video.poster?.trim()
    ? /^\/videos\/.+\.jpg$/i.test(video.poster)
      ? fallbackPoster
      : video.poster
    : fallbackPoster;

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (reduceMotion) {
      el.pause();
      return;
    }
    if (isPexelsBlockedVideo) {
      el.pause();
      return;
    }
    if (inView) {
      safePlayVideo(el);
    } else {
      el.pause();
    }
  }, [inView, reduceMotion, isPexelsBlockedVideo]);

  const toggleInternalLike = useCallback(async () => {
    const nextLiked = !likedByMe;
    setLikePulse(true);
    window.setTimeout(() => setLikePulse(false), 170);
    await toggleLike();
  }, [likedByMe, toggleLike]);

  return (
    <div className="inspiration-cell group flex min-w-0 flex-col gap-1.5">
      <div
        ref={wrapRef}
        className={`${videoReelMediaContainer} inspiration-cell__media relative overflow-hidden rounded-[12px]`}
      >
        <video
          ref={videoRef}
          className="inspiration-cell__video aspect-square h-auto w-full object-cover"
          src={isPexelsBlockedVideo ? undefined : video.src}
          poster={normalizedPoster}
          preload="metadata"
          loop
          muted
          playsInline
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 z-[1] bg-black/0 transition-colors duration-300 ease-out group-hover:bg-black/50 motion-reduce:group-hover:bg-black/40"
          aria-hidden
        />
        <Link
          href={`/video/${video.id}`}
          className="absolute inset-0 z-[3]"
          aria-label={`${displayTitle(video)} 상세 페이지`}
        />
        <div className={reelActionRailOuter}>
          <div className={reelActionRailColumn}>
            <button
              ref={cartBtnRef}
              type="button"
              className={`${reelActionBtn} ${inCart ? reelActionBtnActive : ""}`}
              title={inCart ? "장바구니에서 빼기" : "장바구니 담기"}
              aria-label={inCart ? "장바구니에서 빼기" : "장바구니에 담기"}
              aria-pressed={inCart}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const el = cartBtnRef.current;
                if (el) {
                  toggleCartFromButton(el, normalizedPoster);
                }
              }}
            >
              <CartIcon
                className={`${reelActionIcon} ${inCart ? "text-[var(--reels-point)]" : "text-white"}`}
              />
            </button>
            <button
              type="button"
              className={reelActionBtn}
              aria-label={likedByMe ? "좋아요 취소" : "좋아요"}
              aria-pressed={likedByMe}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                void toggleInternalLike();
              }}
              disabled={likeBusy}
            >
              <Heart
                strokeWidth={1.5}
                className={`${reelActionIcon} transition-all duration-200 ${likedByMe ? "fill-current text-[var(--reels-point)]" : "text-white"} ${likePulse ? "scale-110" : "scale-100"}`}
              />
            </button>
            <button
              type="button"
              className={`${reelActionBtn} ${wishlisted ? reelActionBtnActive : ""}`}
              aria-label={wishlisted ? "찜 해제" : "찜하기"}
              aria-pressed={wishlisted}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleWishlist();
              }}
            >
              <span className={`relative isolate block ${reelActionIcon}`}>
                <motion.span
                  className="absolute inset-0 overflow-hidden"
                  initial={false}
                  animate={{
                    clipPath: wishlisted
                      ? "inset(0% 0% 0% 0%)"
                      : "inset(0% 0% 100% 0%)",
                  }}
                  transition={{
                    duration: reduceMotion ? 0 : 0.52,
                    ease: [0.22, 0.99, 0.36, 1],
                  }}
                >
                  <Bookmark
                    className="block h-full w-full text-[var(--reels-point)]"
                    fill="currentColor"
                    stroke="none"
                    strokeWidth={0}
                    aria-hidden
                  />
                </motion.span>
                <Bookmark
                  className={`pointer-events-none absolute inset-0 z-[1] block h-full w-full ${wishlisted ? "text-[var(--reels-point)]" : "text-white"}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  aria-hidden
                />
              </span>
            </button>
          </div>
        </div>
      </div>
      <div className="min-w-0 px-0.5">
        <p className="truncate text-[13px] font-medium leading-snug text-[var(--text-main)]">
          {displayTitle(video)}
        </p>
        <p className="text-[13px] font-bold text-[var(--primary-color)]">
          {formatPrice(video)}
        </p>
      </div>
    </div>
  );
}
