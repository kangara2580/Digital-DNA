import { useId } from "react";

/**
 * ARA — 심플 모노그램 마크
 */
export function ReelsLogo({
  className = "",
  size = 28,
}: {
  className?: string;
  size?: number;
}) {
  const uid = useId().replace(/:/g, "");
  const gradId = `reels-brand-${uid}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient
          id={gradId}
          x1="0"
          y1="0"
          x2="1"
          y2="1"
          gradientUnits="objectBoundingBox"
        >
          <stop offset="0%" stopColor="#FF0055" />
          <stop offset="100%" stopColor="#00F2EA" />
        </linearGradient>
      </defs>
      <path
        d="M16 4.8 6.4 27.2h3.9l2.1-5.2h7.1l2.1 5.2h3.9L16 4.8Zm-2.2 13.9 2.2-5.5 2.2 5.5h-4.4Z"
        fill={`url(#${gradId})`}
      />
    </svg>
  );
}
