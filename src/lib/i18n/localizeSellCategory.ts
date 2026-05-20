import { translate } from "@/lib/i18n/dictionaries";
import type { SiteLocale } from "@/lib/sitePreferences";

export function getSellVideoCategoryLabelLocalized(
  locale: SiteLocale,
  value: string | undefined,
): string {
  if (!value?.trim()) return translate(locale, "nav.cat.unassigned");
  const key = `nav.cat.${value.trim()}`;
  const label = translate(locale, key);
  if (label === key) return translate(locale, "nav.cat.unassigned");
  return label;
}
