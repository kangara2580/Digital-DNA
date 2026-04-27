"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FeedVideo } from "@/data/videos";
import { LOCAL_TRENDING_FEED_VIDEOS } from "@/data/videos";
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
  /** 메인 히어로 링 — 인기순위와 동일한 로컬 10종(썸네일·영상 일치) */
  const videos = useMemo(() => [...LOCAL_TRENDING_FEED_VIDEOS], []);
  const [index, setIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const ambientVideoRef = useRef<HTMLVideoElement>(null);
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
          preload="metadata"
          aria-hidden
          onLoadedData={() => setAmbientVideoReady(true)}
        />
      ) : null}
      <div
        className="absolute inset-0 z-[1] bg-black/28 backdrop-blur-xl transition-colors duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
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
              transform: "translateX(-18%)",
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
                  className={`group absolute left-1/2 top-1/2 overflow-hidden rounded-2xl border bg-black/40 [transform-style:preserve-3d] ${
                    isMain
                      ? "cursor-pointer border-white/35 shadow-[0_32px_100px_-24px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.14)] ring-1 ring-inset ring-white/20"
                      : "cursor-pointer border-transparent shadow-[0_28px_90px_-26px_rgba(0,0,0,0.88)]"
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
                    {isMain ? (
                      <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/12" />
                    ) : null}
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
            >
              <span className="pointer-events-none flex h-12 w-12 items-center justify-center rounded-full bg-transparent text-white opacity-0 shadow-none ring-1 ring-white/35 transition-all duration-300 ease-out group-hover:opacity-100 sm:h-14 sm:w-14">
                <ChevronLeft className="h-6 w-6 sm:h-7 sm:w-7" />
              </span>
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              className="group absolute right-0 top-1/2 z-[60] flex h-[min(52%,340px)] w-[min(22%,120px)] max-w-[100px] -translate-y-1/2 items-center justify-end pr-1 sm:pr-2"
              aria-label="다음 클립"
            >
              <span className="pointer-events-none flex h-12 w-12 items-center justify-center rounded-full bg-transparent text-white opacity-0 shadow-none ring-1 ring-white/35 transition-all duration-300 ease-out group-hover:opacity-100 sm:h-14 sm:w-14">
                <ChevronRight className="h-6 w-6 sm:h-7 sm:w-7" />
              </span>
            </button>
          </div>
          </div>
          <div className="pointer-events-none relative hidden min-w-[250px] -translate-x-4 flex-col items-center justify-center gap-4 md:flex">
            <div
              className="select-none text-[clamp(3.2rem,8vw,6.6rem)] font-semibold leading-none tracking-[0.03em] text-white/92"
              style={{
                fontFamily: '"Inter", "Helvetica Neue", "Arial", sans-serif',
                textShadow:
                  "0 0 12px rgba(255,255,255,0.18), 0 0 28px rgba(76,126,255,0.2)",
              }}
              aria-hidden
            >
              <span className="inline-flex items-end gap-[0.02em]">
                <span
                  className="relative inline-flex h-[1.1em] w-[0.9em] items-center justify-center align-baseline"
                  style={{
                    filter:
                      "drop-shadow(0 0 10px rgba(255,255,255,0.18)) drop-shadow(0 0 20px rgba(76,126,255,0.2))",
                  }}
                >
                  <svg
                    viewBox="0 0 120 140"
                    className="absolute inset-0 h-full w-full"
                    fill="none"
                    aria-hidden
                  >
                    <path
                      d="M10 126 L56 14 Q60 7 66 14 L112 126"
                      stroke="currentColor"
                      strokeWidth="18"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <svg
                    viewBox="0 0 24 24"
                    className="relative h-[0.46em] w-[0.46em] translate-y-[0.2em]"
                    fill="none"
                    aria-hidden
                  >
                    <path
                      d="M6 4.8L19.2 12L6 19.2V4.8Z"
                      fill="#FFFFFF"
                    />
                  </svg>
                </span>
                <span
                  className="inline-block text-[1.1em] font-light tracking-[0.015em]"
                  style={{
                    fontFamily:
                      '"Nunito", "Arial Rounded MT Bold", "Helvetica Rounded", "Inter", sans-serif',
                    transform: "scaleY(1.08)",
                    transformOrigin: "50% 88%",
                  }}
                >
                  RA
                </span>
              </span>
            </div>
            <p className="max-w-[300px] text-center text-[14px] font-medium leading-relaxed tracking-[0.01em] text-white/78">
              누구나 쉽고 빠르게 숏폼을 거래하는
              <br />
              글로벌 동영상 쇼핑몰
            </p>
            <Link
              href="/signup"
              className="pointer-events-auto inline-flex min-w-[188px] items-center justify-center rounded-full border border-white/45 bg-transparent px-7 py-2.5 text-[1.9rem] font-semibold text-white shadow-[0_9px_0_rgba(0,0,0,0.55)] transition duration-200 hover:-translate-y-0.5 hover:border-white/60 hover:shadow-[0_11px_0_rgba(0,0,0,0.5)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80"
            >
              시작하기
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
