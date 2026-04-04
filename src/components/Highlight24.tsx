"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SAMPLE_VIDEOS } from "@/data/videos";

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

/** 활성 인덱스 기준 최단 호 길이 차이 (−n/2 … n/2) */
function circularDelta(i: number, active: number, n: number): number {
  if (n <= 1) return 0;
  let d = i - active;
  const half = n / 2;
  if (d > half) d -= n;
  if (d < -half) d += n;
  return d;
}

/**
 * 수평면(XZ) 위의 정원 배치 + 각 패널을 카메라 쪽으로 회전(빌보드).
 * 넘길 때마다 같은 반지름 R 위를 따라 이동 → 2D 화면에선 원을 도는 느낌.
 */
function circularRingPose(
  delta: number,
  n: number,
  radius: number,
): {
  x: number;
  z: number;
  rotateY: number;
  depthFactor: number;
  scale: number;
  opacity: number;
  zIndex: number;
} {
  const phi = (delta * 2 * Math.PI) / Math.max(n, 1);
  const x = radius * Math.sin(phi);
  const z = radius * Math.cos(phi);
  const rotateY = -(phi * 180) / Math.PI;
  const depthFactor = (1 + Math.cos(phi)) / 2;
  const isMain = delta === 0;
  const scale = 0.72 + 0.28 * depthFactor;
  /** 메인만 선명 — 옆 카드는 낮은 불투명도로 ‘다음에 뭐가 있지?’ 호기심 유도 */
  const opacity = isMain ? 1 : 0.26 + 0.2 * depthFactor;
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

/** ±1 옆 카드 뒤편 대각선에 ‘대기 큐’ 한 겹 더 (로테이션 대기 느낌) */
function diagonalWingPose(
  side: "left" | "right",
  radius: number,
): {
  x: number;
  z: number;
  rotateY: number;
  depthFactor: number;
  scale: number;
  opacity: number;
  zIndex: number;
} {
  const sign = side === "left" ? -1 : 1;
  const x = sign * radius * 0.96;
  const z = -radius * 0.68;
  const rotateY = sign * 26;
  return {
    x,
    z,
    rotateY,
    depthFactor: 0.22,
    scale: 0.52,
    opacity: 0.26,
    zIndex: 14,
  };
}

/** n이 작을 때 prev2===next2 한 장만 — 중앙 뒤로 깊게 */
function centerBackQueuePose(radius: number): {
  x: number;
  z: number;
  rotateY: number;
  depthFactor: number;
  scale: number;
  opacity: number;
  zIndex: number;
} {
  return {
    x: 0,
    z: -radius * 0.78,
    rotateY: 0,
    depthFactor: 0.2,
    scale: 0.48,
    opacity: 0.22,
    zIndex: 13,
  };
}

function hiddenOffstagePose(radius: number): {
  x: number;
  z: number;
  rotateY: number;
  depthFactor: number;
  scale: number;
  opacity: number;
  zIndex: number;
} {
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
  const videos = useMemo(
    () => SAMPLE_VIDEOS.filter((v) => v.orientation === "portrait"),
    [],
  );
  const [index, setIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const ambientVideoRef = useRef<HTMLVideoElement>(null);
  const touchStartX = useRef<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const [layout, setLayout] = useState({
    cardW: 200,
    cardH: 356,
    perspective: 1680,
    ringRadius: 280,
  });

  /** 메인 클립과 동기된 블러 배경 영상 — 로드 전·후 부드럽게 페이드 */
  const [ambientVideoReady, setAmbientVideoReady] = useState(false);

  const reduceMotion = useReducedMotion() ?? false;

  const n = videos.length;
  const safeIndex = n > 0 ? ((index % n) + n) % n : 0;
  const active = n > 0 ? videos[safeIndex] : undefined;
  const prevVideo =
    n > 0 ? videos[(safeIndex - 1 + n) % n] : undefined;
  const nextVideo =
    n > 0 ? videos[(safeIndex + 1 + n) % n] : undefined;

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
      const base = Math.min(360, Math.max(200, Math.round(w * 0.34)));
      const cardW = base;
      const cardH = Math.round((cardW * 16) / 9);
      const ringRadius = Math.min(360, Math.max(220, Math.round(w * 0.4)));
      const perspective = Math.min(2000, Math.max(1100, Math.round(w * 2.65)));
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
    return () => ro.disconnect();
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
    if (dx > 56) go(-1);
    else if (dx < -56) go(1);
  };

  /** 스프링은 빨리 수렴해 ‘탁’ 넘어가는 느낌 → 긴 트윈 + 강한 ease-out으로 끌어당겨 정착 */
  const transition = reduceMotion
    ? { type: "tween" as const, duration: 0.2, ease: [0.22, 1, 0.36, 1] as const }
    : {
        type: "tween" as const,
        duration: 1.05,
        ease: [0.22, 0.99, 0.26, 1] as const,
      };

  const { cardW, cardH, perspective, ringRadius } = layout;

  const wingSlots = useMemo(() => {
    if (n === 0) {
      return {
        prev1: 0,
        next1: 0,
        wingLeftIndex: null as number | null,
        wingRightIndex: null as number | null,
        centerBackOnly: false,
      };
    }
    if (n < 3) {
      return {
        prev1: (safeIndex - 1 + n) % n,
        next1: (safeIndex + 1) % n,
        wingLeftIndex: null as number | null,
        wingRightIndex: null as number | null,
        centerBackOnly: false,
      };
    }
    const prev1 = (safeIndex - 1 + n) % n;
    const next1 = (safeIndex + 1) % n;
    const prev2 = (safeIndex - 2 + n) % n;
    const next2 = (safeIndex + 2) % n;
    let wingLeftIndex: number | null = null;
    if (prev2 !== safeIndex && prev2 !== prev1 && prev2 !== next1) {
      wingLeftIndex = prev2;
    }
    let wingRightIndex: number | null = null;
    if (
      next2 !== safeIndex &&
      next2 !== prev1 &&
      next2 !== next1 &&
      next2 !== wingLeftIndex
    ) {
      wingRightIndex = next2;
    }
    const centerBackOnly =
      wingLeftIndex != null &&
      wingRightIndex == null &&
      prev2 === next2 &&
      wingLeftIndex === prev2;
    return {
      prev1,
      next1,
      wingLeftIndex,
      wingRightIndex,
      centerBackOnly,
    };
  }, [n, safeIndex]);

  if (n === 0 || !active || !prevVideo || !nextVideo) return null;

  const { prev1, next1, wingLeftIndex, wingRightIndex, centerBackOnly } =
    wingSlots;

  return (
    <section
      className="relative mt-0 w-full overflow-hidden border-t border-slate-200 outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-black/20"
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
        className="absolute inset-0 scale-110 bg-cover bg-center transition-[opacity,filter] duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ backgroundImage: `url(${active.poster})` }}
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
          poster={active.poster}
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

      <div className="relative z-10 mx-auto max-w-[1800px] px-4 pb-10 pt-8 sm:px-6 sm:pb-12 sm:pt-10 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <div className="inline-flex max-w-full flex-col gap-1 rounded-l-none rounded-r-[9999px] bg-black/58 py-2.5 pl-3 pr-5 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.45)] ring-1 ring-white/12 backdrop-blur-md sm:gap-1.5 sm:py-3 sm:pl-4 sm:pr-7">
            <div className="flex items-baseline justify-between gap-4 pr-1">
              <h2
                id="highlight-24-heading"
                className="min-w-0 text-[18px] font-bold leading-tight tracking-tight text-white sm:text-[20px]"
              >
                24시간 클립 하이라이트
              </h2>
              <Link
                href="/"
                className="shrink-0 text-[12px] font-medium leading-none text-white/92 underline-offset-4 transition-colors hover:text-white sm:text-[13px]"
              >
                더보기
              </Link>
            </div>
            <p className="max-w-xl pr-2 text-[12px] leading-snug text-white/92 sm:text-[13px] sm:leading-relaxed">
              지금 거래되고 있는 일상 클립을 바로 넘겨 보세요
            </p>
          </div>
        </div>

        <div
          ref={wrapRef}
          className="relative mx-auto flex min-h-[min(58vw,500px)] max-w-5xl items-center justify-center py-4 sm:min-h-[min(52vw,520px)] md:py-6"
          style={{
            perspective: `${perspective}px`,
            perspectiveOrigin: "50% 36%",
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
              minHeight: cardH + 72,
              transform: "rotateX(11deg)",
              transformOrigin: "50% 55%",
            }}
          >
            {videos.map((v, i) => {
              const isMain = i === safeIndex;
              const delta = circularDelta(i, safeIndex, n);

              const pose = isMain
                ? circularRingPose(0, n, ringRadius)
                : i === prev1 || i === next1
                  ? circularRingPose(delta, n, ringRadius)
                  : centerBackOnly && i === wingLeftIndex
                    ? centerBackQueuePose(ringRadius)
                    : i === wingLeftIndex
                      ? diagonalWingPose("left", ringRadius)
                      : i === wingRightIndex
                        ? diagonalWingPose("right", ringRadius)
                        : hiddenOffstagePose(ringRadius);

              return (
                <motion.div
                  key={v.id}
                  role="presentation"
                  className={`absolute left-1/2 top-1/2 overflow-hidden rounded-2xl border bg-black/40 [transform-style:preserve-3d] ${
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
                        ref={videoRef}
                        className="absolute inset-0 h-full w-full object-cover"
                        poster={v.poster}
                        playsInline
                        muted
                        loop
                        preload="metadata"
                      >
                        <source src={v.src} type="video/mp4" />
                      </video>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={v.poster}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                        draggable={false}
                      />
                    )}
                    {!isMain && (
                      <motion.div
                        className="pointer-events-none absolute inset-0 bg-black"
                        aria-hidden
                        initial={false}
                        animate={{
                          opacity: 0.38 + 0.34 * (1 - pose.depthFactor),
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

        <div className="mt-6 flex items-center justify-center gap-6 sm:mt-8 sm:gap-10">
          <button
            type="button"
            onClick={() => go(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/35 bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70"
            aria-label="이전"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 text-center transition-opacity duration-300 ease-out">
            <p className="truncate text-[15px] font-semibold tracking-tight text-white drop-shadow-md sm:text-[16px]">
              {active?.creator ?? ""}
            </p>
            <p className="mt-0.5 line-clamp-1 text-[11px] text-white/70 sm:text-xs">
              {active?.title ?? ""}
            </p>
          </div>
          <button
            type="button"
            onClick={() => go(1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/35 bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70"
            aria-label="다음"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
