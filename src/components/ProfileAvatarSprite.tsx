"use client";

import { getPixelSpriteLayers, type PixelAvatarPalette } from "@/lib/pixelAvatarSprite";

type Props = {
  palette: PixelAvatarPalette;
  variant: number;
  className?: string;
  alt?: string;
};

/**
 * 4×4 시트에서 한 칸을 잘라 도트풍 프로필로 표시합니다. (`image-rendering: pixelated`)
 */
export function ProfileAvatarSprite({ palette, variant, className = "", alt = "" }: Props) {
  const { src, bgW, bgH, posX, posY } = getPixelSpriteLayers(palette, variant);

  return (
    <div
      role="img"
      aria-label={alt || undefined}
      className={`relative overflow-hidden [image-rendering:pixelated] ${className}`}
      style={{ imageRendering: "pixelated" as const }}
    >
      <span
        className="pointer-events-none absolute inset-0 block bg-no-repeat"
        style={{
          backgroundImage: `url("${src}")`,
          backgroundPosition: `${posX}px ${posY}px`,
          backgroundSize: `${bgW}px ${bgH}px`,
          imageRendering: "pixelated",
        }}
      />
    </div>
  );
}
