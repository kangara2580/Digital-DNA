import type { Metadata } from "next";
import { translate } from "@/lib/i18n/dictionaries";
import { getSiteLocale } from "@/lib/i18n/serverLocale";

/** `title` / `description` from dictionary keys using the request locale cookie. */
export async function buildPageMetadata(keys: {
  titleKey: string;
  descriptionKey?: string;
  titleVars?: Record<string, string | number>;
  descriptionVars?: Record<string, string | number>;
}): Promise<Metadata> {
  const locale = await getSiteLocale();
  const meta: Metadata = {
    title: translate(locale, keys.titleKey, keys.titleVars),
  };
  if (keys.descriptionKey) {
    meta.description = translate(locale, keys.descriptionKey, keys.descriptionVars);
  }
  return meta;
}
