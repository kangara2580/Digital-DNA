"use client";

import { useMemo, useSyncExternalStore } from "react";
import { araCutePixelSvgDataUrl, type PixelAvatarPalette } from "@/lib/pixelAvatarSprite";

type Props = {
  entropy: string;
  variant: number;
  palette: PixelAvatarPalette;
  className?: string;
  alt?: string;
};

function subscribeHtmlTheme(cb: () => void): () => void {
  if (typeof document === "undefined") return () => {};
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => obs.disconnect();
}

function snapshotHtmlTheme(): "light" | "dark" {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

/** ARA 오리지널 프로시저럴 도트 프로필 (SVG · 테마 연동) */
export function ProfileAvatarSprite({ entropy, variant, palette, className = "", alt = "" }: Props) {
  const appTheme = useSyncExternalStore(subscribeHtmlTheme, snapshotHtmlTheme, () => "dark" as const);

  const src = useMemo(
    () => araCutePixelSvgDataUrl(entropy, variant, palette, appTheme),
    [entropy, variant, palette, appTheme],
  );

  return (
    // eslint-disable-next-line @next/next/no-img-element -- inline SVG data URL
    <img
      role="img"
      aria-label={alt || undefined}
      alt={alt || ""}
      src={src}
      className={`h-full w-full object-contain [image-rendering:pixelated] ${className}`}
      style={{ imageRendering: "pixelated" }}
    />
  );
}
