import { useId } from "react";

/**
 * ARA — cobalt A + play mark
 */
export function ReelsLogo({
  className = "",
  size = 56,
  variant = "glass",
}: {
  className?: string;
  size?: number;
  variant?: "glass" | "bold-orange" | "flat-minimal" | "rail-main";
}) {
  const uid = useId().replace(/:/g, "");
  const aGradId = `ara-a-grad-${uid}`;
  const playGradId = `ara-play-grad-${uid}`;
  const glowId = `ara-glow-${uid}`;

  const viewBox = variant === "rail-main" ? "0 0 124 140" : "0 0 32 32";

  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      fill="none"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id={aGradId} x1="8" y1="6" x2="24" y2="26" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3BA8FF" />
          <stop offset="100%" stopColor="#2E5BFF" />
        </linearGradient>
        <linearGradient id={playGradId} x1="13" y1="15" x2="19" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2F8EFF" />
          <stop offset="100%" stopColor="#2C4DFA" />
        </linearGradient>
        <filter id={glowId} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="0.8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {variant === "glass" || variant === "bold-orange" ? (
        <>
          <path
            d="M7.2 24.7 14.2 8.5h3.6l7 16.2"
            fill="none"
            stroke={`url(#${aGradId})`}
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={`url(#${glowId})`}
          />
          <polygon
            points="14.25,15.85 18.6,18.05 14.25,20.25"
            fill={`url(#${playGradId})`}
            stroke="rgba(224,238,255,0.28)"
            strokeWidth="0.35"
            strokeLinejoin="round"
          />
        </>
      ) : null}

      {variant === "flat-minimal" ? (
        <>
          <path
            d="M7.6 24.6 14.4 8.9h3.2l6.8 15.7"
            stroke={`url(#${aGradId})`}
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={`url(#${glowId})`}
          />
          <polygon points="14.45,16 18.05,17.95 14.45,19.9" fill={`url(#${playGradId})`} />
        </>
      ) : null}

      {variant === "rail-main" ? (
        <>
          <path
            d="M2 126 L46 14 Q50 8 54 14 L98 126"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="18"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M38 78 L62 91 L38 104 Z" fill="#2F8EFF" />
        </>
      ) : null}
    </svg>
  );
}
