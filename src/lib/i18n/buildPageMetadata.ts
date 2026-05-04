import type { Metadata } from "next";
import { translate } from "@/lib/i18n/dictionaries";
import { getSiteLocale } from "@/lib/i18n/serverLocale";
import { socialMetadataFields } from "@/lib/i18n/socialMetadata";

/** `title` / `description` (+ Open Graph / Twitter) from dictionary keys using request locale. */
export async function buildPageMetadata(keys: {
  titleKey: string;
  descriptionKey?: string;
  titleVars?: Record<string, string | number>;
  descriptionVars?: Record<string, string | number>;
}): Promise<Metadata> {
  const locale = await getSiteLocale();
  const title = translate(locale, keys.titleKey, keys.titleVars);
  const description = keys.descriptionKey
    ? translate(locale, keys.descriptionKey, keys.descriptionVars)
    : undefined;
  const meta: Metadata = {
    title,
    ...(description ? { description } : {}),
    ...socialMetadataFields(locale, title, description),
  };
  return meta;
}
