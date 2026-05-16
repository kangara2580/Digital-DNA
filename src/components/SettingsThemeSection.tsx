"use client";

import { ThemeModeToggleSwitch } from "@/components/ThemeModeToggleSwitch";
import { useTranslation } from "@/hooks/useTranslation";

export function SettingsThemeSection() {
  const { t } = useTranslation();

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-6 shadow-sm sm:p-8 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white">
      <h2 className="text-xl font-semibold tracking-tight text-zinc-50 [html[data-theme='light']_&]:text-zinc-900">
        {t("settings.theme.heading")}
      </h2>
      <div className="mt-6 flex flex-col gap-3">
        <span className="text-[16px] font-medium text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
          {t("settings.theme.fieldLabel")}
        </span>
        <ThemeModeToggleSwitch />
      </div>
    </div>
  );
}
