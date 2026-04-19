"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { Heart } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { CartIcon } from "@/components/CartIcon";
import { useDopamineBasketOptional } from "@/context/DopamineBasketContext";
import { useWishlist } from "@/context/WishlistContext";
import type { FeedVideo } from "@/data/videos";
import { safePlayVideo } from "@/lib/safeVideoPlay";

function formatPrice(v: FeedVideo): string {
  if (v.priceWon != null) {
    return `${v.priceWon.toLocaleString("ko-KR")}원`;
  }
  return "—";
}

/** 「영감이 필요한 순간」 그리드 셀 — VideoCard와 동일하게 호버 시 장바구니·찜 노출 */
export function InspirationVideoCell({ video }: { video: FeedVideo }) {
  const dopamine = useDopamineBasketOptional();
  const wishlist = useWishlist();
  const reduceMotion = useReducedMotion() ?? false;
  const cartBtnRef = useRef<HTMLButtonElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const inView = useInView(wrapRef, { amount: 0.2, margin: "0px 0px -8% 0px", once: false });
  const liked = wishlist.isSaved(video.id);
  const isPexelsBlockedVideo = /^https?:\/\/videos\.pexels\.com\//i.test(video.src);
  const fallbackPoster = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 600'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='#ff0055'/><stop offset='100%' stop-color='#00f2ea'/></linearGradient></defs><rect width='600' height='600' fill='#050505'/><rect x='20' y='20' width='560' height='560' rx='36' fill='url(#g)' opacity='0.86'/></svg>",
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

  return (
    <div className="inspiration-cell group flex min-w-0 flex-col gap-1.5">
      <div
        ref={wrapRef}
        className="inspiration-cell__media relative overflow-hidden rounded-[12px]"
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
          className="pointer-events-none absolute inset-0 z-[1] bg-black/0 transition-colors duration-300 ease-out group-hover:bg-black/30 motion-reduce:group-hover:bg-black/25"
          aria-hidden
        />
        <Link
          href={`/video/${video.id}`}
          className="absolute inset-0 z-[3]"
          aria-label={`${video.title} 상세 페이지`}
        />
        <div className="pointer-events-none absolute inset-0 z-[7] flex items-center justify-center p-3">
          <div
            className="flex items-center justify-center gap-5 opacity-100 transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:duration-200 max-lg:translate-y-0 max-lg:opacity-100 translate-y-1 lg:translate-y-1 lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100 sm:gap-6"
          >
            <button
              ref={cartBtnRef}
              type="button"
              className="pointer-events-auto relative z-[8] inline-flex h-9 w-9 items-center justify-center rounded-full text-white opacity-90 transition-transform duration-300 ease-out hover:scale-110 sm:h-10 sm:w-10"
              aria-label="장바구니에 담기"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const el = cartBtnRef.current;
                if (el && dopamine) {
                  dopamine.launchFromCartButton(el, video, normalizedPoster);
                }
              }}
            >
              <CartIcon className="h-7 w-7 shrink-0 drop-shadow-md sm:h-8 sm:w-8" />
            </button>
            <button
              type="button"
              className="pointer-events-auto relative z-[8] inline-flex h-9 w-9 items-center justify-center rounded-full text-white opacity-90 transition-transform duration-300 ease-out hover:scale-110 sm:h-10 sm:w-10"
              aria-label={liked ? "찜 해제" : "찜하기"}
              aria-pressed={liked}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                wishlist.toggle(video);
              }}
            >
              <span className="relative isolate block h-7 w-7 shrink-0 sm:h-8 sm:w-8">
                <motion.span
                  className="absolute inset-0 overflow-hidden"
                  initial={false}
                  animate={{
                    clipPath: liked
                      ? "inset(0% 0% 0% 0%)"
                      : "inset(0% 0% 100% 0%)",
                  }}
                  transition={{
                    duration: reduceMotion ? 0 : 0.52,
                    ease: [0.22, 0.99, 0.36, 1],
                  }}
                >
                  <Heart
                    className="block h-full w-full"
                    fill="white"
                    stroke="none"
                    strokeWidth={0}
                    aria-hidden
                  />
                </motion.span>
                <Heart
                  className="pointer-events-none absolute inset-0 z-[1] block h-full w-full drop-shadow-md"
                  fill="none"
                  stroke="white"
                  strokeWidth={1.75}
                  aria-hidden
                />
              </span>
            </button>
          </div>
        </div>
      </div>
      <div className="min-w-0 px-0.5">
        <p className="truncate text-[13px] font-medium leading-snug text-[var(--text-main)]">
          {video.title}
        </p>
        <p className="text-[13px] font-bold text-[var(--primary-color)]">
          {formatPrice(video)}
        </p>
      </div>
    </div>
  );
}
