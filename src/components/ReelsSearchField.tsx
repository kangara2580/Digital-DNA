"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useRef } from "react";
import { useTranslation } from "@/hooks/useTranslation";

const easeLayout =
  "duration-300 ease-out motion-reduce:duration-150 motion-reduce:ease-linear";

/** 호버·포커스: 브랜드 핑크(Pink Glo 계열 — --reels-point) */
const searchIconMotion =
  "transition-colors duration-200 ease-out group-hover:text-[color:var(--reels-point)] group-focus-within:text-[color:var(--reels-point)]";

/** compact 핑크 트레일(쇼핑망 검색 한 줄 등): 입력 h-9에 맞춘 원 */
const pinkSubmitTileClass =
  "reels-search-submit-tile flex h-[1.625rem] w-[1.625rem] shrink-0 items-center justify-center rounded-full bg-[color:var(--reels-point)] text-white shadow-sm transition-[filter,transform] hover:brightness-110 active:scale-[0.97] focus-visible:outline focus-visible:ring-2 focus-visible:ring-[color:var(--reels-point)] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 motion-reduce:transition-none motion-reduce:active:scale-100 motion-reduce:hover:brightness-100 [html[data-theme='light']_&]:hover:brightness-100 [html[data-theme='light']_&]:shadow-[0_1px_3px_rgba(255,45,141,0.25)] [html[data-theme='light']_&]:focus-visible:ring-offset-white";

/** 히어로·넓은 필드용 — 입력 필드(h-12) 옆 핑크 원 */
const pinkSubmitTileHeroClass =
  "reels-search-submit-tile flex h-11 w-11 min-h-[2.75rem] shrink-0 items-center justify-center rounded-full bg-[color:var(--reels-point)] text-white shadow-sm transition-[filter,transform] hover:brightness-110 active:scale-[0.97] focus-visible:outline focus-visible:ring-2 focus-visible:ring-[color:var(--reels-point)] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 motion-reduce:transition-none motion-reduce:active:scale-100 motion-reduce:hover:brightness-100 [html[data-theme='light']_&]:hover:brightness-100 [html[data-theme='light']_&]:shadow-[0_1px_3px_rgba(255,45,141,0.25)] [html[data-theme='light']_&]:focus-visible:ring-offset-white";

/**
 * 호버 펼침 트랙(h-11) 안의 제출 버튼 — 캡슐 테두리와 맞춘 지름
 */
const pinkSubmitTileExpandCapsuleClass =
  "reels-search-submit-tile flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[color:var(--reels-point)] text-white shadow-sm transition-[filter,transform] hover:brightness-110 active:scale-[0.97] focus-visible:outline focus-visible:ring-2 focus-visible:ring-[color:var(--reels-point)] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 motion-reduce:transition-none motion-reduce:active:scale-100 motion-reduce:hover:brightness-100 [html[data-theme='light']_&]:hover:brightness-100 [html[data-theme='light']_&]:shadow-[0_1px_3px_rgba(255,45,141,0.25)] [html[data-theme='light']_&]:focus-visible:ring-offset-white";

/** 핑크 검색 버튼 내 돋보기 — 라이트 전역 .text-white 보정 예외 */
const pinkSearchSubmitIconClass = "reels-search-submit-icon shrink-0 text-white";

/** 풀시청 검색창 펼침 — 느리고 부드러운 감속 */
const exploreWatchExpandTransition =
  "transition-[width,max-width,background-color,border-color,box-shadow,padding,border-radius,backdrop-filter] duration-[680ms] ease-[cubic-bezier(0.16,1,0.22,1)] motion-reduce:transition-none";

/**
 * 플로팅 검색 호버·포커스 — 우측(핑크 버튼) 고정, `w`가 왼쪽으로 살짝만 늘어남.
 * 접힘 w-11(2.75rem) → 펼침 약 11~12rem.
 */
const exploreWatchExpandedWidthClasses =
  "hover:w-[min(11rem,calc(100vw-var(--reels-rail-w,0px)-12rem))] sm:hover:w-[min(12rem,calc(100vw-var(--reels-rail-w,0px)-12.5rem))] focus-within:w-[min(11rem,calc(100vw-var(--reels-rail-w,0px)-12rem))] sm:focus-within:w-[min(12rem,calc(100vw-var(--reels-rail-w,0px)-12.5rem))]";

/** 헤더 인라인 — 플로팅보다 한 단계 짧게 */
const exploreWatchExpandedWidthClassesInline =
  "hover:w-[min(10rem,calc(100vw-var(--reels-rail-w,0px)-13rem))] sm:hover:w-[min(11rem,calc(100vw-var(--reels-rail-w,0px)-13.5rem))] focus-within:w-[min(10rem,calc(100vw-var(--reels-rail-w,0px)-13rem))] sm:focus-within:w-[min(11rem,calc(100vw-var(--reels-rail-w,0px)-13.5rem))]";

export function ReelsSearchField({
  compact,
  topNavPill = false,
  /** 메인 히어로: 넓은 둥근 필드·핑크 포인트 (다른 화면과 구분) */
  homeHero = false,
  /** 탐색 풀시청·쇼핑 헤더: 핑크 버튼 + 트랙이 왼쪽으로 펼침(max-width 트랜지션) */
  exploreWatchExpand = false,
  /** exploreWatchExpand + 헤더 툴바 한 줄: 플로팅보다 짧은 펼침 폭 */
  exploreWatchExpandInline = false,
  /** compact: 트레일링 제출 버튼을 메인과 동일 핑크 타일로 */
  pinkTrailingSubmit = false,
  /** compact+pinkTrailingSubmit: 입력·핑크 버튼을 계정 캡슐(h-11)과 같은 높이로 (탐색 우상단 등 좁은 슬롯) */
  pinkTrailingMatchAccountPill = false,
  /** compact+pinkTrailingSubmit: h-11 정렬 + 검색란은 가로 100% (몰 카테고리 헤더 한 줄) */
  pinkTrailingTallFullWidth = false,
  q,
  setQ,
  showTrailingIcon = true,
  onAfterSearch,
  onExpandTrayOpenChange,
}: {
  compact: boolean;
  topNavPill?: boolean;
  homeHero?: boolean;
  exploreWatchExpand?: boolean;
  exploreWatchExpandInline?: boolean;
  pinkTrailingSubmit?: boolean;
  pinkTrailingMatchAccountPill?: boolean;
  pinkTrailingTallFullWidth?: boolean;
  q: string;
  setQ: (v: string) => void;
  showTrailingIcon?: boolean;
  onAfterSearch?: () => void;
  onExpandTrayOpenChange?: (open: boolean) => void;
}) {
  const router = useRouter();
  const { t } = useTranslation();
  const expandTrayFormRef = useRef<HTMLFormElement>(null);

  const runSearch = useCallback(() => {
    const t = q.trim();
    if (!t) return;
    router.push(`/search?q=${encodeURIComponent(t)}`);
    onAfterSearch?.();
  }, [q, router, onAfterSearch]);

  const syncExpandTrayOpen = useCallback(
    (open: boolean) => {
      onExpandTrayOpenChange?.(open);
    },
    [onExpandTrayOpenChange],
  );

  const onExpandTrayPointerLeave = useCallback(() => {
    if (!onExpandTrayOpenChange) return;
    requestAnimationFrame(() => {
      const el = expandTrayFormRef.current;
      if (el && !el.matches(":focus-within")) {
        onExpandTrayOpenChange(false);
      }
    });
  }, [onExpandTrayOpenChange]);

  const onExpandTrayFocusOut = useCallback(() => {
    if (!onExpandTrayOpenChange) return;
    requestAnimationFrame(() => {
      const el = expandTrayFormRef.current;
      if (el && !el.contains(document.activeElement)) {
        onExpandTrayOpenChange(false);
      }
    });
  }, [onExpandTrayOpenChange]);

  const pinkBorder =
    "hover:border-[color:rgba(255,45,141,0.42)] focus:border-[color:rgba(255,45,141,0.55)] [html[data-theme='light']_&]:hover:border-black [html[data-theme='light']_&]:focus:border-black";

  /** 라이트: 검정 테두리 2px (호버·포커스도 핑크 테두리 없음) */
  const lightSearchBorder =
    "[html[data-theme='light']_&]:border-2 [html[data-theme='light']_&]:border-black [html[data-theme='light']_&]:hover:border-black [html[data-theme='light']_&]:focus:border-black [html[data-theme='light']_&]:active:border-black";

  const mode = homeHero ? "homeHero" : topNavPill ? "pill" : compact ? "compact" : "default";

  const navPairedPink =
    compact && pinkTrailingSubmit && pinkTrailingMatchAccountPill;
  const mallRowTallPink =
    compact && pinkTrailingSubmit && pinkTrailingTallFullWidth;
  const tallPinkTrailCompact = navPairedPink || mallRowTallPink;

  const inputTransitionClass =
    mode === "homeHero"
      ? "transition-[border-color,background-color,box-shadow,height,padding,font-size,color] duration-[480ms] ease-[cubic-bezier(0.33,1,0.45,1)] motion-reduce:duration-200 motion-reduce:ease-linear"
      : `transition-[height,padding,font-size,background-color,border-color,color,box-shadow] ${easeLayout}`;

  let inputClassByMode =
    mode === "homeHero"
      ? `mall-search min-h-[3rem] h-12 rounded-full border border-white/18 bg-zinc-950 pl-4 ${showTrailingIcon ? "pr-14" : "pr-4"} text-[15px] font-medium leading-snug text-zinc-100 shadow-[0_10px_40px_-14px_rgba(0,0,0,0.5)] hover:border-white/26 hover:bg-zinc-900 hover:shadow-[0_12px_44px_-14px_rgba(0,0,0,0.54)] focus:border-white/50 focus:bg-zinc-900 focus:shadow-[0_0_0_1px_rgba(255,255,255,0.35),0_14px_48px_-16px_rgba(0,0,0,0.58)] focus:outline-none focus:ring-0 active:border-white/55 [html[data-theme='dark']_&]:text-zinc-50 [html[data-theme='light']_&]:bg-zinc-100 [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:shadow-[0_4px_28px_-10px_rgba(0,0,0,0.14)] [html[data-theme='light']_&]:hover:bg-white [html[data-theme='light']_&]:hover:shadow-[0_8px_32px_-12px_rgba(0,0,0,0.1)] [html[data-theme='light']_&]:focus:bg-white [html[data-theme='light']_&]:focus:shadow-[0_8px_32px_-12px_rgba(0,0,0,0.1)] ${lightSearchBorder}`
      : mode === "pill"
        ? `h-11 min-h-[2.75rem] rounded-full border border-white/40 bg-zinc-900 pl-3.5 ${showTrailingIcon ? "pr-11" : "pr-3.5"} text-[13px] text-zinc-100 shadow-[0_0_0_1px_rgba(255,255,255,0.05)] hover:border-white/52 hover:bg-zinc-800 focus:bg-zinc-800 ${pinkBorder} [html[data-theme='dark']_&]:text-zinc-50 [html[data-theme='light']_&]:bg-zinc-100 [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:shadow-[0_0_0_1px_rgba(0,0,0,0.05)] [html[data-theme='light']_&]:hover:bg-white [html[data-theme='light']_&]:focus:bg-white ${lightSearchBorder}`
        : mode === "compact"
          ? tallPinkTrailCompact
            ? `h-11 min-h-[2.75rem] rounded-full border border-white/40 bg-zinc-900 pl-3.5 ${showTrailingIcon ? "pr-10" : "pr-3.5"} text-[13px] text-zinc-100 shadow-[0_0_0_1px_rgba(255,255,255,0.05)] hover:border-white/52 hover:bg-zinc-800 focus:bg-zinc-800 ${pinkBorder} [html[data-theme='dark']_&]:text-zinc-50 [html[data-theme='light']_&]:bg-zinc-100 [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:shadow-[0_0_0_1px_rgba(0,0,0,0.05)] [html[data-theme='light']_&]:hover:bg-white [html[data-theme='light']_&]:focus:bg-white ${lightSearchBorder}`
            : `h-9 border-white/15 bg-zinc-950 pl-3 ${showTrailingIcon ? "pr-10" : "pr-3"} text-[13px] ${pinkBorder} hover:bg-zinc-900 focus:bg-zinc-900 [html[data-theme='dark']_&]:border-white/20 [html[data-theme='dark']_&]:bg-zinc-950 [html[data-theme='dark']_&]:hover:bg-zinc-900 [html[data-theme='dark']_&]:focus:bg-zinc-800 [html[data-theme='light']_&]:bg-zinc-50 [html[data-theme='light']_&]:hover:bg-white [html[data-theme='light']_&]:focus:bg-white ${lightSearchBorder}`
          : `h-[3.25rem] border-2 border-white/20 bg-zinc-950 pl-6 ${showTrailingIcon ? "pr-14" : "pr-6"} text-[15px] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] ${pinkBorder} hover:bg-zinc-900 focus:bg-zinc-900 [html[data-theme='dark']_&]:border-white/25 [html[data-theme='dark']_&]:bg-zinc-950 [html[data-theme='dark']_&]:hover:bg-zinc-900 [html[data-theme='dark']_&]:focus:bg-zinc-800 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:shadow-[inset_0_2px_4px_rgba(0,0,0,0.04)] [html[data-theme='light']_&]:hover:bg-zinc-50 [html[data-theme='light']_&]:focus:bg-white ${lightSearchBorder}`;

  const placeholderClass =
    mode === "homeHero"
      ? "placeholder:font-normal placeholder:text-zinc-500 [html[data-theme='light']_&]:placeholder:text-zinc-400"
      : "placeholder:text-zinc-600 [html[data-theme='dark']_&]:placeholder:text-zinc-300 [html[data-theme='light']_&]:placeholder:text-zinc-500";

  if (exploreWatchExpand) {
    const expandedWidthClasses = exploreWatchExpandInline
      ? exploreWatchExpandedWidthClassesInline
      : exploreWatchExpandedWidthClasses;
    return (
      <form
        ref={expandTrayFormRef}
        className={`group relative ml-auto flex h-11 w-11 shrink-0 flex-row items-center justify-end self-center overflow-visible rounded-full border border-transparent bg-transparent py-0 pl-1 shadow-none backdrop-blur-0 ${expandedWidthClasses} hover:overflow-hidden hover:border-white/28 hover:bg-zinc-900 hover:pr-1 focus-within:overflow-hidden focus-within:border-white/28 focus-within:bg-zinc-900 focus-within:pr-1 motion-reduce:overflow-hidden motion-reduce:border-white/25 motion-reduce:bg-zinc-900 motion-reduce:pr-1 ${exploreWatchExpandTransition} [html[data-theme='dark']_&]:hover:border-white/30 [html[data-theme='dark']_&]:hover:bg-zinc-800 [html[data-theme='dark']_&]:focus-within:border-white/30 [html[data-theme='dark']_&]:focus-within:bg-zinc-800 [html[data-theme='light']_&]:border-2 [html[data-theme='light']_&]:border-black [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:hover:border-black [html[data-theme='light']_&]:hover:bg-white [html[data-theme='light']_&]:focus-within:border-black [html[data-theme='light']_&]:focus-within:bg-white`}
        onPointerEnter={
          onExpandTrayOpenChange ? () => syncExpandTrayOpen(true) : undefined
        }
        onPointerLeave={
          onExpandTrayOpenChange ? onExpandTrayPointerLeave : undefined
        }
        onFocusCapture={
          onExpandTrayOpenChange ? () => syncExpandTrayOpen(true) : undefined
        }
        onBlurCapture={onExpandTrayOpenChange ? onExpandTrayFocusOut : undefined}
        onSubmit={(e) => {
          e.preventDefault();
          runSearch();
        }}
      >
        <input
          type="search"
          name="q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder=""
          autoComplete="off"
          enterKeyHint="search"
          className={`mall-search min-h-0 w-0 min-w-0 flex-1 appearance-none border-0 bg-transparent py-0 pl-0 pr-1 text-[13px] text-zinc-100 outline-none ring-0 transition-[max-width,opacity,color,padding,width] duration-[680ms] ease-[cubic-bezier(0.16,1,0.22,1)] focus:ring-0 motion-reduce:transition-none ${placeholderClass} rounded-none opacity-0 pointer-events-none [-webkit-appearance:none] group-hover:w-auto group-hover:min-w-0 group-hover:pl-3 group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:w-auto group-focus-within:min-w-0 group-focus-within:pl-3 group-focus-within:opacity-100 group-focus-within:pointer-events-auto motion-reduce:pointer-events-auto motion-reduce:w-auto motion-reduce:pl-3 motion-reduce:opacity-100 [html[data-theme='dark']_&]:text-zinc-100 [html[data-theme='light']_&]:text-zinc-900 [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden`}
          aria-label={t("search.aria.input")}
        />
        {showTrailingIcon ? (
          <button
            type="submit"
            className={`${pinkSubmitTileExpandCapsuleClass} shrink-0`}
            aria-label={t("search.aria.submit")}
          >
            <Search
              className={`${pinkSearchSubmitIconClass} h-5 w-5`}
              strokeWidth={2.25}
              aria-hidden
            />
          </button>
        ) : null}
      </form>
    );
  }

  return (
    <form
      className={`group relative min-w-0 ${
        mallRowTallPink
          ? "h-11 w-full"
          : navPairedPink
            ? "h-11 w-[min(15rem,46vw)] shrink-0 sm:w-[min(18rem,40vw)]"
            : "w-full"
      }`}
      onSubmit={(e) => {
        e.preventDefault();
        runSearch();
      }}
    >
      <input
        type="search"
        name="q"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder=""
        autoComplete="off"
        enterKeyHint="search"
        className={`mall-search w-full border outline-none ring-0 ${inputTransitionClass} focus:ring-0 ${placeholderClass} rounded-full ${inputClassByMode}`}
        aria-label={t("search.aria.input")}
      />
      {showTrailingIcon ? (
        <button
          type="submit"
          className={
            mode === "homeHero"
              ? `absolute right-2 top-1/2 z-10 -translate-y-1/2 ${pinkSubmitTileHeroClass}`
              : mode === "compact" && pinkTrailingSubmit
                ? `absolute ${navPairedPink || mallRowTallPink ? "right-2" : "right-1"} top-1/2 z-10 -translate-y-1/2 ${
                    navPairedPink || mallRowTallPink ? pinkSubmitTileExpandCapsuleClass : pinkSubmitTileClass
                  }`
                : `absolute top-1/2 z-10 -translate-y-1/2 rounded-full p-1 text-zinc-500 transition-colors hover:text-[color:var(--reels-point)] focus-visible:outline focus-visible:ring-2 focus-visible:ring-[color:rgba(255,45,141,0.4)] [html[data-theme='dark']_&]:text-zinc-200 [html[data-theme='light']_&]:text-zinc-600 ${
                    mode === "pill" ? "right-1.5" : mode === "compact" ? "right-1.5" : "right-3"
                  }`
          }
          aria-label={t("search.aria.submit")}
        >
          {mode === "homeHero" || (mode === "compact" && pinkTrailingSubmit) ? (
            <Search
              className={`${pinkSearchSubmitIconClass} ${
                mode === "homeHero"
                  ? "h-6 w-6"
                  : navPairedPink || mallRowTallPink
                    ? "h-5 w-5"
                    : "h-[1.125rem] w-[1.125rem]"
              }`}
              strokeWidth={2.25}
              aria-hidden
            />
          ) : (
            <span className={`block ${searchIconMotion}`}>
              <Search
                className={`shrink-0 ${
                  mode === "pill" ? "h-6 w-6" : mode === "compact" ? "h-4 w-4" : "h-5 w-5"
                }`}
                strokeWidth={2}
                aria-hidden
              />
            </span>
          )}
        </button>
      ) : null}
    </form>
  );
}
