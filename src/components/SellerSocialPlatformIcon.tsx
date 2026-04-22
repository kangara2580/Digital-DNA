"use client";

import { Link2 } from "lucide-react";
import type { SellerSocialPlatform } from "@/lib/sellerSocialLinks";

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5z"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M12 16a4 4 0 100-8 4 4 0 000 8z"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
    </svg>
  );
}

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M21.6 7.2c.2.8.3 1.7.3 2.6v4.4c0 2.8-.4 4.7-1.2 5.6-.7.8-2 1.2-3.9 1.2H7.2c-1.9 0-3.2-.4-3.9-1.2-.8-.9-1.2-2.8-1.2-5.6V9.8c0-2.8.4-4.7 1.2-5.6.7-.8 2-1.2 3.9-1.2h9.6c1.9 0 3.2.4 3.9 1.2z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path fill="currentColor" d="M10 9.5v5l4.5-2.5L10 9.5z" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

export function SellerSocialPlatformIcon({
  platform,
  className,
}: {
  platform: SellerSocialPlatform;
  className?: string;
}) {
  if (platform === "instagram") return <InstagramIcon className={className} />;
  if (platform === "twitter") return <XIcon className={className} />;
  if (platform === "youtube") return <YoutubeIcon className={className} />;
  if (platform === "tiktok") return <TikTokIcon className={className} />;
  return <Link2 className={className} aria-hidden />;
}

