"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  SEARCH_GUIDE_PHRASES,
  shuffleSearchGuides,
} from "@/data/searchGuidePhrases";

const easeLayout =
  "duration-300 ease-out motion-reduce:duration-150 motion-reduce:ease-linear";

const searchEase =
  "duration-300 ease-out motion-reduce:duration-150 motion-reduce:ease-linear";

/** 호버·포커스: 브랜드 핑크(Pink Glo 계열 — --reels-point) */
const searchIconMotion =
  "transition-colors duration-200 ease-out group-hover:text-[color:var(--reels-point)] group-focus-within:text-[color:var(--reels-point)]";

const ROTATE_MS = 4500;

export function ReelsSearchField({
  compact,
  topNavPill = false,
  q,
  setQ,
  showTrailingIcon = true,
  onAfterSearch,
}: {
  compact: boolean;
  /** 메인 상단: MainTopUserMenu 캡슐(h-11)과 높이·질감 맞춤 */
  topNavPill?: boolean;
  q: string;
  setQ: (v: string) => void;
  showTrailingIcon?: boolean;
  onAfterSearch?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [phrases, setPhrases] = useState<string[]>(() => [
    ...SEARCH_GUIDE_PHRASES,
  ]);
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [focused, setFocused] = useState(false);

  const runSearch = useCallback(() => {
    const t = q.trim();
    if (!t) return;
    router.push(`/search?q=${encodeURIComponent(t)}`);
    onAfterSearch?.();
  }, [q, router, onAfterSearch]);

  useEffect(() => {
    setPhrases(shuffleSearchGuides([...SEARCH_GUIDE_PHRASES]));
    setPhraseIdx(0);
  }, [pathname]);

  useEffect(() => {
    if (phrases.length === 0) return;
    const id = window.setInterval(() => {
      setPhraseIdx((i) => (i + 1) % phrases.length);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [phrases]);

  const showGuide = q.trim() === "" && !focused;
  const current = phrases[phraseIdx] ?? phrases[0] ?? "";

  const pinkBorder =
    "hover:border-[color:rgba(255,45,141,0.42)] focus:border-[color:rgba(255,45,141,0.55)] [html[data-theme='light']_&]:hover:border-[color:rgba(255,45,141,0.38)] [html[data-theme='light']_&]:focus:border-[color:rgba(255,45,141,0.48)]";

  const mode = topNavPill ? "pill" : compact ? "compact" : "default";

  const inputClassByMode =
    mode === "pill"
      ? `h-11 min-h-[2.75rem] rounded-full border border-white/40 bg-black/20 pl-3.5 ${showTrailingIcon ? "pr-11" : "pr-3.5"} text-[13px] text-zinc-100 shadow-[0_0_0_1px_rgba(255,255,255,0.05)] backdrop-blur-md hover:border-white/52 hover:bg-black/28 focus:bg-black/28 ${pinkBorder} [html[data-theme='dark']_&]:text-zinc-50 [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:bg-white/[0.6] [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:shadow-[0_0_0_1px_rgba(0,0,0,0.05)] [html[data-theme='light']_&]:hover:border-zinc-400 [html[data-theme='light']_&]:hover:bg-white/[0.72] [html[data-theme='light']_&]:focus:bg-white/[0.72]`
      : mode === "compact"
        ? `h-9 border-white/15 bg-white/[0.06] pl-3 ${showTrailingIcon ? "pr-10" : "pr-3"} text-[13px] ${pinkBorder} hover:bg-white/10 focus:bg-white/[0.09] [html[data-theme='dark']_&]:border-white/20 [html[data-theme='dark']_&]:bg-white/[0.1] [html[data-theme='dark']_&]:hover:bg-white/[0.14] [html[data-theme='dark']_&]:focus:bg-white/[0.16] [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50 [html[data-theme='light']_&]:hover:bg-white [html[data-theme='light']_&]:focus:bg-white`
        : `h-[3.25rem] border-2 border-white/20 bg-white/[0.08] pl-6 ${showTrailingIcon ? "pr-14" : "pr-6"} text-[15px] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] ${pinkBorder} hover:bg-white/12 focus:bg-white/[0.1] [html[data-theme='dark']_&]:border-white/25 [html[data-theme='dark']_&]:bg-white/[0.12] [html[data-theme='dark']_&]:hover:bg-white/[0.16] [html[data-theme='dark']_&]:focus:bg-white/[0.18] [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:shadow-[inset_0_2px_4px_rgba(0,0,0,0.04)] [html[data-theme='light']_&]:hover:bg-zinc-50 [html[data-theme='light']_&]:focus:bg-white`;

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
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder=""
        autoComplete="off"
        enterKeyHint="search"
        className={`mall-search w-full rounded-full border text-zinc-100 outline-none ring-0 transition-[height,padding,font-size,background-color,border-color,color] ${easeLayout} ${searchEase} placeholder:text-zinc-600 focus:ring-0 [html[data-theme='dark']_&]:placeholder:text-zinc-300 [html[data-theme='light']_&]:placeholder:text-zinc-500 ${inputClassByMode}`}
        aria-label={`릴스 검색. 안내: ${current}`}
      />
      {showGuide ? (
        <div
          className={`pointer-events-none absolute inset-y-0 left-0 flex items-center overflow-hidden text-left text-zinc-500 [html[data-theme='dark']_&]:text-zinc-300 [html[data-theme='light']_&]:text-zinc-500 ${
            mode === "pill"
              ? `${showTrailingIcon ? "right-11" : "right-3.5"} pl-3.5 text-[13px]`
              : mode === "compact"
                ? `${showTrailingIcon ? "right-10" : "right-3"} pl-3 text-[13px]`
                : `${showTrailingIcon ? "right-14" : "right-6"} pl-6 text-[15px]`
          }`}
          aria-hidden
        >
          <div className="relative w-full min-w-0">
            <div
              className={`overflow-hidden ${mode === "pill" || mode === "compact" ? "h-[18px]" : "h-[24px]"}`}
            >
              <span className="block truncate transition-opacity duration-200">
                {current}
              </span>
            </div>
          </div>
        </div>
      ) : null}
      {showTrailingIcon ? (
        <button
          type="submit"
          className={`absolute top-1/2 z-10 -translate-y-1/2 rounded-full p-1 text-zinc-500 transition-colors hover:text-[color:var(--reels-point)] focus-visible:outline focus-visible:ring-2 focus-visible:ring-[color:rgba(255,45,141,0.4)] [html[data-theme='dark']_&]:text-zinc-200 [html[data-theme='light']_&]:text-zinc-600 ${
            mode === "pill" ? "right-1.5" : mode === "compact" ? "right-1.5" : "right-3"
          }`}
          aria-label="검색 실행"
        >
          <span className={`block ${searchIconMotion}`}>
            <Search
              className={`shrink-0 ${mode === "pill" ? "h-6 w-6" : mode === "compact" ? "h-4 w-4" : "h-5 w-5"}`}
              strokeWidth={2}
              aria-hidden
            />
          </span>
        </button>
      ) : null}
    </form>
  );
}
