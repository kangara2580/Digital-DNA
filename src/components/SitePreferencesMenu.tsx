"use client";

import { Moon, Sun } from "lucide-react";
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
            ? "bg-reels-cyan/25 text-reels-cyan"
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
            ? "bg-reels-cyan/25 text-reels-cyan"
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

  if (layout === "stack") {
    return (
      <div className={`flex flex-col gap-4 ${className ?? ""}`}>
        <div>
          <p className="mb-2 px-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
            언어
          </p>
          {localeGroup}
        </div>
        <div>
          <p className="mb-2 px-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
            화면 테마
          </p>
          {themeBtn}
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
