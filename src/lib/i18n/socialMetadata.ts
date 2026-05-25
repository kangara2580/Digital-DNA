import type { Metadata } from "next";
import type { SiteLocale } from "@/lib/sitePreferences";

/** 기본 OG 이미지 (1200×630). `metadataBase` 기준 절대 URL로 해석됩니다. */
export const OG_DEFAULT_IMAGE_PATH = "/og/ara-og-default.png";

const OG_IMAGE_ALT = "ARA";

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
    images: [
      {
        url: OG_DEFAULT_IMAGE_PATH,
        width: 1200,
        height: 630,
        alt: OG_IMAGE_ALT,
      },
    ],
  };
  if (description?.trim()) {
    openGraph.description = description.trim();
  }
  const twitter: NonNullable<Metadata["twitter"]> = {
    card: "summary_large_image",
    title,
    images: [OG_DEFAULT_IMAGE_PATH],
  };
  if (description?.trim()) {
    twitter.description = description.trim();
  }
  return { openGraph, twitter };
}
