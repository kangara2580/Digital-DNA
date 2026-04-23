import Image from "next/image";
import Link from "next/link";
import {
  getSellerNickname,
  normalizeSellerHandle,
} from "@/data/videoCatalog";
import { buildNotionistsAvatarUrl } from "@/data/reelsAvatarPresets";

type Props = {
  creator: string;
  sellerId?: string;
  className?: string;
  size?: "default" | "compact";
};

/** 상세 상단 판매자 카드: 프로필 + 닉네임 + 판매자 페이지 링크 */
export function SellerIdentityLink({
  creator,
  sellerId,
  className = "",
  size = "default",
}: Props) {
  const nickname = getSellerNickname(creator);
  const handle = sellerId?.trim() || normalizeSellerHandle(creator);
  const compact = size === "compact";

  return (
    <Link
      href={`/seller/${encodeURIComponent(handle)}`}
      aria-label={`${nickname} 판매자 페이지로 이동`}
      className={`group inline-flex items-center rounded-xl border border-white/10 bg-white/[0.04] transition-colors hover:border-reels-cyan/35 hover:bg-white/[0.07] [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-100/85 [html[data-theme='light']_&]:hover:border-reels-cyan/40 ${
        compact ? "gap-2 px-2.5 py-1.5" : "gap-3 px-3 py-2.5"
      } ${className}`}
    >
      <Image
        src={buildNotionistsAvatarUrl(nickname)}
        width={compact ? 28 : 40}
        height={compact ? 28 : 40}
        alt=""
        unoptimized
        className={`shrink-0 rounded-full object-cover ring-2 ring-white/10 [html[data-theme='light']_&]:ring-zinc-200 ${
          compact ? "h-7 w-7" : "h-10 w-10"
        }`}
      />
      <span className="min-w-0">
        <span
          className={`block truncate font-semibold leading-tight text-zinc-100 [html[data-theme='light']_&]:text-zinc-900 ${
            compact ? "text-[13px]" : "text-[14px]"
          }`}
        >
          {nickname}
        </span>
      </span>
    </Link>
  );
}
