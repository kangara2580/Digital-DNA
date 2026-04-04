"use client";

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

export function Highlight24() {
  const videos = useMemo(
    () => SAMPLE_VIDEOS.filter((v) => v.orientation === "portrait"),
    [],
  );
  const [index, setIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const touchStartX = useRef<number | null>(null);

  const n = videos.length;
  const safeIndex = n > 0 ? ((index % n) + n) % n : 0;
  const active = n > 0 ? videos[safeIndex] : undefined;
  const prevVideo =
    n > 0 ? videos[(safeIndex - 1 + n) % n] : undefined;
  const nextVideo =
    n > 0 ? videos[(safeIndex + 1) % n] : undefined;
  const prev2Video =
    n > 0 ? videos[(safeIndex - 2 + n) % n] : undefined;
  const next2Video =
    n > 0 ? videos[(safeIndex + 2) % n] : undefined;

  const go = useCallback(
    (dir: -1 | 1) => {
      if (n === 0) return;
      setIndex((i) => (i + dir + n) % n);
    },
    [n],
  );

  const activeId = active?.id;

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !activeId) return;
    v.muted = true;
    void v.play().catch(() => {});
  }, [activeId]);

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

  if (n === 0 || !active || !prevVideo || !nextVideo) return null;

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
      <div
        key={active.id}
        className="absolute inset-0 scale-110 bg-cover bg-center"
        style={{ backgroundImage: `url(${active.poster})` }}
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-black/45 backdrop-blur-2xl transition-opacity duration-700"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/35 to-black/55"
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-[1800px] px-4 pb-10 pt-8 sm:px-6 sm:pb-12 sm:pt-10 lg:px-8">
        <div className="mb-6 flex items-end justify-between gap-4 sm:mb-8">
          <div>
            <h2
              id="highlight-24-heading"
              className="text-[18px] font-bold tracking-tight text-white drop-shadow-sm sm:text-[20px]"
            >
              24시간 클립 하이라이트
            </h2>
            <p className="mt-1 text-[12px] text-white/75 sm:text-[13px]">
              지금 거래되고 있는 일상 클립을 바로 넘겨 보세요
            </p>
          </div>
          <Link
            href="/"
            className="shrink-0 text-[12px] font-medium text-white/85 underline-offset-4 transition-colors hover:text-white sm:text-[13px]"
          >
            더보기
          </Link>
        </div>

        {/* 3D 캐러셀: 원근 + 측면에 더 많은 클립이 이어진다는 힌트 */}
        <div
          className="relative mx-auto flex min-h-[min(52vw,420px)] max-w-5xl items-center justify-center py-4 sm:min-h-[min(48vw,460px)] md:py-6"
          style={{ perspective: "1400px" }}
        >
          {/* 깊이감 있는 반투명 무대 */}
          <div
            className="pointer-events-none absolute inset-x-[6%] inset-y-[12%] rounded-[50%] bg-white/[0.06] blur-3xl sm:inset-x-[10%]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-x-4 top-1/2 h-[78%] -translate-y-1/2 rounded-[3rem] border border-white/10 bg-gradient-to-b from-white/[0.07] to-transparent opacity-80 sm:inset-x-10"
            aria-hidden
          />

          {/* 더 뒤에 있는 클립 힌트 (맨 끝 얇은 슬라이스) */}
          {n > 3 && prev2Video && (
            <div
              className="pointer-events-none absolute left-0 top-1/2 z-0 hidden h-[46%] w-[10%] min-w-[44px] -translate-y-1/2 overflow-hidden rounded-l-2xl border border-white/10 opacity-35 sm:block md:left-[2%] md:h-[50%] md:w-[8%]"
              aria-hidden
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={prev2Video.poster}
                alt=""
                className="h-full w-full scale-110 object-cover blur-[2px]"
              />
            </div>
          )}
          {n > 3 && next2Video && (
            <div
              className="pointer-events-none absolute right-0 top-1/2 z-0 hidden h-[46%] w-[10%] min-w-[44px] -translate-y-1/2 overflow-hidden rounded-r-2xl border border-white/10 opacity-35 sm:block md:right-[2%] md:h-[50%] md:w-[8%]"
              aria-hidden
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={next2Video.poster}
                alt=""
                className="h-full w-full scale-110 object-cover blur-[2px]"
              />
            </div>
          )}

          <div
            className="relative flex w-full items-center justify-center gap-1 sm:gap-2 md:gap-4 [transform-style:preserve-3d]"
            style={{ transform: "translateZ(-24px)" }}
          >
            {/* 이전 프리뷰 — 왼쪽으로 원근 */}
            <button
              type="button"
              onClick={() => go(-1)}
              className="group relative z-10 aspect-[9/16] w-[min(22%,120px)] max-w-[120px] shrink-0 overflow-hidden rounded-2xl border border-white/20 bg-black/25 shadow-[0_20px_50px_-28px_rgba(0,0,0,0.85)] transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] [transform:rotateY(34deg)_translateZ(-36px)_scale(0.92)] hover:[transform:rotateY(30deg)_translateZ(-28px)_scale(0.94)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60 sm:w-[min(24%,140px)] sm:max-w-[140px] md:[transform:rotateY(38deg)_translateZ(-48px)_scale(0.9)] md:hover:[transform:rotateY(34deg)_translateZ(-36px)_scale(0.92)]"
              style={{ transformOrigin: "right center" }}
              aria-label="이전 클립"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={prevVideo.poster}
                alt=""
                className="h-full w-full object-cover opacity-90 transition duration-500 group-hover:opacity-100"
              />
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/35 to-transparent" />
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-300 group-hover:bg-black/25" />
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/95 text-slate-900 opacity-0 shadow-lg ring-1 ring-black/10 transition-all duration-300 ease-out group-hover:scale-100 group-hover:opacity-100 sm:h-14 sm:w-14">
                  <ChevronLeft className="h-6 w-6 sm:h-7 sm:w-7" />
                </span>
              </span>
            </button>

            {/* 중앙 메인 — 앞으로 */}
            <div
              className="relative z-20 aspect-[9/16] w-[min(52%,360px)] max-w-[360px] shrink-0 overflow-hidden rounded-2xl border border-white/25 bg-black/35 shadow-[0_28px_90px_-24px_rgba(0,0,0,0.75)] [transform:translateZ(56px)_scale(1.02)]"
              style={{ transformStyle: "preserve-3d" }}
            >
              {active && (
                <video
                  key={active.id}
                  ref={videoRef}
                  className="absolute inset-0 h-full w-full object-cover"
                  poster={active.poster}
                  playsInline
                  muted
                  loop
                  preload="metadata"
                >
                  <source src={active.src} type="video/mp4" />
                </video>
              )}
              <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10" />
            </div>

            {/* 다음 프리뷰 — 오른쪽으로 원근 */}
            <button
              type="button"
              onClick={() => go(1)}
              className="group relative z-10 aspect-[9/16] w-[min(22%,120px)] max-w-[120px] shrink-0 overflow-hidden rounded-2xl border border-white/20 bg-black/25 shadow-[0_20px_50px_-28px_rgba(0,0,0,0.85)] transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] [transform:rotateY(-34deg)_translateZ(-36px)_scale(0.92)] hover:[transform:rotateY(-30deg)_translateZ(-28px)_scale(0.94)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60 sm:w-[min(24%,140px)] sm:max-w-[140px] md:[transform:rotateY(-38deg)_translateZ(-48px)_scale(0.9)] md:hover:[transform:rotateY(-34deg)_translateZ(-36px)_scale(0.92)]"
              style={{ transformOrigin: "left center" }}
              aria-label="다음 클립"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={nextVideo.poster}
                alt=""
                className="h-full w-full object-cover opacity-90 transition duration-500 group-hover:opacity-100"
              />
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-l from-black/35 to-transparent" />
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-300 group-hover:bg-black/25" />
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/95 text-slate-900 opacity-0 shadow-lg ring-1 ring-black/10 transition-all duration-300 ease-out group-hover:scale-100 group-hover:opacity-100 sm:h-14 sm:w-14">
                  <ChevronRight className="h-6 w-6 sm:h-7 sm:w-7" />
                </span>
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
          <div className="min-w-0 text-center">
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
