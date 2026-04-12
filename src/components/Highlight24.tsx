"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FeedVideo } from "@/data/videos";
import { LOCAL_TRENDING_FEED_VIDEOS } from "@/data/videos";
import { useLocalSamplePlayback } from "@/hooks/useLocalSamplePlayback";
import { isLocalPublicVideo } from "@/lib/localVideoHighlight";
import { SectionMoreLink } from "@/components/SectionMoreLink";
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
  const phi = sign * 0.66;
  return {
    x: radius * Math.sin(phi) * 1.08,
    z: radius * Math.cos(phi) * 0.9,
    rotateY: -(phi * 180) / Math.PI,
    depthFactor: 0.55,
    scale: 0.8,
    opacity: 0.78,
    zIndex: 44,
  };
}

/** 양끝 여백 채우는 대기열(±2 ~ ±4) — 멀수록 작고 흐리게 */
function sideFarWingPose(
  side: "left" | "right",
  radius: number,
  tier: 2 | 3 | 4,
): RingPose {
  const sign = side === "left" ? -1 : 1;
  const cfg = {
    2: { x: 1.08, z: -0.62, rot: 28, sc: 0.5, op: 0.4, zi: 24 },
    3: { x: 1.38, z: -0.72, rot: 32, sc: 0.43, op: 0.33, zi: 20 },
    4: { x: 1.68, z: -0.8, rot: 36, sc: 0.37, op: 0.27, zi: 16 },
  }[tier];
  return {
    x: sign * radius * cfg.x,
    z: radius * cfg.z,
    rotateY: sign * cfg.rot,
    depthFactor: 0.22,
    scale: cfg.sc,
    opacity: cfg.op,
    zIndex: cfg.zi,
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
  return (
    <div
      className="absolute inset-0"
      onMouseEnter={isLocal ? localPb.onEnter : hover.onEnter}
      onMouseLeave={isLocal ? localPb.onLeave : hover.onLeave}
    >
      <video
        ref={isLocal ? localPb.ref : hover.ref}
        className="absolute inset-0 h-full w-full object-cover"
        poster={isLocal ? undefined : video.poster}
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
    void v.play().catch(() => {});
  }, [activeId]);

  useEffect(() => {
    setAmbientVideoReady(false);
  }, [activeId]);

  useEffect(() => {
    if (reduceMotion) return;
    const el = ambientVideoRef.current;
    if (!el) return;
    el.muted = true;
    void el.play().catch(() => {});
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

  /** 메인 + ±1(넓은 간격) + 양옆 ±2~±4 대기열 — 동일 인덱스는 앞 슬롯만 */
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
    const p2 = (safeIndex - 2 + n) % n;
    const n2 = (safeIndex + 2) % n;
    const p3 = (safeIndex - 3 + n) % n;
    const n3 = (safeIndex + 3) % n;
    const p4 = (safeIndex - 4 + n) % n;
    const n4 = (safeIndex + 4) % n;

    assign(p1, sideNeighborPose(-1, r));
    assign(n1, sideNeighborPose(1, r));
    if (n >= 5) {
      assign(p2, sideFarWingPose("left", r, 2));
      assign(n2, sideFarWingPose("right", r, 2));
    }
    if (n >= 7) {
      assign(p3, sideFarWingPose("left", r, 3));
      assign(n3, sideFarWingPose("right", r, 3));
    }
    if (n >= 9) {
      assign(p4, sideFarWingPose("left", r, 4));
      assign(n4, sideFarWingPose("right", r, 4));
    }

    return { mainPose: main, poseByIndex: map };
  }, [n, safeIndex, ringRadius]);

  if (n < 3 || !active) return null;

  return (
    <section
      className="highlight24-lock-white relative mt-0 w-full overflow-hidden border-t border-slate-200 outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-black/20"
      aria-labelledby="highlight-24-heading"
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
          active.poster
            ? { backgroundImage: `url(${active.poster})` }
            : undefined
        }
        aria-hidden
      />
      {!reduceMotion ? (
        <video
          key={active.id}
          ref={ambientVideoRef}
          className={`pointer-events-none absolute left-1/2 top-1/2 z-0 min-h-[120%] min-w-[120%] -translate-x-1/2 -translate-y-1/2 scale-110 object-cover transition-opacity duration-[1000ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[opacity,transform] motion-reduce:opacity-0 ${
            ambientVideoReady ? "opacity-[0.52]" : "opacity-0"
          }`}
          style={{
            filter: "blur(72px) saturate(1.15) brightness(1.05)",
            WebkitFilter: "blur(72px) saturate(1.15) brightness(1.05)",
          }}
          src={active.src}
          poster={isLocalPublicVideo(active.src) ? undefined : active.poster}
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
        className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_88%_58%_at_50%_38%,rgba(255,255,255,0.14),transparent_58%)]"
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

      <div className="relative z-10 mx-auto max-w-[1800px] px-4 pb-4 pt-6 sm:px-6 sm:pb-5 sm:pt-7 lg:px-8">
        <div className="relative z-20 mb-5 max-w-full sm:mb-6 md:mb-7">
          <div className="inline-flex max-w-full flex-col gap-1 rounded-l-none rounded-r-[9999px] border-2 border-white bg-black/72 py-2.5 pl-3 pr-5 shadow-[0_12px_40px_-10px_rgba(0,0,0,0.55)] backdrop-blur-md sm:gap-1.5 sm:py-3 sm:pl-4 sm:pr-7">
            <div className="flex items-baseline justify-between gap-4 pr-1">
              <h2
                id="highlight-24-heading"
                className="text-legible-white min-w-0 text-[18px] font-bold leading-tight tracking-tight text-white sm:text-[20px]"
              >
                24시간 클립 하이라이트
              </h2>
              <SectionMoreLink
                variant="light"
                category="shortform"
                className="shrink-0 !py-1.5 !pl-3 !pr-2 !text-[11px] !font-semibold sm:!py-2 sm:!text-[12px]"
              />
            </div>
            <p className="text-legible-white max-w-xl pr-2 text-[12px] leading-snug text-white sm:text-[13px] sm:leading-relaxed">
              지금 거래되고 있는 일상 클립을 바로 넘겨 보세요
            </p>
          </div>
        </div>

        <div
          ref={wrapRef}
          className="relative z-10 mx-auto flex min-h-0 max-w-6xl items-center justify-center pt-2 pb-0 sm:max-w-7xl sm:pt-3 md:max-w-[min(100%,88rem)] md:pt-4"
          style={{
            perspective: `${perspective}px`,
            perspectiveOrigin: "50% 38%",
          }}
        >
          <div
            className="pointer-events-none absolute inset-x-[6%] top-1/2 h-[86%] max-h-[480px] -translate-y-1/2 rounded-[50%] border border-white/[0.06] bg-gradient-to-b from-white/[0.06] to-transparent opacity-80"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-x-[18%] bottom-[8%] h-[28%] max-h-[200px] rounded-[50%] border border-white/[0.05] bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,255,255,0.08),transparent_72%)] opacity-60"
            aria-hidden
          />

          {/* 무대를 X축으로 살짝 기울여 원이 화면에 타원·깊이로 투영되게 함 */}
          <div
            className="relative w-full [transform-style:preserve-3d]"
            style={{
              minHeight: Math.round(cardH * 1.2) + 32,
              transform: "rotateX(10deg)",
              transformOrigin: "50% 52%",
            }}
          >
            {videos.map((v, i) => {
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
                      ? "cursor-default border-white/35 shadow-[0_32px_100px_-24px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.14)] ring-1 ring-inset ring-white/20"
                      : "cursor-pointer border-white/14 shadow-[0_28px_90px_-26px_rgba(0,0,0,0.88)]"
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
                    if (!isMain && pose.opacity >= 0.02) setIndex(i);
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
                          isLocalPublicVideo(v.src) ? undefined : v.poster
                        }
                        playsInline
                        muted
                        loop
                        preload="auto"
                        src={v.src}
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
                    <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/12" />
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
              <span className="pointer-events-none flex h-12 w-12 items-center justify-center rounded-full bg-white/95 text-slate-900 opacity-0 shadow-lg ring-1 ring-black/10 transition-all duration-300 ease-out group-hover:opacity-100 sm:h-14 sm:w-14">
                <ChevronLeft className="h-6 w-6 sm:h-7 sm:w-7" />
              </span>
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              className="group absolute right-0 top-1/2 z-[60] flex h-[min(52%,340px)] w-[min(22%,120px)] max-w-[100px] -translate-y-1/2 items-center justify-end pr-1 sm:pr-2"
              aria-label="다음 클립"
            >
              <span className="pointer-events-none flex h-12 w-12 items-center justify-center rounded-full bg-white/95 text-slate-900 opacity-0 shadow-lg ring-1 ring-black/10 transition-all duration-300 ease-out group-hover:opacity-100 sm:h-14 sm:w-14">
                <ChevronRight className="h-6 w-6 sm:h-7 sm:w-7" />
              </span>
            </button>
          </div>
        </div>

        <div className="mx-auto flex max-w-6xl items-center justify-center gap-5 py-4 sm:gap-8 sm:py-5 md:max-w-7xl">
          <button
            type="button"
            onClick={() => go(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-white/12 text-white shadow-[0_1px_3px_rgba(15,23,42,0.35)] backdrop-blur-sm transition hover:border-white/55 hover:bg-white/18 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80"
            aria-label="이전"
          >
            <ChevronLeft className="h-5 w-5 text-white drop-shadow-[0_1px_2px_rgba(15,23,42,0.45)]" />
          </button>
          <div className="min-w-0 text-center transition-opacity duration-300 ease-out">
            <p className="text-legible-white truncate text-[15px] font-semibold tracking-tight text-white sm:text-[16px]">
              {active?.creator ?? ""}
            </p>
            <p className="text-legible-white mt-0.5 line-clamp-1 text-[11px] text-white sm:text-xs">
              {active?.title ?? ""}
            </p>
          </div>
          <button
            type="button"
            onClick={() => go(1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-white/12 text-white shadow-[0_1px_3px_rgba(15,23,42,0.35)] backdrop-blur-sm transition hover:border-white/55 hover:bg-white/18 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80"
            aria-label="다음"
          >
            <ChevronRight className="h-5 w-5 text-white drop-shadow-[0_1px_2px_rgba(15,23,42,0.45)]" />
          </button>
        </div>
      </div>
    </section>
  );
}
