"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Bookmark, Heart } from "lucide-react";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { CartIcon } from "@/components/CartIcon";
import { AuthModalGoogleStartButton } from "@/components/AuthModalGoogleStartButton";
import { AuthModalPortal } from "@/components/AuthModalPortal";
import { useDopamineBasketOptional } from "@/context/DopamineBasketContext";
import { useWishlist } from "@/context/WishlistContext";
import type { FeedVideo } from "@/data/videos";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useHoverInstantPreview } from "@/hooks/useHoverInstantPreview";
import { useLocalSamplePlayback } from "@/hooks/useLocalSamplePlayback";
import { buildAuthCallbackRedirectTo } from "@/lib/authOAuthRedirect";
import {
  authModalDialogSurface,
  authModalDismissButtonCls,
  authModalGlowBottom,
  authModalGlowTop,
} from "@/lib/authModalTheme";
import { canonicalFavoriteVideoId } from "@/lib/favoriteVideoId";
import { isLocalPublicVideo } from "@/lib/localVideoHighlight";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { sanitizePosterSrc } from "@/lib/videoPoster";

function AuthRequiredModal({
  open,
  onClose,
  onGoogleStart,
}: {
  open: boolean;
  onClose: () => void;
  onGoogleStart: () => void;
}) {
  if (!open) return null;

  return createPortal(
    <AuthModalPortal onDismiss={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="로그인 또는 회원가입"
        className={`relative w-full rounded-[24px] px-5 pb-8 pt-8 shadow-[0_60px_130px_-40px_rgba(0,0,0,0.95)] sm:rounded-[28px] sm:px-7 sm:pb-10 sm:pt-10 ${authModalDialogSurface}`}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className={authModalGlowTop} aria-hidden />
        <div className={authModalGlowBottom} aria-hidden />
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
          className={authModalDismissButtonCls}
          aria-label="닫기"
        >
          ×
        </button>
        <p className="relative text-center text-[clamp(1.85rem,6vw,2.65rem)] font-black tracking-tight text-white">
          ARA
        </p>
        <p className="relative mt-3 text-center text-[clamp(1.15rem,4.6vw,1.85rem)] font-semibold leading-tight text-zinc-100">
          로그인/회원가입
        </p>
        <AuthModalGoogleStartButton onClick={onGoogleStart} />
      </div>
    </AuthModalPortal>,
    document.body,
  );
}

/** 링 호버와 동일: 로컬은 구간 루프, 외부는 짧은 프리뷰 */
function MarqueeCardPreview({ video }: { video: FeedVideo }) {
  const reduceMotion = useReducedMotion() ?? false;
  const previewSrc = video.previewSrc ?? video.src;
  const isLocal = isLocalPublicVideo(previewSrc);
  const hover = useHoverInstantPreview(!isLocal, video, reduceMotion);
  const localPb = useLocalSamplePlayback(video.id, previewSrc, {
    enableHoverLoop: isLocal && !reduceMotion,
    reduceMotion,
  });
  const posterSrc = sanitizePosterSrc(video.poster);
  return (
    <div
      className="absolute inset-0"
      onMouseEnter={isLocal ? localPb.onEnter : hover.onEnter}
      onMouseLeave={isLocal ? localPb.onLeave : hover.onLeave}
    >
      <video
        ref={isLocal ? localPb.ref : hover.ref}
        className="absolute inset-0 h-full w-full object-cover"
        poster={isLocal ? undefined : posterSrc}
        playsInline
        muted
        preload="auto"
        loop={false}
        onTimeUpdate={isLocal ? localPb.onTimeUpdate : hover.onTimeUpdate}
      >
        <source src={previewSrc} type="video/mp4" />
      </video>
    </div>
  );
}

const actionBtn =
  "relative z-[8] inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border backdrop-blur-[2px] transition-[transform,background-color,border-color,color,box-shadow] duration-200 ease-out active:scale-[0.94] sm:h-10 sm:w-10";
const actionIcon = "h-4 w-4 shrink-0 drop-shadow-md sm:h-[18px] sm:w-[18px]";

export function HomeMarqueeVideoCard({ video }: { video: FeedVideo }) {
  const dopamine = useDopamineBasketOptional();
  const { user, loading: authLoading, supabaseConfigured } = useAuthSession();
  const wishlist = useWishlist();
  const reduceMotion = useReducedMotion() ?? false;
  const cartBtnRef = useRef<HTMLButtonElement>(null);
  const wishlisted = wishlist.isSaved(video.id);
  const inCart = dopamine?.isVideoInCart(video.id) ?? false;

  const [likedByMe, setLikedByMe] = useState(false);
  const [likeBusy, setLikeBusy] = useState(false);
  const [likePulse, setLikePulse] = useState(false);
  const [authPromptOpen, setAuthPromptOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const authPromptScrollYRef = useRef(0);

  const thumbnailSrc = sanitizePosterSrc(video.poster);
  const priceLabel =
    video.priceWon != null
      ? `${video.priceWon.toLocaleString("ko-KR")}원`
      : null;

  const requireAuth = useCallback(() => {
    if (authLoading) return false;
    if (!supabaseConfigured || !user) {
      authPromptScrollYRef.current = window.scrollY;
      setAuthPromptOpen(true);
      return false;
    }
    return true;
  }, [authLoading, supabaseConfigured, user]);

  const startGoogleAuth = useCallback(async () => {
    const next =
      typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search}${window.location.hash}`
        : "/";
    const redirectTo = buildAuthCallbackRedirectTo(next);
    const supabase = getSupabaseBrowserClient();
    if (supabase && redirectTo) {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: { prompt: "select_account" },
        },
      });
      if (!error && data.url) {
        window.location.assign(data.url);
        return;
      }
    }
    window.location.assign(`/api/auth/google/start?next=${encodeURIComponent(next)}`);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!authPromptOpen) return;
    const scrollY = authPromptScrollYRef.current;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAuthPromptOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      requestAnimationFrame(() => window.scrollTo(0, scrollY));
      window.removeEventListener("keydown", onKey);
    };
  }, [authPromptOpen]);

  useEffect(() => {
    let cancelled = false;
    setLikedByMe(false);
    if (authLoading || !user || !supabaseConfigured) return;
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
  }, [video.id, user?.id, authLoading, supabaseConfigured, user]);

  const toggleInternalLike = useCallback(async () => {
    if (likeBusy || authLoading) return;
    if (!requireAuth()) return;
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
  }, [likeBusy, authLoading, requireAuth, likedByMe, video.id]);

  const authModal: ReactNode =
    mounted ? (
      <AuthRequiredModal
        open={authPromptOpen}
        onClose={() => setAuthPromptOpen(false)}
        onGoogleStart={startGoogleAuth}
      />
    ) : null;

  const hoverRevealPrice =
    "transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:duration-150 max-lg:translate-y-0 max-lg:opacity-100 -translate-y-1 opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100 lg:group-focus-within:translate-y-0 lg:group-focus-within:opacity-100";

  const hoverRevealActions =
    "transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:duration-150 max-lg:translate-x-0 max-lg:opacity-100 translate-x-2 opacity-0 lg:group-hover:translate-x-0 lg:group-hover:opacity-100 lg:group-focus-within:translate-x-0 lg:group-focus-within:opacity-100";

  return (
    <>
      <Link
        href={`/video/${video.id}`}
        className="group relative aspect-[216/384] h-[clamp(288px,52vh,460px)] shrink-0  overflow-hidden rounded-2xl bg-black/30 shadow-[0_16px_48px_-20px_rgba(0,0,0,0.55)] outline-none transition-[transform,box-shadow,ring-width] duration-200 hover:z-[2] hover:shadow-[0_20px_56px_-18px_rgba(228,41,128,0.18)] focus-visible:ring-2 focus-visible:ring-[color:var(--reels-point)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#070708] active:ring-2 active:ring-[color:var(--reels-point)] active:ring-offset-2 active:ring-offset-[#070708] motion-reduce:transition-none [html[data-theme='light']_&]:bg-zinc-100/80 [html[data-theme='light']_&]:focus-visible:ring-offset-white [html[data-theme='light']_&]:active:ring-offset-white"
        aria-label={`${video.title} — 상세 보기`}
      >
        <div className="relative h-full w-full">
          <MarqueeCardPreview video={video} />
          <div
            className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-black/50 via-transparent to-black/20 transition-opacity duration-300 group-hover:from-black/65 motion-reduce:transition-none"
            aria-hidden
          />
          {priceLabel ? (
            <div className="pointer-events-none absolute inset-x-0 top-0 z-[4] flex justify-center px-2 pb-8 pt-2.5 sm:px-3 sm:pb-10 sm:pt-3">
              <div
                className={`w-fit max-w-[min(100%,calc(100%-3.5rem))] rounded-lg bg-gradient-to-b from-black/55 via-black/35 to-transparent px-2 py-1.5 text-center sm:max-w-[min(100%,calc(100%-4rem))] sm:px-2.5 sm:py-2 ${hoverRevealPrice}`}
              >
                <span className="inline-block max-w-full truncate text-[13px] font-bold tabular-nums text-white [text-shadow:0_1px_4px_rgba(0,0,0,0.85)] sm:text-sm">
                  {priceLabel}
                </span>
              </div>
            </div>
          ) : null}
          <div className="pointer-events-none absolute inset-y-0 right-0 z-[4] flex items-center pr-2 sm:pr-2.5">
            <div
              className={`pointer-events-auto flex flex-col items-center gap-1 sm:gap-1.5 ${hoverRevealActions}`}
            >
              <button
                ref={cartBtnRef}
                type="button"
                className={`${actionBtn} ${
                  inCart
                    ? "border-[color:var(--reels-point)]/85 bg-[var(--reels-point)]/18 text-[var(--reels-point)] shadow-[0_0_0_1px_rgba(228,41,128,0.3)]"
                    : "border-white/25 bg-black/40 text-white"
                }`}
                aria-label={inCart ? "장바구니에서 빼기" : "장바구니에 담기"}
                aria-pressed={inCart}
                title={inCart ? "장바구니에서 빼기" : "장바구니 담기"}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!requireAuth()) return;
                  const el = cartBtnRef.current;
                  if (el && dopamine) {
                    dopamine.launchFromCartButton(el, video, thumbnailSrc);
                  }
                }}
              >
                <CartIcon
                  className={`${actionIcon} ${inCart ? "text-[var(--reels-point)]" : "text-white"}`}
                />
              </button>
                <button
                  type="button"
                  className={`${actionBtn} border-white/25 bg-black/40 text-white`}
                  aria-label={likedByMe ? "좋아요 취소" : "좋아요"}
                  aria-pressed={likedByMe}
                  disabled={likeBusy}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    void toggleInternalLike();
                  }}
                >
                  <Heart
                    className={`${actionIcon} transition-transform duration-200 ${
                      likedByMe ? "fill-current text-[var(--reels-point)]" : "text-white"
                    } ${likePulse ? "scale-110" : "scale-100"}`}
                  />
                </button>
                <button
                  type="button"
                  className={`${actionBtn} ${
                    wishlisted
                      ? "border-[color:var(--reels-point)]/85 bg-[var(--reels-point)]/18 text-[var(--reels-point)] shadow-[0_0_0_1px_rgba(228,41,128,0.3)]"
                      : "border-white/25 bg-black/40 text-white"
                  }`}
                  aria-label={wishlisted ? "찜 해제" : "찜하기"}
                  aria-pressed={wishlisted}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!requireAuth()) return;
                    wishlist.toggle(video);
                  }}
                >
                  <span className={`relative isolate block ${actionIcon}`}>
                    <motion.span
                      className="absolute inset-0 overflow-hidden"
                      initial={false}
                      animate={{
                        clipPath: wishlisted
                          ? "inset(0% 0% 0% 0%)"
                          : "inset(0% 0% 100% 0%)",
                      }}
                      transition={{
                        duration: reduceMotion ? 0 : 0.48,
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
                      className={`pointer-events-none absolute inset-0 z-[1] block h-full w-full drop-shadow-md ${
                        wishlisted ? "text-[var(--reels-point)]" : "text-white"
                      }`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                  </span>
                </button>
            </div>
          </div>
        </div>
      </Link>
      {authModal}
    </>
  );
}
