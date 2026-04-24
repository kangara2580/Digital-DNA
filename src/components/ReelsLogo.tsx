import { useId } from "react";

/**
 * ARA — Diamond + monogram mark
 */
export function ReelsLogo({
  className = "",
  size = 28,
  variant = "glass",
}: {
  className?: string;
  size?: number;
  variant?: "glass" | "bold-orange" | "flat-minimal";
}) {
  const uid = useId().replace(/:/g, "");
  const strokeGradId = `ara-stroke-${uid}`;
  const monoGradId = `ara-mono-${uid}`;
  const glowId = `ara-glow-${uid}`;

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
        <linearGradient id={strokeGradId} x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#BFEFFF" />
          <stop offset="55%" stopColor="#7FDBFF" />
          <stop offset="100%" stopColor="#B99AFB" />
        </linearGradient>
        <linearGradient id={monoGradId} x1="8" y1="7" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#84EAFF" />
          <stop offset="100%" stopColor="#8FA9FF" />
        </linearGradient>
        <filter id={glowId} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1.25" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {variant === "glass" || variant === "bold-orange" ? (
        <>
          {/* Diamond shell */}
          <path
            d="M6 9 9.2 5.2h13.6L26 9l-3.6 4.2H9.6L6 9Zm3.9 4.9h12.2L16 26.3 9.9 13.9Z"
            fill="none"
            stroke={`url(#${strokeGradId})`}
            strokeWidth="1.7"
            strokeLinejoin="round"
            filter={`url(#${glowId})`}
          />

          {/* Interlocked ARA monogram strokes */}
          <path
            d="M8.2 20.4 11.3 12h1.2l3.5 8.4m-5.1-2.4h3.9M13.7 20.4 16.2 12h1.2l2.4 8.4m-3.7-3h3M17.8 12h4.2m-2.1 0v8.4"
            fill="none"
            stroke={`url(#${monoGradId})`}
            strokeWidth="1.45"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="23.4" cy="8.5" r="2.1" fill="#FF8B1F" opacity="0.95" />
          <circle cx="21.9" cy="9.3" r="0.9" fill="#FFD79C" opacity="0.95" />
        </>
      ) : null}

      {variant === "flat-minimal" ? (
        <>
          <path
            d="M6.4 9.3 9.3 5.8h13.4l2.9 3.5-3.3 3.8H9.7L6.4 9.3Zm3.6 4.5h12L16 25.2l-6-11.4Z"
            fill="none"
            stroke="#7FDBFF"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path
            d="M10.2 19.8 13 12.6m-2.8 7.2h5.2m-.6 0 2.2-7.2m1.2 0v7.2m-3.2 0h5.8"
            fill="none"
            stroke="#E8F3FF"
            strokeWidth="1.35"
            strokeLinecap="round"
          />
        </>
      ) : null}

      {variant === "flat-minimal" ? (
        <>
          <circle cx="16" cy="16" r="11" fill="#001F3F" />
          <path
            d="M16 8.6 10.9 21h2.3l1-2.5h3.7l1 2.5h2.3L16 8.6Zm-1 7.1L16 13l1 2.7h-2Z"
            fill="#7FDBFF"
          />
          <circle cx="9.6" cy="9.6" r="1.8" fill="#FF7A1A" />
        </>
      ) : null}
    </svg>
  );
}
