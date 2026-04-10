import { useId } from "react";

/**
 * 추천 영상 — 브랜드 그라데이션 별 + 반짝 (릴스마켓 톤)
 */
export function RecommendMagnetIcon({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  const gid = `rec-brand-${uid}`;

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient
          id={gid}
          x1="3"
          y1="4"
          x2="21"
          y2="20"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FF0055" />
          <stop offset="1" stopColor="#00F2EA" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="9.5" fill={`url(#${gid})`} opacity={0.14} />
      <path
        d="M12 5.2l1.65 3.75 4.05.35-3.05 2.7 0.9 3.95L12 14.6l-3.55 1.35 0.9-3.95-3.05-2.7 4.05-.35L12 5.2z"
        fill={`url(#${gid})`}
        stroke="white"
        strokeWidth="0.35"
        strokeLinejoin="round"
        opacity={0.98}
      />
      <circle cx="6.8" cy="8.2" r="1.05" fill="#00F2EA" />
      <circle cx="17.4" cy="15" r="0.85" fill="#FF0055" />
      <path
        d="M18.5 6.5l0.5 1.1-1.1 0.5-0.5-1.1 1.1-0.5z"
        fill="#00F2EA"
        opacity={0.85}
      />
    </svg>
  );
}
