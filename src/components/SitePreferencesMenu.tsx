"use client";

import { Moon, Sun } from "lucide-react";
import { useMemo } from "react";
import type { SiteLocale } from "@/lib/sitePreferences";
import { useSitePreferences } from "@/context/SitePreferencesContext";
import { useTranslation } from "@/hooks/useTranslation";
import { MyPageSortSelect } from "@/components/MyPageSortSelect";
import { ThemeModeToggleSwitch } from "@/components/ThemeModeToggleSwitch";

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
  const { t } = useTranslation();
  const { themeMode, toggleTheme, locale, setLocale } = useSitePreferences();

  const localeGroup = (
    <div
      role="group"
      aria-label={t("settings.language.selectAria")}
      className="flex items-center rounded-full border border-white/10 bg-black/20 p-0.5 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-100/80"
    >
      <button
        type="button"
        onClick={() => setLocale("ko")}
        className={`${localeSegClass} ${
          locale === "ko"
            ? "bg-[color:var(--reels-point)]/18 text-[color:var(--reels-point)] [html[data-theme='light']_&]:bg-[color:var(--reels-point)]/12"
            : "text-zinc-500 hover:text-zinc-300 [html[data-theme='light']_&]:text-zinc-600 [html[data-theme='light']_&]:hover:text-zinc-900"
        }`}
        aria-pressed={locale === "ko"}
        title={t("locale.option.ko")}
      >
        ko
      </button>
      <button
        type="button"
        onClick={() => setLocale("en")}
        className={`${localeSegClass} ${
          locale === "en"
            ? "bg-[color:var(--reels-point)]/18 text-[color:var(--reels-point)] [html[data-theme='light']_&]:bg-[color:var(--reels-point)]/12"
            : "text-zinc-500 hover:text-zinc-300 [html[data-theme='light']_&]:text-zinc-600 [html[data-theme='light']_&]:hover:text-zinc-900"
        }`}
        aria-pressed={locale === "en"}
        title={t("locale.option.en")}
      >
        en
      </button>
    </div>
  );

  const themeBtn = (
    <div role="group" aria-label={t("settings.theme.groupAria")} className="flex items-center">
      <button
        type="button"
        onClick={toggleTheme}
        className={navActionClass}
        aria-label={
          themeMode === "dark"
            ? t("settings.theme.switchToLight")
            : t("settings.theme.switchToDark")
        }
        title={
          themeMode === "dark" ? t("settings.theme.light") : t("settings.theme.dark")
        }
      >
        {themeMode === "dark" ? (
          <Sun className="h-[19px] w-[19px]" strokeWidth={iconStroke} />
        ) : (
          <Moon className="h-[19px] w-[19px]" strokeWidth={iconStroke} />
        )}
      </button>
    </div>
  );

  const localeSortOptions = useMemo(
    () => [
      { value: "ko", label: `${t("locale.option.ko")} (KO)` },
      { value: "en", label: `${t("locale.option.en")} (EN)` },
    ],
    [t],
  );

  const stackLocaleSelect = (
    <MyPageSortSelect
      compact
      stretch
      ariaLabel={t("settings.language.selectAria")}
      options={localeSortOptions}
      value={locale}
      onChange={(v) => setLocale(v as SiteLocale)}
    />
  );

  if (layout === "stack") {
    return (
      <div className={`flex flex-col gap-4 ${className ?? ""}`}>
        <div>
          <p className="mb-2 px-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
            {t("prefs.stackSectionLocale")}
          </p>
          {stackLocaleSelect}
        </div>
        <div className="flex flex-col gap-2">
          <p className="px-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
            {t("prefs.stackSectionTheme")}
          </p>
          <ThemeModeToggleSwitch labelClassName="text-[13px] font-medium text-zinc-400 [html[data-theme='light']_&]:text-zinc-600" />
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
