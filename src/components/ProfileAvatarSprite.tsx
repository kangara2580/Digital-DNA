"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { PixelAvatarPalette } from "@/lib/pixelAvatarSprite";

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

function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function doodleAvatarDataUrl(
  entropy: string,
  variant: number,
  palette: PixelAvatarPalette,
  theme: "light" | "dark",
): string {
  const h = hashSeed(`${entropy}:${variant}`);
  const face = variant % 5;
  const hair = (variant + 2) % 6;
  const eye = (h % 3) + 1;
  const mouth = (Math.floor(h / 7) % 3) + 1;
  const blush = (h & 1) === 0;
  const bg = theme === "light" ? "#f9f9fb" : palette === "mochi" ? "#1b1b20" : "#171b24";
  const ink = theme === "light" ? "#111111" : "#f2f2f2";
  const skin = theme === "light" ? "#ffffff" : "#111317";

  const facePath = [
    "M44 34c13 0 22 10 22 24s-9 24-22 24-22-10-22-24 9-24 22-24z", // round
    "M44 31c11 0 18 9 18 24s-7 27-18 27-18-12-18-27 7-24 18-24z", // long
    "M31 36h26c6 0 11 5 11 11v21c0 6-5 11-11 11H31c-6 0-11-5-11-11V47c0-6 5-11 11-11z", // square
    "M44 33c15 0 24 10 24 22 0 16-9 29-24 29S20 71 20 55c0-12 9-22 24-22z", // wide
    "M44 30c9 0 17 6 20 15 5 14-3 38-20 38S19 59 24 45c3-9 11-15 20-15z", // pear
  ][face];

  const hairPath = [
    "M22 45c2-14 13-24 22-24s20 10 22 24c-5-5-11-8-22-8s-17 3-22 8z",
    "M18 53c0-20 12-32 26-32s26 12 26 32c-6-8-15-12-26-12S24 45 18 53z",
    "M22 46c2-12 11-20 22-20s20 8 22 20c-2-2-6-4-9-4s-5 2-8 3c-2 1-3 1-5 1s-3 0-5-1c-3-1-5-3-8-3s-7 2-9 4z",
    "M20 50c0-17 11-28 24-28s24 11 24 28c-6-5-12-7-24-7s-18 2-24 7z",
    "M18 55c3-16 13-26 26-26s23 10 26 26c-5-6-14-9-26-9s-21 3-26 9z",
    "M21 47c5-11 13-17 23-17s18 6 23 17c-6-3-13-5-23-5s-17 2-23 5z",
  ][hair];

  const eyeShape =
    eye === 1
      ? '<circle cx="36" cy="57" r="1.8"/><circle cx="52" cy="57" r="1.8"/>'
      : eye === 2
        ? '<path d="M33 57h6M49 57h6" stroke-width="2" stroke-linecap="round"/>'
        : '<path d="M34 56c1 2 3 2 4 0M50 56c1 2 3 2 4 0" stroke-width="2" stroke-linecap="round" fill="none"/>';

  const mouthShape =
    mouth === 1
      ? '<path d="M40 67c2 2 6 2 8 0" stroke-width="2" stroke-linecap="round" fill="none"/>'
      : mouth === 2
        ? '<circle cx="44" cy="68" r="1.8"/>'
        : '<path d="M39 68h10" stroke-width="2" stroke-linecap="round"/>';

  const blushShape = blush
    ? '<circle cx="30" cy="65" r="2.1" fill-opacity="0.15"/><circle cx="58" cy="65" r="2.1" fill-opacity="0.15"/>'
    : "";

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 88 88" width="88" height="88">
    <rect width="88" height="88" fill="${bg}"/>
    <path d="${hairPath}" fill="${ink}" opacity="0.95"/>
    <path d="${facePath}" fill="${skin}" stroke="${ink}" stroke-width="2.6" stroke-linejoin="round"/>
    <g stroke="${ink}" fill="${ink}">
      ${eyeShape}
      ${mouthShape}
      ${blushShape}
      <path d="M44 59v5" stroke-width="1.8" stroke-linecap="round" fill="none"/>
    </g>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** ARA 오리지널 프로시저럴 도트 프로필 (SVG · 테마 연동) */
export function ProfileAvatarSprite({ entropy, variant, palette, className = "", alt = "" }: Props) {
  const appTheme = useSyncExternalStore(subscribeHtmlTheme, snapshotHtmlTheme, () => "dark" as const);

  const src = useMemo(
    () => doodleAvatarDataUrl(entropy, variant, palette, appTheme),
    [entropy, variant, palette, appTheme],
  );

  return (
    // eslint-disable-next-line @next/next/no-img-element -- inline SVG data URL
    <img
      role="img"
      aria-label={alt || undefined}
      alt={alt || ""}
      src={src}
      className={`h-full w-full object-contain ${className}`}
    />
  );
}
