import type { Metadata } from "next";
import type { SiteLocale } from "@/lib/sitePreferences";

/** Open Graph + Twitter card fields aligned with locale (for SEO / share previews). */
export function socialMetadataFields(
  locale: SiteLocale,
  title: string,
  description?: string,
): Pick<Metadata, "openGraph" | "twitter"> {
  const ogLocale = locale === "en" ? "en_US" : "ko_KR";
  const openGraph: NonNullable<Metadata["openGraph"]> = {
    title,
    locale: ogLocale,
    siteName: "ARA",
    type: "website",
  };
  if (description?.trim()) {
    openGraph.description = description.trim();
  }
  const twitter: NonNullable<Metadata["twitter"]> = {
    card: "summary_large_image",
    title,
  };
  if (description?.trim()) {
    twitter.description = description.trim();
  }
  return { openGraph, twitter };
}
