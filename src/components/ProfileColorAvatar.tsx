import {
  profileColorFromSeed,
  profileInitialTextClass,
} from "@/lib/profileColorSpectrum";

type Props = {
  hex: string;
  /** 접근성·이니셜 표시용 */
  label?: string;
  initial?: string;
  className?: string;
  /** Tailwind 크기 클래스 (예: h-8 w-8) */
  sizeClass?: string;
};

function initialFontClass(sizeClass: string): string {
  if (sizeClass.includes("h-6")) return "text-[11px]";
  if (sizeClass.includes("h-7")) return "text-[12px]";
  if (sizeClass.includes("h-12") || sizeClass.includes("w-12")) return "text-[17px]";
  if (sizeClass.includes("h-[4")) return "text-[22px]";
  return "text-[15px]";
}

export function ProfileColorAvatar({
  hex,
  label,
  initial,
  className = "",
  sizeClass = "h-10 w-10",
}: Props) {
  const letter = initial?.trim().slice(0, 1).toUpperCase();
  const textClass = profileInitialTextClass(hex);

  return (
    <div
      role={label ? "img" : undefined}
      aria-label={label}
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full ${sizeClass} ${className}`}
      style={{ backgroundColor: hex }}
    >
      {letter ? (
        <span
          className={`select-none font-bold leading-none ${textClass} ${initialFontClass(sizeClass)}`}
          aria-hidden={Boolean(label)}
        >
          {letter}
        </span>
      ) : null}
    </div>
  );
}

/** 시드만 있을 때(판매자·리뷰 폴백) */
export function ProfileColorAvatarFromSeed({
  seed,
  label,
  initial,
  className = "",
  sizeClass = "h-10 w-10",
}: {
  seed: string;
  label?: string;
  initial?: string;
  className?: string;
  sizeClass?: string;
}) {
  const hex = profileColorFromSeed(seed);
  return (
    <ProfileColorAvatar
      hex={hex}
      label={label}
      initial={initial}
      className={className}
      sizeClass={sizeClass}
    />
  );
}
