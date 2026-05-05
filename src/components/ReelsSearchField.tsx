"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useTranslation } from "@/hooks/useTranslation";

const easeLayout =
  "duration-300 ease-out motion-reduce:duration-150 motion-reduce:ease-linear";

/** 호버·포커스: 브랜드 핑크(Pink Glo 계열 — --reels-point) */
const searchIconMotion =
  "transition-colors duration-200 ease-out group-hover:text-[color:var(--reels-point)] group-focus-within:text-[color:var(--reels-point)]";

/** compact 핑크 트레일(쇼핑망 검색 한 줄 등): 입력 h-9에 맞춘 작은 원 */
const pinkSubmitTileClass =
  "flex h-[1.625rem] w-[1.625rem] shrink-0 items-center justify-center rounded-full bg-[color:var(--reels-point)] text-white shadow-sm transition-[filter,transform] hover:brightness-110 active:scale-[0.97] focus-visible:outline focus-visible:ring-2 focus-visible:ring-[color:var(--reels-point)] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 motion-reduce:transition-none motion-reduce:active:scale-100 motion-reduce:hover:brightness-100 [html[data-theme='light']_&]:shadow-[0_1px_3px_rgba(228,41,128,0.25)] [html[data-theme='light']_&]:focus-visible:ring-offset-white";

/** 히어로·탐색 풀시청·계정 캡슐(h-11)와 나란히: 동일 지름으로 정렬 */
const pinkSubmitTileHeroClass =
  "flex h-11 w-11 min-h-[2.75rem] shrink-0 items-center justify-center rounded-full bg-[color:var(--reels-point)] text-white shadow-sm transition-[filter,transform] hover:brightness-110 active:scale-[0.97] focus-visible:outline focus-visible:ring-2 focus-visible:ring-[color:var(--reels-point)] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 motion-reduce:transition-none motion-reduce:active:scale-100 motion-reduce:hover:brightness-100 [html[data-theme='light']_&]:shadow-[0_1px_3px_rgba(228,41,128,0.25)] [html[data-theme='light']_&]:focus-visible:ring-offset-white";

/** 풀시청 검색창 펼침 — 느리고 부드러운 감속 */
const exploreWatchExpandTransition =
  "transition-[max-width,background-color,border-color,box-shadow,padding,border-radius] duration-[680ms] ease-[cubic-bezier(0.16,1,0.22,1)] motion-reduce:transition-none";

/**
 * 풀시청 호버·포커스 시 검색 트랙 max-width (뷰포트별).
 * 창 모드(sm~md): 짧게 — 유저 이미지와 비슷한 정도.
 * 큰 화면(lg~): 왼쪽으로 길게 — 전체화면에서 체감되도록 rem 상한을 크게 올림.
 * calc(100vw - 레일 - 우측 여유)로 동영상·우측 레일과 간격 유지.
 */
const exploreWatchExpandedWidthClasses =
  "hover:max-w-[min(17rem,calc(100vw-var(--reels-rail-w,0px)-10rem))] sm:hover:max-w-[min(19.5rem,calc(100vw-var(--reels-rail-w,0px)-11rem))] md:hover:max-w-[min(24rem,calc(100vw-var(--reels-rail-w,0px)-12rem))] lg:hover:max-w-[min(36rem,calc(100vw-var(--reels-rail-w,0px)-13rem))] xl:hover:max-w-[min(50rem,calc(100vw-var(--reels-rail-w,0px)-14rem))] 2xl:hover:max-w-[min(60rem,calc(100vw-var(--reels-rail-w,0px)-15rem))] focus-within:max-w-[min(17rem,calc(100vw-var(--reels-rail-w,0px)-10rem))] sm:focus-within:max-w-[min(19.5rem,calc(100vw-var(--reels-rail-w,0px)-11rem))] md:focus-within:max-w-[min(24rem,calc(100vw-var(--reels-rail-w,0px)-12rem))] lg:focus-within:max-w-[min(36rem,calc(100vw-var(--reels-rail-w,0px)-13rem))] xl:focus-within:max-w-[min(50rem,calc(100vw-var(--reels-rail-w,0px)-14rem))] 2xl:focus-within:max-w-[min(60rem,calc(100vw-var(--reels-rail-w,0px)-15rem))]";

export function ReelsSearchField({
  compact,
  topNavPill = false,
  /** 메인 히어로: 넓은 둥근 필드·핑크 포인트 (다른 화면과 구분) */
  homeHero = false,
  /** 탐색 풀시청: 핑크 버튼 + 트랙이 왼쪽으로 펼침(max-width 트랜지션) */
  exploreWatchExpand = false,
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
}: {
  compact: boolean;
  topNavPill?: boolean;
  homeHero?: boolean;
  exploreWatchExpand?: boolean;
  pinkTrailingSubmit?: boolean;
  pinkTrailingMatchAccountPill?: boolean;
  pinkTrailingTallFullWidth?: boolean;
  q: string;
  setQ: (v: string) => void;
  showTrailingIcon?: boolean;
  onAfterSearch?: () => void;
}) {
  const router = useRouter();
  const { t } = useTranslation();

  const runSearch = useCallback(() => {
    const t = q.trim();
    if (!t) return;
    router.push(`/search?q=${encodeURIComponent(t)}`);
    onAfterSearch?.();
  }, [q, router, onAfterSearch]);

  const pinkBorder =
    "hover:border-[color:rgba(255,45,141,0.42)] focus:border-[color:rgba(255,45,141,0.55)] [html[data-theme='light']_&]:hover:border-[color:rgba(255,45,141,0.38)] [html[data-theme='light']_&]:focus:border-[color:rgba(255,45,141,0.48)]";

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
      ? `mall-search min-h-[3rem] h-12 rounded-full border border-white/18 bg-white/[0.06] pl-4 ${showTrailingIcon ? "pr-14" : "pr-4"} text-[15px] font-medium leading-snug text-zinc-100 shadow-[0_10px_40px_-14px_rgba(0,0,0,0.5)] backdrop-blur-xl hover:border-white/26 hover:bg-white/[0.09] hover:shadow-[0_12px_44px_-14px_rgba(0,0,0,0.54)] focus:border-white/50 focus:bg-white/[0.1] focus:shadow-[0_0_0_1px_rgba(255,255,255,0.35),0_14px_48px_-16px_rgba(0,0,0,0.58)] focus:outline-none focus:ring-0 active:border-white/55 [html[data-theme='dark']_&]:text-zinc-50 [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:bg-zinc-100/95 [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:shadow-[0_4px_28px_-10px_rgba(0,0,0,0.14)] [html[data-theme='light']_&]:hover:border-zinc-400 [html[data-theme='light']_&]:hover:bg-white [html[data-theme='light']_&]:hover:shadow-[0_8px_32px_-12px_rgba(0,0,0,0.1)] [html[data-theme='light']_&]:focus:border-white [html[data-theme='light']_&]:focus:bg-white [html[data-theme='light']_&]:focus:shadow-[0_0_0_2px_rgba(255,255,255,1),0_0_0_3px_rgba(15,23,42,0.08),0_8px_32px_-12px_rgba(0,0,0,0.08)] [html[data-theme='light']_&]:active:border-white`
      : mode === "pill"
        ? `h-11 min-h-[2.75rem] rounded-full border border-white/40 bg-black/20 pl-3.5 ${showTrailingIcon ? "pr-11" : "pr-3.5"} text-[13px] text-zinc-100 shadow-[0_0_0_1px_rgba(255,255,255,0.05)] backdrop-blur-md hover:border-white/52 hover:bg-black/28 focus:bg-black/28 ${pinkBorder} [html[data-theme='dark']_&]:text-zinc-50 [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:bg-white/[0.6] [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:shadow-[0_0_0_1px_rgba(0,0,0,0.05)] [html[data-theme='light']_&]:hover:border-zinc-400 [html[data-theme='light']_&]:hover:bg-white/[0.72] [html[data-theme='light']_&]:focus:bg-white/[0.72]`
        : mode === "compact"
          ? tallPinkTrailCompact
            ? `h-11 min-h-[2.75rem] rounded-full border border-white/40 bg-black/20 pl-3.5 ${showTrailingIcon ? "pr-11" : "pr-3.5"} text-[13px] text-zinc-100 shadow-[0_0_0_1px_rgba(255,255,255,0.05)] backdrop-blur-md hover:border-white/52 hover:bg-black/28 focus:bg-black/28 ${pinkBorder} [html[data-theme='dark']_&]:text-zinc-50 [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:bg-white/[0.6] [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:shadow-[0_0_0_1px_rgba(0,0,0,0.05)] [html[data-theme='light']_&]:hover:border-zinc-400 [html[data-theme='light']_&]:hover:bg-white/[0.72] [html[data-theme='light']_&]:focus:bg-white/[0.72]`
            : `h-9 border-white/15 bg-white/[0.06] pl-3 ${showTrailingIcon ? "pr-10" : "pr-3"} text-[13px] ${pinkBorder} hover:bg-white/10 focus:bg-white/[0.09] [html[data-theme='dark']_&]:border-white/20 [html[data-theme='dark']_&]:bg-white/[0.1] [html[data-theme='dark']_&]:hover:bg-white/[0.14] [html[data-theme='dark']_&]:focus:bg-white/[0.16] [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50 [html[data-theme='light']_&]:hover:bg-white [html[data-theme='light']_&]:focus:bg-white`
          : `h-[3.25rem] border-2 border-white/20 bg-white/[0.08] pl-6 ${showTrailingIcon ? "pr-14" : "pr-6"} text-[15px] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] ${pinkBorder} hover:bg-white/12 focus:bg-white/[0.1] [html[data-theme='dark']_&]:border-white/25 [html[data-theme='dark']_&]:bg-white/[0.12] [html[data-theme='dark']_&]:hover:bg-white/[0.16] [html[data-theme='dark']_&]:focus:bg-white/[0.18] [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:shadow-[inset_0_2px_4px_rgba(0,0,0,0.04)] [html[data-theme='light']_&]:hover:bg-zinc-50 [html[data-theme='light']_&]:focus:bg-white`;

  const placeholderClass =
    mode === "homeHero"
      ? "placeholder:font-normal placeholder:text-zinc-500 [html[data-theme='light']_&]:placeholder:text-zinc-400"
      : "placeholder:text-zinc-600 [html[data-theme='dark']_&]:placeholder:text-zinc-300 [html[data-theme='light']_&]:placeholder:text-zinc-500";

  if (exploreWatchExpand) {
    return (
      <form
        className={`group relative ml-auto flex h-11 max-w-11 shrink-0 flex-row items-center justify-end self-center overflow-visible rounded-none border border-transparent bg-transparent py-0 shadow-none backdrop-blur-0 ${exploreWatchExpandedWidthClasses} hover:overflow-hidden hover:rounded-full hover:border-white/15 hover:bg-white/[0.06] hover:pr-1 focus-within:overflow-hidden focus-within:rounded-full focus-within:border-white/15 focus-within:bg-white/[0.06] focus-within:pr-1 motion-reduce:overflow-hidden motion-reduce:rounded-full motion-reduce:border-white/15 motion-reduce:bg-white/[0.06] motion-reduce:pr-1 ${exploreWatchExpandTransition} [html[data-theme='dark']_&]:hover:border-white/20 [html[data-theme='dark']_&]:hover:bg-white/[0.1] [html[data-theme='dark']_&]:focus-within:border-white/20 [html[data-theme='dark']_&]:focus-within:bg-white/[0.1] [html[data-theme='light']_&]:hover:border-zinc-200 [html[data-theme='light']_&]:hover:bg-zinc-50 [html[data-theme='light']_&]:focus-within:border-zinc-200 [html[data-theme='light']_&]:focus-within:bg-zinc-50`}
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
          className={`mall-search min-h-0 w-0 min-w-0 flex-1 appearance-none border-0 bg-transparent py-0 pl-0 pr-1 text-[13px] text-zinc-100 outline-none ring-0 transition-[max-width,opacity,color,padding,width] duration-500 ease-[cubic-bezier(0.16,1,0.22,1)] focus:ring-0 motion-reduce:transition-none ${placeholderClass} rounded-none opacity-0 pointer-events-none [-webkit-appearance:none] group-hover:w-auto group-hover:min-w-0 group-hover:pl-3 group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:w-auto group-focus-within:min-w-0 group-focus-within:pl-3 group-focus-within:opacity-100 group-focus-within:pointer-events-auto motion-reduce:pointer-events-auto motion-reduce:w-auto motion-reduce:pl-3 motion-reduce:opacity-100 [html[data-theme='dark']_&]:text-zinc-100 [html[data-theme='light']_&]:text-zinc-900 [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden`}
          aria-label={t("search.aria.input")}
        />
        {showTrailingIcon ? (
          <button
            type="submit"
            className={`${pinkSubmitTileHeroClass} shrink-0`}
            aria-label={t("search.aria.submit")}
          >
            <span className="block">
              <Search
                className="h-5 w-5 shrink-0"
                strokeWidth={2.25}
                aria-hidden
              />
            </span>
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
                ? `absolute ${navPairedPink || mallRowTallPink ? "right-1.5" : "right-1"} top-1/2 z-10 -translate-y-1/2 ${
                    navPairedPink || mallRowTallPink ? pinkSubmitTileHeroClass : pinkSubmitTileClass
                  }`
                : `absolute top-1/2 z-10 -translate-y-1/2 rounded-full p-1 text-zinc-500 transition-colors hover:text-[color:var(--reels-point)] focus-visible:outline focus-visible:ring-2 focus-visible:ring-[color:rgba(255,45,141,0.4)] [html[data-theme='dark']_&]:text-zinc-200 [html[data-theme='light']_&]:text-zinc-600 ${
                    mode === "pill" ? "right-1.5" : mode === "compact" ? "right-1.5" : "right-3"
                  }`
          }
          aria-label={t("search.aria.submit")}
        >
          <span
            className={
              mode === "homeHero" ||
              (mode === "compact" && pinkTrailingSubmit)
                ? "block"
                : `block ${searchIconMotion}`
            }
          >
            <Search
              className={`shrink-0 ${
                mode === "homeHero"
                  ? "h-[1.125rem] w-[1.125rem]"
                  : mode === "compact" && pinkTrailingSubmit
                    ? navPairedPink || mallRowTallPink
                      ? "h-5 w-5"
                      : "h-[1.125rem] w-[1.125rem]"
                    : mode === "pill"
                      ? "h-6 w-6"
                      : mode === "compact"
                        ? "h-4 w-4"
                        : "h-5 w-5"
              }`}
              strokeWidth={
                mode === "homeHero" || (mode === "compact" && pinkTrailingSubmit)
                  ? 2.25
                  : 2
              }
              aria-hidden
            />
          </span>
        </button>
      ) : null}
    </form>
  );
}
