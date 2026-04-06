/**
 * REELS — R + 필름 퍼포레이션 + ∞ 실루엣 힌트 (SVG, 네온 미니멀)
 */
export function ReelsLogo({
  className = "",
  size = 28,
}: {
  className?: string;
  size?: number;
}) {
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
        <linearGradient id="reels-logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF0055" />
          <stop offset="100%" stopColor="#00F2EA" />
        </linearGradient>
      </defs>
      <rect
        x="2"
        y="4"
        width="20"
        height="24"
        rx="3"
        stroke="url(#reels-logo-grad)"
        strokeWidth="1.5"
        fill="rgba(255,255,255,0.03)"
      />
      <circle cx="7" cy="9" r="1.1" fill="#FF0055" opacity="0.9" />
      <circle cx="17" cy="9" r="1.1" fill="#FF0055" opacity="0.9" />
      <circle cx="7" cy="23" r="1.1" fill="#00F2EA" opacity="0.85" />
      <circle cx="17" cy="23" r="1.1" fill="#00F2EA" opacity="0.85" />
      <path
        d="M24 8c2.5 0 4.5 2.2 4.5 5s-2 5-4.5 5c-1.2 0-2.3-.5-3.1-1.3M24 18c2.5 0 4.5 2.2 4.5 5s-2 5-4.5 5"
        stroke="url(#reels-logo-grad)"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}
