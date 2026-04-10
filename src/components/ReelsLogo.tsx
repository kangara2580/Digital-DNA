import { useId } from "react";

/**
 * REELS MARKET — 미니멀 마크
 * 세로 릴(동영상) + 재생 삼각형, 브랜드 네온 핑크 → 시안 그라데이션
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
      {/* 세로 릴(핸드폰/숏폼 비율에 가깝게) */}
      <rect
        x="7"
        y="4"
        width="18"
        height="24"
        rx="4.5"
        stroke={`url(#${gradId})`}
        strokeWidth="2"
        fill="none"
      />
      {/* 재생 — 동영상 마켓 */}
      <path
        d="M12.5 11.5v9L21 16l-8.5-4.5z"
        fill={`url(#${gradId})`}
      />
    </svg>
  );
}
