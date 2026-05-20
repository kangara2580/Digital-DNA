import type { NoticeItem } from "@/data/notices";
import type { SiteLocale } from "@/lib/sitePreferences";

export type LocalizedNotice = NoticeItem & {
  titleEn?: string;
  bodyEn?: string;
};

export function localizeNotice(
  notice: LocalizedNotice,
  locale: SiteLocale,
): { title: string; body: string } {
  if (locale === "en" && notice.titleEn && notice.bodyEn) {
    return { title: notice.titleEn, body: notice.bodyEn };
  }
  return { title: notice.title, body: notice.body };
}
