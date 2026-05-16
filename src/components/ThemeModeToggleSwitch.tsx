"use client";

import { useSitePreferences } from "@/context/SitePreferencesContext";
import { useTranslation } from "@/hooks/useTranslation";

type Props = {
  className?: string;
  /** 라벨 타이포 — 설정 본문 vs 레일 더보기 */
  labelClassName?: string;
};

/**
 * iOS형 테마 스위치 — 썸 왼쪽: 라이트, 오른쪽: 다크
 */
export function ThemeModeToggleSwitch({
  className,
  labelClassName = "text-[16px] font-medium text-zinc-400 [html[data-theme='light']_&]:text-zinc-950",
}: Props) {
  const { t } = useTranslation();
  const { themeMode, toggleTheme } = useSitePreferences();
  const isDark = themeMode === "dark";

  return (
    <div className={`flex items-center gap-3 ${className ?? ""}`}>
      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        aria-label={
          isDark
            ? t("settings.theme.switchToLight")
            : t("settings.theme.switchToDark")
        }
        onClick={toggleTheme}
        className={`relative h-[30px] w-[51px] shrink-0 rounded-full border p-[3px] transition-[background-color,border-color] duration-200 ease-out ${
          isDark
            ? "border-zinc-500/70 bg-zinc-800 [html[data-theme='light']_&]:border-zinc-400 [html[data-theme='light']_&]:bg-zinc-400"
            : "border-zinc-600/80 bg-zinc-700 [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:bg-zinc-200"
        }`}
      >
        <span
          className={`pointer-events-none absolute left-[3px] top-[3px] block h-[23px] w-[23px] rounded-full border border-black/10 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.9)] transition-transform duration-200 ease-out motion-reduce:transition-none ${
            isDark ? "translate-x-[22px]" : "translate-x-0"
          }`}
        />
      </button>
      <span className={labelClassName}>
        {isDark ? t("settings.theme.dark") : t("settings.theme.light")}
      </span>
    </div>
  );
}
