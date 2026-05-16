import Image from "next/image";
import Link from "next/link";
import type { FeedVideo } from "@/data/videos";
import {
  sellerAvatarUrlFromVideo,
  sellerDisplayNameFromVideo,
  sellerProfileHrefFromVideo,
} from "@/lib/sellerProfile";

type Props = {
  video: Pick<FeedVideo, "creator" | "listing">;
  /** sm: 쇼핑몰·그리드 카드 제목 앞 */
  size?: "sm" | "md";
  className?: string;
};

/** 판매자 피드 링크 — 원형 프로필만 (이름 없음) */
export function SellerProfileAvatarLink({
  video,
  size = "sm",
  className = "",
}: Props) {
  const href = sellerProfileHrefFromVideo(video);
  const name = sellerDisplayNameFromVideo(video);
  const dim = size === "sm" ? "h-6 w-6" : "h-8 w-8";

  return (
    <Link
      href={href}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      aria-label={`${name} 판매자 피드`}
      className={`relative z-[9] shrink-0 overflow-hidden rounded-full ring-1 ring-white/25 transition-[ring-color,transform] hover:ring-[color:var(--reels-point)] active:scale-[0.96] [html[data-theme='light']_&]:ring-zinc-200 [html[data-theme='light']_&]:hover:ring-[color:var(--reels-point)] ${dim} ${className}`}
    >
      <Image
        src={sellerAvatarUrlFromVideo(video)}
        alt=""
        width={size === "sm" ? 24 : 32}
        height={size === "sm" ? 24 : 32}
        unoptimized
        className="h-full w-full object-cover"
      />
    </Link>
  );
}
