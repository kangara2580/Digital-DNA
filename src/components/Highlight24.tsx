"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { createPortal } from "react-dom";
import type { FeedVideo } from "@/data/videos";
import { LOCAL_TRENDING_FEED_VIDEOS } from "@/data/videos";
import { useAuthSession } from "@/hooks/useAuthSession";
import { buildAuthCallbackRedirectTo } from "@/lib/authOAuthRedirect";
import {
  authModalBackdropBlurStrong,
  authModalDialogSurface,
  authModalGlowBottom,
  authModalGlowTop,
  authModalGoogleButtonShadow,
  authModalGoogleButtonText,
} from "@/lib/authModalTheme";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { useLocalSamplePlayback } from "@/hooks/useLocalSamplePlayback";
import { isLocalPublicVideo } from "@/lib/localVideoHighlight";
import { safePlayVideo } from "@/lib/safeVideoPlay";
import { sanitizePosterSrc } from "@/lib/videoPoster";
import { useHoverInstantPreview } from "@/hooks/useHoverInstantPreview";

function ChevronLeft({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M15 5l-7 7 7 7"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M9 5l7 7-7 7"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type RingPose = {
  x: number;
  z: number;
  rotateY: number;
  depthFactor: number;
  scale: number;
  opacity: number;
  zIndex: number;
};

/**
 * 수평면(XZ) 위의 정원 배치 + 각 패널을 카메라 쪽으로 회전(빌보드).
 * 메인(정면) 전용.
 */
function circularRingPose(
  delta: number,
  n: number,
  radius: number,
): RingPose {
  const phi = (delta * 2 * Math.PI) / Math.max(n, 1);
  const x = radius * Math.sin(phi);
  const z = radius * Math.cos(phi);
  const rotateY = -(phi * 180) / Math.PI;
  const depthFactor = (1 + Math.cos(phi)) / 2;
  const isMain = delta === 0;
  const scale = 0.72 + 0.28 * depthFactor;
  /** 메인만 선명 — 옆 카드는 살짝만 눌러도 넘기기·탭이 잘 되게 가시성 유지 */
  const opacity = isMain ? 1 : 0.44 + 0.32 * depthFactor;
  const zIndex = 10 + Math.round(depthFactor * 50);
  return {
    x,
    z,
    rotateY,
    depthFactor,
    scale,
    opacity,
    zIndex,
  };
}

/** 바로 옆(±1) — 원주 각 분할 대신 고정 각으로 간격 확대 */
function sideNeighborPose(sign: -1 | 1, radius: number): RingPose {
  const phi = sign * 0.96;
  return {
    x: radius * Math.sin(phi) * 1.12,
    z: radius * Math.cos(phi) * 0.86,
    rotateY: (phi * 180) / Math.PI,
    depthFactor: 0.62,
    scale: 0.92,
    opacity: 0.78,
    zIndex: 44,
  };
}

/** 링 옆 카드: 로컬 샘플은 하이라이트 구간 루프, 그 외 기존 3초 프리뷰 */
function HighlightRingSidePreview({ video }: { video: FeedVideo }) {
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

function hiddenOffstagePose(radius: number): RingPose {
  return {
    x: 0,
    z: -radius * 2.4,
    rotateY: 0,
    depthFactor: 0,
    scale: 0.38,
    opacity: 0,
    zIndex: 0,
  };
}

export function Highlight24() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthSession();
  /** 메인 히어로 링 — 인기순위와 동일한 로컬 10종(썸네일·영상 일치) */
  const videos = useMemo(() => [...LOCAL_TRENDING_FEED_VIDEOS], []);
  const [index, setIndex] = useState(0);
  const [authOpen, setAuthOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const ambientVideoRef = useRef<HTMLVideoElement>(null);
  /** t=0 첫 키프레임이 검게 잡히는 경우 onLoadedData만으로는 실루엣이 먹지 않음 — 재생 오프셋을 본 뒤에만 공개 */
  const ambientRevealRef = useRef(false);
  const touchStartX = useRef<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const [layout, setLayout] = useState({
    cardW: 328,
    cardH: 584,
    perspective: 1720,
    ringRadius: 310,
  });

  /** 메인 클립과 동기된 블러 배경 영상 — 로드 전·후 부드럽게 페이드 */
  const [ambientVideoReady, setAmbientVideoReady] = useState(false);

  const reduceMotion = useReducedMotion() ?? false;

  const n = videos.length;
  const safeIndex = n > 0 ? ((index % n) + n) % n : 0;
  const active = n > 0 ? videos[safeIndex] : undefined;
  const activePoster =
    sanitizePosterSrc(active?.poster) ?? active?.poster?.trim() ?? undefined;

  const go = useCallback(
    (dir: -1 | 1) => {
      if (n === 0) return;
      setIndex((i) => (i + dir + n) % n);
    },
    [n],
  );

  const activeId = active?.id;

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

  const onTopUserClick = useCallback(() => {
    if (authLoading) return;
    if (user) {
      router.push("/mypage");
      return;
    }
    setAuthOpen(true);
  }, [authLoading, user, router]);

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
    const el = wrapRef.current;
    if (!el) return;
    const apply = () => {
      const w = el.clientWidth || 640;
      const vvH =
        typeof window !== "undefined"
          ? window.visualViewport?.height ?? window.innerHeight
          : 820;

      /**
       * 헤더 칩 + 3D 무대 + 하단 조작줄까지 한 화면에 들어오도록 스테이지 높이 예산.
       */
      /** 상단 sticky 네비·섹션 패딩·하단 조작줄 여유 */
      const sectionChrome = 220;
      const stageBudget = Math.max(
        288,
        Math.min(vvH * 0.9 - sectionChrome, 620),
      );
      const tiltOverhead = 72;
      const maxCardH = Math.max(268, Math.round(stageBudget - tiltOverhead));
      const maxCardWFromH = Math.floor((maxCardH * 9) / 16);

      const baseFromWidth = Math.min(560, Math.max(200, Math.round(w * 0.52)));
      let cardW = Math.min(baseFromWidth, maxCardWFromH);
      cardW = Math.max(200, cardW);
      let cardH = Math.round((cardW * 16) / 9);
      if (cardH > maxCardH) {
        cardH = maxCardH;
        cardW = Math.max(200, Math.round((cardH * 9) / 16));
      }

      const ringRadius = Math.min(
        480,
        Math.max(170, Math.round(Math.min(w * 0.48, cardW * 1.1))),
      );
      const perspective = Math.min(2050, Math.max(820, Math.round(w * 2.12)));
      setLayout({
        cardW,
        cardH,
        perspective,
        ringRadius,
      });
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    window.addEventListener("resize", apply);
    window.visualViewport?.addEventListener("resize", apply);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", apply);
      window.visualViewport?.removeEventListener("resize", apply);
    };
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !activeId) return;
    v.muted = true;
    safePlayVideo(v);
  }, [activeId]);

  useEffect(() => {
    setAmbientVideoReady(false);
    ambientRevealRef.current = false;
  }, [activeId]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (activePoster) {
      root.style.setProperty("--hero-nav-bg-image", `url(${activePoster})`);
    } else {
      root.style.removeProperty("--hero-nav-bg-image");
    }
    return () => {
      root.style.removeProperty("--hero-nav-bg-image");
    };
  }, [activePoster]);

  useEffect(() => {
    if (reduceMotion) return;
    const el = ambientVideoRef.current;
    if (!el) return;
    el.muted = true;
    safePlayVideo(el);
  }, [activeId, reduceMotion, ambientVideoReady]);

  const onAmbientTimeUpdate = useCallback(
    (e: React.SyntheticEvent<HTMLVideoElement>) => {
      if (ambientRevealRef.current) return;
      if (e.currentTarget.currentTime < 0.05) return;
      ambientRevealRef.current = true;
      setAmbientVideoReady(true);
    },
    [],
  );

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (dx > 40) go(-1);
    else if (dx < -40) go(1);
  };

  /** 스프링은 빨리 수렴해 ‘탁’ 넘어가는 느낌 → 긴 트윈 + 강한 ease-out으로 끌어당겨 정착 */
  const transition = reduceMotion
    ? { type: "tween" as const, duration: 0.2, ease: [0.22, 1, 0.36, 1] as const }
    : {
        type: "tween" as const,
        duration: 0.72,
        ease: [0.22, 1, 0.32, 1] as const,
      };

  const { cardW, cardH, perspective, ringRadius } = layout;

  /** 메인 + 양옆 1장씩만 노출 (총 3장) */
  const { mainPose, poseByIndex } = useMemo(() => {
    const r = ringRadius;
    const baseMain = circularRingPose(0, n, r);
    /** 메인만 조금 더 크게(픽셀 예산 + 스케일) — 옆 카드 대비 주목도 */
    const main: RingPose = {
      ...baseMain,
      scale: baseMain.scale * 1.26,
      z: baseMain.z * 1.06,
      zIndex: baseMain.zIndex + 4,
    };
    const map = new Map<number, RingPose>();
    const assign = (idx: number, pose: RingPose) => {
      if (idx === safeIndex) return;
      if (map.has(idx)) return;
      map.set(idx, pose);
    };

    const p1 = (safeIndex - 1 + n) % n;
    const n1 = (safeIndex + 1) % n;
    assign(p1, sideNeighborPose(-1, r));
    assign(n1, sideNeighborPose(1, r));

    return { mainPose: main, poseByIndex: map };
  }, [n, safeIndex, ringRadius]);

  const visibleCardIndices = useMemo(() => {
    if (n < 3) return [];
    const left = (safeIndex - 1 + n) % n;
    const right = (safeIndex + 1) % n;
    return [left, safeIndex, right];
  }, [n, safeIndex]);

  if (n < 3 || !active) return null;

  return (
    <section
      className="highlight24-lock-white relative mt-0 min-h-[calc(100svh-var(--header-height,0px))] w-full overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-black/20"
      style={{
        marginTop: "calc(var(--header-height, 0px) * -1)",
        paddingTop: "var(--header-height, 0px)",
      }}
      aria-label="24시간 클립 하이라이트"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          go(-1);
        }
        if (e.key === "ArrowRight") {
          e.preventDefault();
          go(1);
        }
      }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* 배경: 포스터 즉시 반영 + (모션 허용 시) 메인 영상 블러로 색감이 살아 움직임 */}
      <div
        className="absolute inset-0 scale-110 bg-[#070708] bg-cover bg-center transition-[opacity,filter] duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={
          activePoster
            ? { backgroundImage: `url(${activePoster})` }
            : undefined
        }
        aria-hidden
      />
      {!reduceMotion ? (
        <video
          key={active.id}
          ref={ambientVideoRef}
          className={`pointer-events-none absolute left-1/2 top-1/2 z-0 min-h-[120%] min-w-[120%] -translate-x-1/2 -translate-y-1/2 scale-110 object-cover transition-opacity duration-[1000ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[opacity,transform] motion-reduce:opacity-0 ${
            ambientVideoReady ? "opacity-[0.34]" : "opacity-0"
          }`}
          style={{
            filter: "blur(56px) saturate(1.06) brightness(0.96)",
            WebkitFilter: "blur(56px) saturate(1.06) brightness(0.96)",
          }}
          src={active.src}
          poster={isLocalPublicVideo(active.src) ? undefined : activePoster}
          muted
          playsInline
          loop
          autoPlay
          preload="auto"
          aria-hidden
          onTimeUpdate={onAmbientTimeUpdate}
        />
      ) : null}
      <div
        className="absolute inset-0 z-[1] bg-black/28 backdrop-blur-xl transition-colors duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 z-[2] bg-black/68"
        style={{
          clipPath: "polygon(74% 0%, 100% 0%, 80% 100%, 54% 100%)",
          WebkitClipPath: "polygon(74% 0%, 100% 0%, 80% 100%, 54% 100%)",
        }}
        aria-hidden
      />
      <div
        className="absolute inset-0 z-[1] bg-gradient-to-b from-black/18 via-black/28 to-black/48 transition-opacity duration-[900ms]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_125%_92%_at_50%_118%,rgba(0,0,0,0.42),transparent_48%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_72%_40%_at_50%_70%,rgba(0,0,0,0.28),transparent_72%)]"
        aria-hidden
      />
      <div className="relative z-10 mx-auto max-w-[1800px] px-4 pb-4 pt-9 sm:px-6 sm:pb-5 sm:pt-10 lg:px-8">
        <button
          type="button"
          onClick={onTopUserClick}
          className="fixed right-4 top-4 z-[120] inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-black/38 text-white/95 backdrop-blur-md transition hover:bg-black/52 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/85 sm:right-6 sm:top-5"
          aria-label={user ? "마이페이지로 이동" : "로그인 또는 회원가입"}
          disabled={authLoading}
        >
          <span className="relative inline-flex h-6 w-6 items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              aria-hidden
            >
              <circle cx="12" cy="8" r="4" strokeWidth="2.2" />
              <path
                d="M4 20C4 15.8 7.6 12.4 12 12.4C16.4 12.4 20 15.8 20 20H4Z"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {!user ? (
              <svg
                viewBox="0 0 24 24"
                className="absolute -right-[0.28rem] -top-[0.28rem] h-3 w-3"
                fill="none"
                stroke="currentColor"
                aria-hidden
              >
                <path
                  d="M12 4V20M4 12H20"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : null}
          </span>
        </button>
        <div className="relative z-20 mb-5 flex justify-end sm:mb-6 md:mb-7" aria-hidden>
          <div className="h-11 w-11" />
        </div>
        <div className="relative z-10 mx-auto flex max-w-7xl items-center justify-between gap-6 pb-7 pt-2 sm:pb-8 sm:pt-3 md:gap-8 md:pb-9 md:pt-4">
          <div
            ref={wrapRef}
            className="relative min-h-0 flex-1 items-center justify-center"
            style={{
              perspective: `${perspective}px`,
              perspectiveOrigin: "50% 38%",
              transform: "translateX(-14%)",
            }}
          >
          {/* 무대를 X축으로 살짝 기울여 원이 화면에 타원·깊이로 투영되게 함 */}
          <div
            className="relative w-full [transform-style:preserve-3d]"
            style={{
              minHeight: Math.round(cardH * 1.2) + 32,
              transform: "translateY(20px) rotateX(10deg)",
              transformOrigin: "50% 52%",
            }}
          >
            {visibleCardIndices.map((i) => {
              const v = videos[i];
              const isMain = i === safeIndex;
              const pose = isMain
                ? mainPose
                : (poseByIndex.get(i) ?? hiddenOffstagePose(ringRadius));

              return (
                <motion.div
                  key={v.id}
                  role="presentation"
                  className={`group absolute left-1/2 top-1/2 overflow-hidden rounded-2xl bg-black/40 [transform-style:preserve-3d] ${
                    isMain
                      ? "cursor-pointer border border-transparent shadow-[0_32px_100px_-24px_rgba(0,0,0,0.55)]"
                      : "cursor-pointer border border-transparent shadow-[0_28px_90px_-26px_rgba(0,0,0,0.88)]"
                  } ${pose.opacity < 0.02 ? "pointer-events-none" : ""}`}
                  style={{
                    width: cardW,
                    height: cardH,
                    marginLeft: -cardW / 2,
                    marginTop: -cardH / 2,
                    zIndex: pose.zIndex,
                    transformOrigin: "center center",
                  }}
                  initial={false}
                  animate={{
                    x: pose.x,
                    z: pose.z,
                    rotateY: pose.rotateY,
                    scale: pose.scale,
                    opacity: pose.opacity,
                  }}
                  transition={transition}
                  onClick={() => {
                    if (pose.opacity < 0.02) return;
                    if (isMain) {
                      router.push(`/video/${v.id}`);
                      return;
                    }
                    setIndex(i);
                  }}
                >
                  <div
                    className={`relative h-full w-full ${isMain ? "" : "brightness-[0.72] contrast-[0.92] saturate-[0.85]"}`}
                  >
                    {isMain ? (
                      <video
                        key={v.id}
                        ref={videoRef}
                        className="absolute inset-0 h-full w-full object-cover"
                        poster={
                          isLocalPublicVideo(v.src)
                            ? undefined
                            : sanitizePosterSrc(v.poster)
                        }
                        playsInline
                        muted
                        preload="auto"
                        src={v.src}
                        onEnded={() => go(1)}
                      />
                    ) : (
                      <HighlightRingSidePreview video={v} />
                    )}
                    {!isMain && (
                      <motion.div
                        className="pointer-events-none absolute inset-0 bg-black"
                        aria-hidden
                        initial={false}
                        animate={{
                          opacity: 0.22 + 0.22 * (1 - pose.depthFactor),
                        }}
                        transition={transition}
                      />
                    )}
                    <div
                      className={`pointer-events-none absolute inset-0 bg-gradient-to-t via-transparent to-black/10 ${
                        isMain ? "from-black/25" : "from-black/45"
                      }`}
                    />
                    {v.priceWon != null ? (
                      <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center bg-gradient-to-b from-black/50 via-black/20 to-transparent px-2 pb-6 pt-2.5 opacity-0 transition-opacity duration-200 ease-out group-hover:opacity-100 motion-reduce:transition-none sm:pb-8 sm:pt-3">
                        <span className="text-legible-white rounded-md bg-black/45 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-white ring-1 ring-white/20 sm:text-[11px]">
                          {v.priceWon.toLocaleString("ko-KR")}원
                        </span>
                      </div>
                    ) : null}
                  </div>
                </motion.div>
              );
            })}

            <button
              type="button"
              onClick={() => go(-1)}
              className="group absolute left-0 top-1/2 z-[60] flex h-[min(52%,340px)] w-[min(22%,120px)] max-w-[100px] -translate-y-1/2 items-center justify-start pl-1 sm:pl-2"
              aria-label="이전 클립"
            />
            <button
              type="button"
              onClick={() => go(1)}
              className="group absolute right-0 top-1/2 z-[60] flex h-[min(52%,340px)] w-[min(22%,120px)] max-w-[100px] -translate-y-1/2 items-center justify-end pr-1 sm:pr-2 md:-right-14 md:w-[min(30%,180px)] md:max-w-[180px]"
              aria-label="다음 클립"
            />
          </div>
          </div>
          <button
            type="button"
            onClick={() => go(1)}
            className="absolute right-[20%] top-1/2 z-[65] hidden h-[min(58%,380px)] w-[140px] -translate-y-1/2 md:block"
            aria-label="다음 클립 확장 영역"
          />
          <div className="pointer-events-none relative z-[80] hidden w-[clamp(206px,24vw,332px)] -translate-x-16 md:flex md:justify-center">
            <div className="flex w-full flex-col items-center pl-[clamp(20px,2.25vw,34px)] pr-[clamp(14px,1.55vw,24px)]">
              <div
                className="-translate-y-12 flex select-none flex-nowrap items-baseline justify-center gap-[0.034em] text-[clamp(3.85rem,10.25vw,9.35rem)] font-semibold leading-none text-white"
                style={{
                  fontFamily: "var(--font-fredoka), ui-rounded, system-ui, sans-serif",
                  letterSpacing: "0.015em",
                  textShadow:
                    "0 0 14px rgba(233,30,99,0.22), 0 0 32px rgba(233,30,99,0.26)",
                }}
                aria-hidden
              >
                <span className="inline-block shrink-0">A</span>
                <span className="inline-block shrink-0">R</span>
                <span className="inline-block shrink-0">A</span>
              </div>
              <p className="-translate-y-12 mt-[clamp(0.2rem,0.7vw,0.8rem)] w-full text-left text-[clamp(12px,1.15vw,16px)] font-medium leading-relaxed tracking-[0.01em] text-white/78">
                누구나 쉽고 빠르게 숏폼을 거래하는
                <br />
                글로벌 동영상 쇼핑몰입니다.
              </p>
              {/* 시작하기 + 섹션 네비 — 한 줄 가로 배치 */}
              <div className="pointer-events-auto -translate-x-[40px] z-[85] mt-[clamp(0.5rem,1.2vw,1.5rem)] flex items-center gap-6">
                <button
                  type="button"
                  onClick={onStartClick}
                  onPointerDown={(event) => event.stopPropagation()}
                  className="group/start shrink-0 inline-flex w-[clamp(138px,74%,188px)] items-center justify-center rounded-full border-[1.5px] border-solid border-white/45 bg-transparent px-[clamp(1rem,1.9vw,1.75rem)] py-[clamp(0.45rem,0.8vw,0.66rem)] text-[clamp(1.2rem,2.1vw,1.9rem)] font-semibold shadow-[0_9px_0_rgba(0,0,0,0.55)] transition-[border-color,box-shadow] duration-300 ease-out hover:border-white/82 hover:shadow-[0_11px_0_rgba(0,0,0,0.5)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/75"
                >
                  <span className="inline-flex text-white transition-[transform,color] duration-300 ease-out group-hover/start:-translate-y-0.5 group-hover/start:text-reels-crimson">
                    시작하기
                  </span>
                </button>

                {/* 섹션 이동 네비게이션 */}
                <div className="flex shrink-0 items-center gap-5">
                  {(
                    [
                      { label: "인기순위", target: "trending-rank" },
                      { label: "설명", target: "seller-pitch" },
                      { label: "후기", target: "best-reviews" },
                    ] as const
                  ).map(({ label, target }, i) => (
                    <button
                      key={target}
                      type="button"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={() => {
                        const el = document.getElementById(target);
                        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}
                      className="group relative flex flex-col items-center gap-[4px] focus-visible:outline-none"
                    >
                      <span className="whitespace-nowrap text-[15px] font-medium text-white/60 transition-colors duration-300 group-hover:text-white">
                        {label}
                      </span>
                      <span className="h-[1.5px] w-full origin-left scale-x-0 rounded-full bg-[#e91e63] transition-transform duration-300 group-hover:scale-x-100" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {mounted && authOpen
        ? createPortal(
            <div className={`fixed inset-0 z-[220] flex items-center justify-center ${authModalBackdropBlurStrong}`}>
              <button
                type="button"
                className="absolute inset-0"
                aria-label="로그인 모달 닫기"
                onClick={() => setAuthOpen(false)}
              />
              <div
                role="dialog"
                aria-modal="true"
                aria-label="로그인 또는 회원가입"
                className={`relative z-10 w-full max-w-[560px] max-h-[min(92vh,760px)] overflow-y-auto rounded-[24px] px-5 pb-8 pt-8 shadow-[0_60px_130px_-40px_rgba(0,0,0,0.95)] sm:rounded-[28px] sm:px-7 sm:pb-10 sm:pt-10 ${authModalDialogSurface}`}
              >
                <div className={authModalGlowTop} aria-hidden />
                <div className={authModalGlowBottom} aria-hidden />
                <button
                  type="button"
                  onClick={() => setAuthOpen(false)}
                  className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10 text-zinc-200 transition hover:bg-white/20"
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
                <button
                  type="button"
                  onClick={startGoogleAuth}
                  className={`relative mx-auto mt-9 flex w-full max-w-[360px] items-center justify-center gap-3 rounded-full bg-white px-4 py-3 font-extrabold text-[#1a1a1a] transition hover:brightness-95 sm:px-6 sm:py-4 ${authModalGoogleButtonText} ${authModalGoogleButtonShadow}`}
                >
                  <svg
                    className="h-5 w-5 shrink-0 sm:h-6 sm:w-6"
                    viewBox="0 0 24 24"
                    aria-hidden
                  >
                    <path
                      fill="#EA4335"
                      d="M12 10.2v3.9h5.4c-.2 1.2-.9 2.3-1.9 3l3 2.3c1.7-1.6 2.7-3.9 2.7-6.7 0-.6-.1-1.2-.2-1.8H12z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 22c2.4 0 4.4-.8 5.9-2.2l-3-2.3c-.8.6-1.8 1-2.9 1-2.2 0-4.1-1.5-4.7-3.5l-3.1 2.4C5.6 20.3 8.6 22 12 22z"
                    />
                    <path
                      fill="#4A90E2"
                      d="M7.3 15c-.2-.6-.4-1.3-.4-2s.1-1.4.4-2L4.2 8.6C3.4 10.1 3 11.5 3 13s.4 2.9 1.2 4.4L7.3 15z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M12 7.5c1.3 0 2.5.4 3.4 1.3l2.6-2.6C16.4 4.7 14.4 4 12 4 8.6 4 5.6 5.7 4.2 8.6L7.3 11c.6-2 2.5-3.5 4.7-3.5z"
                    />
                  </svg>
                  Google로 바로 시작
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </section>
  );
}
