"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

const easeLayout =
  "duration-300 ease-out motion-reduce:duration-150 motion-reduce:ease-linear";

const searchEase =
  "duration-300 ease-out motion-reduce:duration-150 motion-reduce:ease-linear";

/** 호버·포커스: 브랜드 핑크(Pink Glo 계열 — --reels-point) */
const searchIconMotion =
  "transition-colors duration-200 ease-out group-hover:text-[color:var(--reels-point)] group-focus-within:text-[color:var(--reels-point)]";

export function ReelsSearchField({
  compact,
  topNavPill = false,
  /** 메인 히어로: 넓은 둥근 필드·플레이스홀더·핑크 포인트 (다른 화면과 구분) */
  homeHero = false,
  q,
  setQ,
  showTrailingIcon = true,
  onAfterSearch,
}: {
  compact: boolean;
  topNavPill?: boolean;
  homeHero?: boolean;
  q: string;
  setQ: (v: string) => void;
  showTrailingIcon?: boolean;
  onAfterSearch?: () => void;
}) {
  const router = useRouter();

  const runSearch = useCallback(() => {
    const t = q.trim();
    if (!t) return;
    router.push(`/search?q=${encodeURIComponent(t)}`);
    onAfterSearch?.();
  }, [q, router, onAfterSearch]);

  const pinkBorder =
    "hover:border-[color:rgba(255,45,141,0.42)] focus:border-[color:rgba(255,45,141,0.55)] [html[data-theme='light']_&]:hover:border-[color:rgba(255,45,141,0.38)] [html[data-theme='light']_&]:focus:border-[color:rgba(255,45,141,0.48)]";

  const mode = homeHero ? "homeHero" : topNavPill ? "pill" : compact ? "compact" : "default";

  const inputClassByMode =
    mode === "homeHero"
      ? `mall-search min-h-[3rem] h-12 rounded-2xl border border-white/15 bg-zinc-950/50 pl-4 ${showTrailingIcon ? "pr-14" : "pr-4"} text-[15px] font-medium leading-snug text-zinc-100 shadow-[0_10px_40px_-14px_rgba(0,0,0,0.65)] backdrop-blur-xl transition-[border-color,background-color,box-shadow] ease-out hover:border-white/24 hover:bg-zinc-950/58 focus:border-[color:rgba(228,41,128,0.55)] focus:bg-zinc-950/65 focus:shadow-[0_0_0_3px_rgba(228,41,128,0.22),0_14px_48px_-18px_rgba(0,0,0,0.7)] focus:outline-none focus:ring-0 [html[data-theme='dark']_&]:text-zinc-50 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white/[0.94] [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:shadow-[0_4px_28px_-10px_rgba(0,0,0,0.12)] [html[data-theme='light']_&]:hover:border-zinc-300 [html[data-theme='light']_&]:focus:border-[color:rgba(228,41,128,0.5)] [html[data-theme='light']_&]:focus:shadow-[0_0_0_3px_rgba(228,41,128,0.18),0_8px_32px_-12px_rgba(0,0,0,0.1)]`
      : mode === "pill"
        ? `h-11 min-h-[2.75rem] rounded-full border border-white/40 bg-black/20 pl-3.5 ${showTrailingIcon ? "pr-11" : "pr-3.5"} text-[13px] text-zinc-100 shadow-[0_0_0_1px_rgba(255,255,255,0.05)] backdrop-blur-md hover:border-white/52 hover:bg-black/28 focus:bg-black/28 ${pinkBorder} [html[data-theme='dark']_&]:text-zinc-50 [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:bg-white/[0.6] [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:shadow-[0_0_0_1px_rgba(0,0,0,0.05)] [html[data-theme='light']_&]:hover:border-zinc-400 [html[data-theme='light']_&]:hover:bg-white/[0.72] [html[data-theme='light']_&]:focus:bg-white/[0.72]`
        : mode === "compact"
          ? `h-9 border-white/15 bg-white/[0.06] pl-3 ${showTrailingIcon ? "pr-10" : "pr-3"} text-[13px] ${pinkBorder} hover:bg-white/10 focus:bg-white/[0.09] [html[data-theme='dark']_&]:border-white/20 [html[data-theme='dark']_&]:bg-white/[0.1] [html[data-theme='dark']_&]:hover:bg-white/[0.14] [html[data-theme='dark']_&]:focus:bg-white/[0.16] [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50 [html[data-theme='light']_&]:hover:bg-white [html[data-theme='light']_&]:focus:bg-white`
          : `h-[3.25rem] border-2 border-white/20 bg-white/[0.08] pl-6 ${showTrailingIcon ? "pr-14" : "pr-6"} text-[15px] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] ${pinkBorder} hover:bg-white/12 focus:bg-white/[0.1] [html[data-theme='dark']_&]:border-white/25 [html[data-theme='dark']_&]:bg-white/[0.12] [html[data-theme='dark']_&]:hover:bg-white/[0.16] [html[data-theme='dark']_&]:focus:bg-white/[0.18] [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:shadow-[inset_0_2px_4px_rgba(0,0,0,0.04)] [html[data-theme='light']_&]:hover:bg-zinc-50 [html[data-theme='light']_&]:focus:bg-white`;

  const placeholderClass =
    mode === "homeHero"
      ? "placeholder:font-normal placeholder:text-zinc-500 [html[data-theme='light']_&]:placeholder:text-zinc-400"
      : "placeholder:text-zinc-600 [html[data-theme='dark']_&]:placeholder:text-zinc-300 [html[data-theme='light']_&]:placeholder:text-zinc-500";

  return (
    <form
      className="group relative"
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
        placeholder={mode === "homeHero" ? "릴스, 키워드, 분위기 검색" : ""}
        autoComplete="off"
        enterKeyHint="search"
        className={`mall-search w-full border outline-none ring-0 transition-[height,padding,font-size,background-color,border-color,color,box-shadow] ${easeLayout} ${searchEase} focus:ring-0 ${placeholderClass} ${
          mode === "homeHero" ? "rounded-2xl" : "rounded-full"
        } ${inputClassByMode}`}
        aria-label="릴스·키워드 검색"
      />
      {showTrailingIcon ? (
        <button
          type="submit"
          className={
            mode === "homeHero"
              ? "absolute right-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl bg-[color:var(--reels-point)] text-white shadow-sm transition-[filter,transform] hover:brightness-110 active:scale-[0.97] focus-visible:outline focus-visible:ring-2 focus-visible:ring-[color:var(--reels-point)] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 motion-reduce:transition-none motion-reduce:active:scale-100 motion-reduce:hover:brightness-100 [html[data-theme='light']_&]:shadow-[0_1px_3px_rgba(228,41,128,0.25)] [html[data-theme='light']_&]:focus-visible:ring-offset-white"
              : `absolute top-1/2 z-10 -translate-y-1/2 rounded-full p-1 text-zinc-500 transition-colors hover:text-[color:var(--reels-point)] focus-visible:outline focus-visible:ring-2 focus-visible:ring-[color:rgba(255,45,141,0.4)] [html[data-theme='dark']_&]:text-zinc-200 [html[data-theme='light']_&]:text-zinc-600 ${
                  mode === "pill" ? "right-1.5" : mode === "compact" ? "right-1.5" : "right-3"
                }`
          }
          aria-label="검색 실행"
        >
          <span className={mode === "homeHero" ? "block" : `block ${searchIconMotion}`}>
            <Search
              className={`shrink-0 ${mode === "homeHero" ? "h-[1.125rem] w-[1.125rem]" : mode === "pill" ? "h-6 w-6" : mode === "compact" ? "h-4 w-4" : "h-5 w-5"}`}
              strokeWidth={mode === "homeHero" ? 2.25 : 2}
              aria-hidden
            />
          </span>
        </button>
      ) : null}
    </form>
  );
}
