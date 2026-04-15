import Image from "next/image";
import Link from "next/link";
import {
  getSellerNickname,
  normalizeSellerHandle,
} from "@/data/videoCatalog";
import { buildNotionistsAvatarUrl } from "@/data/reelsAvatarPresets";

type Props = {
  creator: string;
  className?: string;
};

/** 상세 상단 판매자 카드: 프로필 + 닉네임 + 판매자 페이지 링크 */
export function SellerIdentityLink({ creator, className = "" }: Props) {
  const nickname = getSellerNickname(creator);
  const handle = normalizeSellerHandle(creator);

  return (
    <Link
      href={`/seller/${handle}`}
      aria-label={`${nickname} 판매자 페이지로 이동`}
      className={`group mt-2 inline-flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 transition-colors hover:border-reels-cyan/35 hover:bg-white/[0.07] [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-100/85 [html[data-theme='light']_&]:hover:border-reels-cyan/40 ${className}`}
    >
      <Image
        src={buildNotionistsAvatarUrl(nickname)}
        width={40}
        height={40}
        alt=""
        unoptimized
        className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-white/10 [html[data-theme='light']_&]:ring-zinc-200"
      />
      <span className="min-w-0">
        <span className="block truncate text-[14px] font-semibold leading-tight text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
          {nickname}
        </span>
      </span>
    </Link>
  );
}
