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
      ? "border-white/55 bg-white/12 text-white shadow-[0_2px_12px_rgba(0,0,0,0.2)] backdrop-blur-sm hover:border-white/75 hover:bg-white/22"
      : "border border-white/15 bg-white/[0.06] text-zinc-100 shadow-none backdrop-blur-md hover:border-reels-cyan/45 hover:bg-white/10 hover:text-white";

  const widthCls =
    variant === "light"
      ? "w-auto"
      : "w-full sm:w-auto";

  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-1 rounded-full border px-4 py-2.5 text-[13px] font-semibold leading-none tracking-tight transition-colors sm:px-4 sm:py-2 sm:text-[13px] ${widthCls} ${styles} ${className}`}
      aria-label={`${catName} 카테고리에서 더 많은 영상 보기`}
    >
      <span className="whitespace-nowrap">{text}</span>
      {showChevron ? (
        <Chevron className="h-4 w-4 shrink-0 opacity-90" />
      ) : null}
    </Link>
  );
}
