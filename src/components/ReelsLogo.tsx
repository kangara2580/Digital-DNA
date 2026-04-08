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
          <stop offset="0%" stopColor="#1C2D5A" />
          <stop offset="100%" stopColor="#FF8A3D" />
        </linearGradient>
        <linearGradient id="reels-logo-fill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.8)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.25)" />
        </linearGradient>
      </defs>
      <rect
        x="3"
        y="4"
        width="21"
        height="24"
        rx="6"
        stroke="url(#reels-logo-grad)"
        strokeWidth="1.6"
        fill="url(#reels-logo-fill)"
      />
      <circle cx="8" cy="9.5" r="1.2" fill="#FF8A3D" opacity="0.95" />
      <circle cx="18" cy="9.5" r="1.2" fill="#FF8A3D" opacity="0.95" />
      <circle cx="8" cy="22.5" r="1.2" fill="#1C2D5A" opacity="0.95" />
      <circle cx="18" cy="22.5" r="1.2" fill="#1C2D5A" opacity="0.95" />
      <path
        d="M15 10.5c3.8 0 6.5 2.2 6.5 5.5s-2.7 5.5-6.5 5.5"
        stroke="url(#reels-logo-grad)"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  );
}
