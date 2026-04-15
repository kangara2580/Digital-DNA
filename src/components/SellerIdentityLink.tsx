import Link from "next/link";
import {
  getSellerNickname,
  normalizeSellerHandle,
} from "@/data/videoCatalog";

function sellerAvatarGradient(seed: string): string {
  const hash = Array.from(seed).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const hueA = hash % 360;
  const hueB = (hueA + 48) % 360;
  return `linear-gradient(135deg, hsl(${hueA} 72% 54%), hsl(${hueB} 74% 45%))`;
}

function sellerInitials(nickname: string): string {
  const clean = nickname.replace(/[^A-Za-z0-9가-힣]/g, "");
  if (!clean) return "S";
  return clean.slice(0, 2).toUpperCase();
}

type Props = {
  creator: string;
  className?: string;
};

/** 상세 상단 판매자 카드: 프로필 + 닉네임 + 판매자 페이지 링크 */
export function SellerIdentityLink({ creator, className = "" }: Props) {
  const nickname = getSellerNickname(creator);
  const handle = normalizeSellerHandle(creator);
  const initials = sellerInitials(nickname);

  return (
    <Link
      href={`/seller/${handle}`}
      aria-label={`${nickname} 판매자 페이지로 이동`}
      className={`group mt-2 inline-flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 transition-colors hover:border-reels-cyan/35 hover:bg-white/[0.07] [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-100/85 [html[data-theme='light']_&]:hover:border-reels-cyan/40 ${className}`}
    >
      <span
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 text-xs font-extrabold tracking-wide text-white shadow-[0_0_18px_-6px_rgba(0,0,0,0.65)]"
        style={{ backgroundImage: sellerAvatarGradient(handle) }}
        aria-hidden
      >
        {initials}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[14px] font-semibold leading-tight text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
          {nickname}
        </span>
        <span className="block truncate text-[11px] font-medium leading-tight text-zinc-500 transition-colors group-hover:text-reels-cyan/90 [html[data-theme='light']_&]:text-zinc-600 [html[data-theme='light']_&]:group-hover:text-reels-cyan">
          판매자 프로필 보기
        </span>
      </span>
    </Link>
  );
}
