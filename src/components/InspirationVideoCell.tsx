"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { Bookmark, Heart } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { CartIcon } from "@/components/CartIcon";
import { useDopamineBasketOptional } from "@/context/DopamineBasketContext";
import { useWishlist } from "@/context/WishlistContext";
import type { FeedVideo } from "@/data/videos";
import { useAuthSession } from "@/hooks/useAuthSession";
import { redirectToLoginStart } from "@/lib/authRequiredRedirect";
import { canonicalFavoriteVideoId } from "@/lib/favoriteVideoId";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { safePlayVideo } from "@/lib/safeVideoPlay";

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
  const wishlist = useWishlist();
  const reduceMotion = useReducedMotion() ?? false;
  const cartBtnRef = useRef<HTMLButtonElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const inView = useInView(wrapRef, { amount: 0.2, margin: "0px 0px -8% 0px", once: false });
  const wishlisted = wishlist.isSaved(video.id);
  const [likedByMe, setLikedByMe] = useState(false);
  const [likeBusy, setLikeBusy] = useState(false);
  const [likePulse, setLikePulse] = useState(false);
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

  useEffect(() => {
    let cancelled = false;
    setLikedByMe(false);
    void (async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const session = supabase ? await supabase.auth.getSession() : null;
        const token = session?.data.session?.access_token;
        const headers = token
          ? { Authorization: `Bearer ${token}` }
          : undefined;
        const res = await fetch(
          `/api/video/likes?videoId=${encodeURIComponent(canonicalFavoriteVideoId(video.id))}`,
          { cache: "no-store", headers },
        );
        if (!res.ok || cancelled) return;
        const body = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          likedByMe?: boolean;
        };
        if (!body.ok || cancelled) return;
        setLikedByMe(Boolean(body.likedByMe));
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [video.id, user?.id]);

  const toggleInternalLike = useCallback(async () => {
    if (likeBusy || authLoading) return;
    if (!supabaseConfigured || !user) {
      redirectToLoginStart();
      return;
    }
    const nextLiked = !likedByMe;
    const prevLiked = likedByMe;
    setLikedByMe(nextLiked);
    setLikePulse(true);
    window.setTimeout(() => setLikePulse(false), 170);
    setLikeBusy(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const session = supabase ? await supabase.auth.getSession() : null;
      const token = session?.data.session?.access_token;
      if (!token) throw new Error("no_token");
      const res = await fetch("/api/video/likes", {
        method: nextLiked ? "POST" : "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ videoId: canonicalFavoriteVideoId(video.id) }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        likedByMe?: boolean;
      };
      if (!res.ok || !body.ok) throw new Error("toggle_failed");
      setLikedByMe(Boolean(body.likedByMe));
    } catch {
      setLikedByMe(prevLiked);
      if (typeof window !== "undefined") {
        window.alert("좋아요 처리 중 문제가 발생했어요. 다시 시도해 주세요.");
      }
    } finally {
      setLikeBusy(false);
    }
  }, [likeBusy, authLoading, supabaseConfigured, user, likedByMe, video.id]);

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
          className="pointer-events-none absolute inset-0 z-[1] bg-black/0 transition-colors duration-300 ease-out group-hover:bg-black/50 motion-reduce:group-hover:bg-black/40"
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
              className="pointer-events-auto relative z-[8] inline-flex h-10 w-10 items-center justify-center rounded-full text-white opacity-90 transition-transform duration-300 ease-out hover:scale-110 sm:h-11 sm:w-11"
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
              <CartIcon className="h-8 w-8 shrink-0 drop-shadow-md sm:h-9 sm:w-9" />
            </button>
            <button
              type="button"
              className="pointer-events-auto relative z-[8] inline-flex h-10 w-10 items-center justify-center rounded-full text-white opacity-90 transition-transform duration-300 ease-out hover:scale-110 sm:h-11 sm:w-11"
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
                className={`h-8 w-8 shrink-0 drop-shadow-md transition-all duration-200 sm:h-9 sm:w-9 ${
                  likedByMe ? "fill-current text-[var(--reels-point)]" : "text-white"
                } ${likePulse ? "scale-110" : "scale-100"}`}
              />
            </button>
            <button
              type="button"
              className="pointer-events-auto relative z-[8] inline-flex h-10 w-10 items-center justify-center rounded-full text-white opacity-90 transition-transform duration-300 ease-out hover:scale-110 sm:h-11 sm:w-11"
              aria-label={wishlisted ? "찜 해제" : "찜하기"}
              aria-pressed={wishlisted}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                wishlist.toggle(video);
              }}
            >
              <span className="relative isolate block h-8 w-8 shrink-0 sm:h-9 sm:w-9">
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
                    className="block h-full w-full"
                    fill="white"
                    stroke="none"
                    strokeWidth={0}
                    aria-hidden
                  />
                </motion.span>
                <Bookmark
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
