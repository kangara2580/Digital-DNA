"use client";

import { useMemo } from "react";
import { useSitePreferences } from "@/context/SitePreferencesContext";
import { useTranslation } from "@/hooks/useTranslation";
import type { SiteLocale } from "@/lib/sitePreferences";
import { MyPageSortSelect } from "@/components/MyPageSortSelect";

const OPTIONS: { value: SiteLocale; labelKey: string }[] = [
  { value: "ko", labelKey: "locale.option.ko" },
  { value: "en", labelKey: "locale.option.en" },
];

/** 정렬 드롭다운과 동일 스타일 — 표시 언어 선택 */
export function LocalePreferenceSelect({
  ariaLabel,
  className,
}: {
  ariaLabel: string;
  className?: string;
}) {
  const { locale, setLocale } = useSitePreferences();
  const { t } = useTranslation();

  const options = useMemo(
    () => OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) })),
    [t],
  );

  return (
    <div className={className ?? "min-w-[11.5rem] max-w-[20rem]"}>
      <MyPageSortSelect
        options={options}
        value={locale}
        onChange={(next) => setLocale(next as SiteLocale)}
        ariaLabel={ariaLabel}
      />
    </div>
  );
}
