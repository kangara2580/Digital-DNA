import Link from "next/link";
import type { CategorySlug } from "@/data/videoCatalog";
import { CATEGORY_LABEL } from "@/data/videoCatalog";

type Props = {
  category: CategorySlug;
  /** 버튼 표시 문구 — 기본 「더보기」 */
  label?: string;
  /** Highlight24 등 어두운 배너용 */
  variant?: "dark" | "light";
  /** false면 오른쪽 > Chevron 숨김 */
  showChevron?: boolean;
  className?: string;
};

function Chevron({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SectionMoreLink({
  category,
  label = "더보기",
  variant = "dark",
  showChevron = true,
  className = "",
}: Props) {
  const catName = CATEGORY_LABEL[category];
  const text = label;
  const href = `/category/${category}`;

  const styles =
    variant === "light"
      ? "border-white/55 bg-white/12 text-white shadow-[0_8px_24px_-14px_rgba(0,0,0,0.45)] backdrop-blur-sm hover:border-white/80 hover:bg-white/24"
      : "border border-white/14 bg-[linear-gradient(120deg,rgba(255,255,255,0.1)_0%,rgba(255,255,255,0.04)_52%,rgba(0,242,234,0.13)_100%)] text-zinc-100 shadow-[0_14px_32px_-20px_rgba(0,242,234,0.4)] backdrop-blur-md hover:border-[#67EFFF]/60 hover:bg-[linear-gradient(120deg,rgba(255,255,255,0.14)_0%,rgba(255,255,255,0.06)_55%,rgba(0,242,234,0.2)_100%)] hover:text-white";

  const widthCls =
    variant === "light"
      ? "w-auto"
      : "w-full sm:w-auto";

  return (
    <Link
      href={href}
      className={`group inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2 text-[13px] font-semibold leading-none tracking-tight transition-all duration-300 ease-out sm:px-4 sm:py-2 sm:text-[13px] ${widthCls} ${styles} ${className}`}
      aria-label={`${catName} 카테고리에서 더 많은 영상 보기`}
    >
      <span className="whitespace-nowrap">{text}</span>
      {showChevron ? (
        <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/12 text-white/95 transition-transform duration-300 group-hover:translate-x-0.5 [html[data-theme='light']_&]:bg-white/30">
          <Chevron className="h-3.5 w-3.5 shrink-0 opacity-95" />
        </span>
      ) : null}
    </Link>
  );
}
