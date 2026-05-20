"use client";

import { SellerSocialPlatformIcon } from "@/components/SellerSocialPlatformIcon";
import { useTranslation } from "@/hooks/useTranslation";
import type { SellerSocialLink, SellerSocialPlatform } from "@/lib/sellerSocialLinks";

const SIZE_CLASS = {
  xs: {
    btn: "h-5 w-5",
    icon: "h-3 w-3",
  },
  sm: {
    btn: "h-7 w-7",
    icon: "h-3.5 w-3.5",
  },
  md: {
    btn: "h-8 w-8",
    icon: "h-4 w-4",
  },
} as const;

function platformLabel(platform: SellerSocialPlatform): string {
  switch (platform) {
    case "tiktok":
      return "TikTok";
    case "instagram":
      return "Instagram";
    case "youtube":
      return "YouTube";
    case "twitter":
      return "X";
    default:
      return "Website";
  }
}

type Props = {
  links: SellerSocialLink[];
  max?: number;
  size?: keyof typeof SIZE_CLASS;
  stopPropagation?: boolean;
  className?: string;
};

export function SellerSocialLinkIcons({
  links,
  max = 4,
  size = "md",
  stopPropagation = false,
  className = "",
}: Props) {
  const { t } = useTranslation();
  const visible = links.slice(0, max);
  if (visible.length === 0) return null;

  const { btn, icon } = SIZE_CLASS[size];

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {visible.map((link) => (
        <a
          key={`${link.platform}-${link.url}`}
          href={link.url}
          target="_blank"
          rel="noreferrer noopener"
          onClick={stopPropagation ? (e) => e.stopPropagation() : undefined}
          className={`relative z-[9] inline-flex ${btn} items-center justify-center rounded-full border border-white/20 bg-white/[0.06] text-zinc-300 transition hover:border-[color:var(--reels-point)]/45 hover:text-[color:var(--reels-point)] [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-700 [html[data-theme='light']_&]:hover:border-[color:var(--reels-point)]/40`}
          aria-label={t("video.detail.openPlatformLink", {
            platform: platformLabel(link.platform),
          })}
          title={link.url}
        >
          <SellerSocialPlatformIcon platform={link.platform} className={icon} />
        </a>
      ))}
    </div>
  );
}
