"use client";

import { useCallback } from "react";
import { useSitePreferences } from "@/context/SitePreferencesContext";
import type { FeedVideo } from "@/data/videos";
import { videoDisplayTitle } from "@/lib/videoDisplayTitle";
import type { SiteLocale } from "@/lib/sitePreferences";

export function useVideoDisplayTitle() {
  const { locale } = useSitePreferences();
  return useCallback(
    (video: FeedVideo) => videoDisplayTitle(video, locale as SiteLocale),
    [locale],
  );
}
