"use client";

import { useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { FeedVideo } from "@/data/videos";
import { LOCAL_TRENDING_FEED_VIDEOS } from "@/data/videos";
import { useAuthSession } from "@/hooks/useAuthSession";
import { buildAuthCallbackRedirectTo } from "@/lib/authOAuthRedirect";
import { AuthModalGoogleStartButton } from "@/components/AuthModalGoogleStartButton";
import { AuthModalPortal } from "@/components/AuthModalPortal";
import { HomeStartCtaButton } from "@/components/HomeStartCtaButton";
import { MainTopUserMenu } from "@/components/MainTopUserMenu";
import { ReelsSearchField } from "@/components/ReelsSearchField";
import {
  authModalDialogSurface,
  authModalDismissButtonCls,
  authModalGlowBottom,
  authModalGlowTop,
} from "@/lib/authModalTheme";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { useLocalSamplePlayback } from "@/hooks/useLocalSamplePlayback";
import { isLocalPublicVideo } from "@/lib/localVideoHighlight";
import { sanitizePosterSrc } from "@/lib/videoPoster";
import { useHoverInstantPreview } from "@/hooks/useHoverInstantPreview";

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

function HomeBestMarquee({ videos }: { videos: FeedVideo[] }) {
  const loop = useMemo(() => [...videos, ...videos], [videos]);
  if (videos.length === 0) return null;

  return (
    <div
      className="relative w-full overflow-hidden py-4 sm:py-6"
      aria-label="베스트 릴스 미리보기"
    >
      <div
        className="pointer-events-none absolute inset-y-4 left-0 z-[1] w-12 bg-gradient-to-r from-[#070708] to-transparent sm:inset-y-6 sm:w-20 [html[data-theme='light']_&]:from-[var(--background)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-4 right-0 z-[1] w-12 bg-gradient-to-l from-[#070708] to-transparent sm:inset-y-6 sm:w-20 [html[data-theme='light']_&]:from-[var(--background)]"
        aria-hidden
      />
      <div className="home-best-marquee-track flex gap-4 sm:gap-5 md:gap-6">
        {loop.map((v, i) => (
          <Link
            key={`${v.id}-${i}`}
            href={`/video/${v.id}`}
            className="group relative aspect-[216/384] h-[clamp(288px,52vh,460px)] shrink-0 overflow-hidden rounded-2xl border border-white/12 bg-black/30 shadow-[0_16px_48px_-20px_rgba(0,0,0,0.55)] outline-none transition-[border-color,transform,box-shadow] hover:z-[2] hover:border-[color:rgba(228,41,128,0.45)] hover:shadow-[0_20px_56px_-18px_rgba(228,41,128,0.12)] focus-visible:ring-2 focus-visible:ring-[color:var(--reels-point)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#070708] [html[data-theme='light']_&]:border-zinc-200/80 [html[data-theme='light']_&]:bg-zinc-100/80 [html[data-theme='light']_&]:focus-visible:ring-offset-white"
          >
            <div className="relative h-full w-full">
              <MarqueeCardPreview video={v} />
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/15"
                aria-hidden
              />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function Highlight24() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthSession();
  /** 베스트 피드 — 로컬 인기 10종, 판매가 높은 순(데모) */
  const bestVideos = useMemo(() => {
    return [...LOCAL_TRENDING_FEED_VIDEOS].sort(
      (a, b) => (b.priceWon ?? 0) - (a.priceWon ?? 0),
    );
  }, []);
  const posterUrl = useMemo(() => {
    const first = bestVideos[0];
    return first ? sanitizePosterSrc(first.poster) : undefined;
  }, [bestVideos]);

  const [searchQ, setSearchQ] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

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

  const onStartClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      if (user) {
        router.push("/mypage");
        return;
      }
      setAuthOpen(true);
    },
    [user, router],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!authOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [authOpen]);

  useEffect(() => {
    if (!authOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAuthOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [authOpen]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (posterUrl) {
      root.style.setProperty("--hero-nav-bg-image", `url(${posterUrl})`);
    } else {
      root.style.removeProperty("--hero-nav-bg-image");
    }
    return () => {
      root.style.removeProperty("--hero-nav-bg-image");
    };
  }, [posterUrl]);

  if (bestVideos.length === 0) return null;

  return (
    <section
      className="highlight24-lock-white relative mt-0 min-h-[calc(100svh-var(--header-height,0px))] w-full overflow-hidden bg-[#070708] [html[data-theme='light']_&]:bg-[var(--background)]"
      style={{
        marginTop: "calc(var(--header-height, 0px) * -1)",
        paddingTop: "var(--header-height, 0px)",
      }}
      aria-label="ARA 메인"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,rgba(228,41,128,0.09),transparent_55%)]"
        aria-hidden
      />
      <div
        className={`fixed right-4 top-4 z-[120] flex flex-row items-center sm:right-6 sm:top-5 ${
          authLoading ? "pointer-events-none opacity-50" : ""
        }`}
      >
        <MainTopUserMenu />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-3xl -translate-y-2 flex-col items-center px-4 pb-4 pt-[max(0.25rem,calc(env(safe-area-inset-top)+3rem))] text-center motion-reduce:translate-y-0 sm:-translate-y-3 sm:px-6 sm:pb-5 sm:pt-[max(0.5rem,calc(env(safe-area-inset-top)+3.25rem))] motion-reduce:sm:translate-y-0">
        <h1
          className="select-none text-[clamp(3.6rem,16.5vw,7.5rem)] font-semibold leading-none tracking-[0.02em] text-white"
          style={{
            fontFamily: "var(--font-fredoka), ui-rounded, system-ui, sans-serif",
          }}
        >
          ARA
        </h1>
        <p className="mt-2 max-w-[46rem] px-2 text-[clamp(13px,3.2vw,16px)] font-medium leading-snug tracking-[0.01em] text-white/75 [html[data-theme='light']_&]:text-zinc-600">
          누구나 쉽고 빠르게 숏폼을 거래하는 글로벌 동영상 쇼핑몰입니다.
        </p>

        <div className="mt-4 flex w-full max-w-xl flex-col items-center gap-3 sm:mt-5 sm:gap-4">
          <div className="flex w-full flex-wrap items-center justify-center gap-x-6 gap-y-3">
            <HomeStartCtaButton
              compactSpacing
              onClick={onStartClick}
              onPointerDown={(event) => event.stopPropagation()}
            />
            <div className="flex shrink-0 flex-wrap items-center justify-center gap-5">
              {(
                [
                  { label: "인기순위", target: "trending-rank" },
                  { label: "설명", target: "seller-pitch" },
                  { label: "후기", target: "best-reviews" },
                ] as const
              ).map(({ label, target }) => (
                <button
                  key={target}
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => {
                    const el = document.getElementById(target);
                    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className="group relative flex flex-col items-center gap-1 focus-visible:outline-none"
                >
                  <span className="whitespace-nowrap text-[15px] font-medium text-white/60 transition-colors duration-300 group-hover:text-white [html[data-theme='light']_&]:text-zinc-500 [html[data-theme='light']_&]:group-hover:text-zinc-900">
                    {label}
                  </span>
                  <span className="h-[1.5px] w-full origin-left scale-x-0 rounded-full bg-[color:var(--reels-point)] transition-transform duration-300 group-hover:scale-x-100" />
                </button>
              ))}
            </div>
          </div>

          <div className="w-full px-1 sm:max-w-xl sm:px-2">
            <ReelsSearchField
              compact={false}
              homeHero
              q={searchQ}
              setQ={setSearchQ}
            />
          </div>
        </div>
      </div>

      <div className="relative z-[5] -translate-y-1 motion-reduce:translate-y-0 sm:-translate-y-2 motion-reduce:sm:translate-y-0">
        <HomeBestMarquee videos={bestVideos} />
      </div>

      {mounted && authOpen
        ? createPortal(
            <AuthModalPortal onDismiss={() => setAuthOpen(false)}>
              <div
                role="dialog"
                aria-modal="true"
                aria-label="로그인 또는 회원가입"
                className={`relative w-full max-h-[min(92vh,760px)] overflow-y-auto rounded-[24px] px-5 pb-8 pt-8 shadow-[0_60px_130px_-40px_rgba(0,0,0,0.95)] sm:rounded-[28px] sm:px-7 sm:pb-10 sm:pt-10 ${authModalDialogSurface}`}
              >
                <div className={authModalGlowTop} aria-hidden />
                <div className={authModalGlowBottom} aria-hidden />
                <button
                  type="button"
                  onClick={() => setAuthOpen(false)}
                  className={authModalDismissButtonCls}
                  aria-label="닫기"
                >
                  ×
                </button>
                <p
                  className="relative text-center text-[clamp(2.2rem,6.85vw,3.05rem)] font-semibold tracking-[0.02em] text-white"
                  style={{
                    fontFamily: "var(--font-fredoka), ui-rounded, system-ui, sans-serif",
                  }}
                >
                  ARA
                </p>
                <p className="relative mt-3 text-center text-[clamp(1.15rem,4.6vw,1.85rem)] font-semibold leading-tight text-zinc-100">
                  로그인/회원가입
                </p>
                <AuthModalGoogleStartButton onClick={startGoogleAuth} />
              </div>
            </AuthModalPortal>,
            document.body,
          )
        : null}
    </section>
  );
}
