import Image from "next/image";
import { araWordmarkFontStyle } from "@/lib/araBrandTypography";

export const ARA_OG_LOGO_SRC = "/brand/ara-brand-mark.png";

type Props = {
  className?: string;
};

/**
 * OG 기본 이미지 — 흰 배경 · Fredoka ARA(검정) · 홈 로고 · 정중앙 정렬.
 */
export function OgDefaultArtwork({ className = "" }: Props) {
  const logoSize = 104;

  return (
    <div
      className={`relative aspect-[1200/630] w-full overflow-hidden bg-white ${className}`}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex items-center justify-center gap-3 px-8">
          <Image
            src={ARA_OG_LOGO_SRC}
            alt=""
            width={logoSize}
            height={logoSize}
            className="block shrink-0 object-contain"
            style={{ width: logoSize, height: logoSize }}
            unoptimized
          />
          <span
            className="block shrink-0 pr-1 text-[clamp(3rem,8vw,6.5rem)] font-semibold leading-none tracking-[0.02em] text-zinc-950"
            style={araWordmarkFontStyle}
          >
            ARA
          </span>
        </div>
      </div>
    </div>
  );
}
