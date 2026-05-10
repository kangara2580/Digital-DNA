"use client";

import { ChevronDown, Moon, Sun } from "lucide-react";
import type { SiteLocale } from "@/lib/sitePreferences";
import { useSitePreferences } from "@/context/SitePreferencesContext";

const iconStroke = 1.25;

const navActionClass =
  "inline-flex items-center justify-center rounded-full bg-transparent px-2.5 py-1.5 text-zinc-300 transition-[color,transform] duration-200 ease-out hover:text-white active:scale-[0.98] motion-reduce:duration-150 [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:hover:bg-zinc-100 [html[data-theme='light']_&]:hover:text-black";

const localeSegClass =
  "min-w-[2rem] rounded-full px-2 py-1 text-[11px] font-bold uppercase tracking-wide transition-colors";

type Props = {
  className?: string;
  /** 상단 네비: 가로 / 왼쪽 패널 더보기: 세로 */
  layout?: "row" | "stack";
};

export function SitePreferencesMenu({
  className,
  layout = "row",
}: Props) {
  const { themeMode, toggleTheme, locale, setLocale } = useSitePreferences();

  const localeGroup = (
    <div
      role="group"
      aria-label="언어 선택"
      className="flex items-center rounded-full border border-white/10 bg-black/20 p-0.5 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-100/80"
    >
      <button
        type="button"
        onClick={() => setLocale("ko")}
        className={`${localeSegClass} ${
          locale === "ko"
            ? "bg-reels-crimson/18 text-reels-crimson [html[data-theme='light']_&]:bg-reels-crimson/12"
            : "text-zinc-500 hover:text-zinc-300 [html[data-theme='light']_&]:text-zinc-600 [html[data-theme='light']_&]:hover:text-zinc-900"
        }`}
        aria-pressed={locale === "ko"}
        title="한국어"
      >
        ko
      </button>
      <button
        type="button"
        onClick={() => setLocale("en")}
        className={`${localeSegClass} ${
          locale === "en"
            ? "bg-reels-crimson/18 text-reels-crimson [html[data-theme='light']_&]:bg-reels-crimson/12"
            : "text-zinc-500 hover:text-zinc-300 [html[data-theme='light']_&]:text-zinc-600 [html[data-theme='light']_&]:hover:text-zinc-900"
        }`}
        aria-pressed={locale === "en"}
        title="English"
      >
        en
      </button>
    </div>
  );

  const themeBtn = (
    <div role="group" aria-label="화면 테마" className="flex items-center">
      <button
        type="button"
        onClick={toggleTheme}
        className={navActionClass}
        aria-label={
          themeMode === "dark" ? "화이트 테마로 전환" : "다크 테마로 전환"
        }
        title={themeMode === "dark" ? "화이트 버전" : "다크 버전"}
      >
        {themeMode === "dark" ? (
          <Sun className="h-[19px] w-[19px]" strokeWidth={iconStroke} />
        ) : (
          <Moon className="h-[19px] w-[19px]" strokeWidth={iconStroke} />
        )}
      </button>
    </div>
  );

  const stackLocaleSelect = (
    <div className="relative">
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as SiteLocale)}
        aria-label="언어 선택"
        className="w-full cursor-pointer appearance-none rounded-xl border border-white/15 bg-zinc-950/90 py-2.5 pl-3 pr-10 text-[14px] font-semibold text-zinc-100 caret-reels-crimson outline-none transition-[border-color,box-shadow] hover:border-white/25 focus:border-reels-crimson/45 focus:ring-2 focus:ring-reels-crimson/28 [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-900 [html[data-theme='light']_&]:hover:border-zinc-400"
      >
        <option value="ko">한국어 (KO)</option>
        <option value="en">English (EN)</option>
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 [html[data-theme='light']_&]:text-zinc-600"
        strokeWidth={2}
        aria-hidden
      />
    </div>
  );

  /** iOS 스타일 흑백 스위치 — 썸 왼쪽: 라이트, 오른쪽: 다크 */
  const stackThemeToggle = (
    <button
      type="button"
      role="switch"
      aria-checked={themeMode === "dark"}
      aria-label={themeMode === "dark" ? "라이트 테마로 전환" : "다크 테마로 전환"}
      onClick={toggleTheme}
      className={`relative h-[30px] w-[51px] shrink-0 rounded-full border p-[3px] transition-[background-color,border-color] duration-200 ease-out ${
        themeMode === "dark"
          ? "border-zinc-500/70 bg-zinc-800 [html[data-theme='light']_&]:border-zinc-400 [html[data-theme='light']_&]:bg-zinc-400"
          : "border-zinc-600/80 bg-zinc-700 [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:bg-zinc-200"
      }`}
    >
      <span
        className={`pointer-events-none absolute left-[3px] top-[3px] block h-[23px] w-[23px] rounded-full border border-black/10 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.9)] transition-transform duration-200 ease-out motion-reduce:transition-none ${
          themeMode === "dark" ? "translate-x-[22px]" : "translate-x-0"
        }`}
      />
    </button>
  );

  if (layout === "stack") {
    return (
      <div className={`flex flex-col gap-4 ${className ?? ""}`}>
        <div>
          <p className="mb-2 px-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
            언어
          </p>
          {stackLocaleSelect}
        </div>
        <div className="flex flex-col gap-2">
          <p className="px-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
            화면 테마
          </p>
          <div className="flex items-center gap-3">
            {stackThemeToggle}
            <span className="text-[13px] font-medium text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
              {themeMode === "dark" ? "다크" : "라이트"}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center gap-1 sm:gap-1.5 ${className ?? ""}`}
    >
      {localeGroup}
      {themeBtn}
    </div>
  );
}
