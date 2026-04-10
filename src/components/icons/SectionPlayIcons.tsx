/** 섹션 제목용 장식 아이콘 — 스크린리더는 h2 텍스트만 읽도록 aria-hidden */

import { useId } from "react";

function TrendingCircle() {
  return (
    <circle
      cx="12"
      cy="12"
      r="9.25"
      className="stroke-slate-300"
      strokeWidth="1.35"
      fill="rgb(241 245 249)"
    />
  );
}

function TrendingPlayGlyph() {
  return (
    <>
      <TrendingCircle />
      <path
        d="M10.2 8.35c0-.45.48-.73.87-.5l5.1 3.15c.4.25.4.85 0 1.1l-5.1 3.15a.55.55 0 0 1-.87-.5V8.35Z"
        className="fill-slate-800"
      />
    </>
  );
}

export function TrendingPlayIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <TrendingPlayGlyph />
    </svg>
  );
}

/**
 * 실패·실수 섹션 — 미니 릴 프레임 + 살짝 기울인 재생 + 반짝(브랜드 핑크→민트)
 */
export function OopsPlayIcon({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  const gid = `oops-brand-${uid}`;

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
          x1="4"
          y1="4"
          x2="20"
          y2="20"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FF0055" />
          <stop offset="1" stopColor="#00F2EA" />
        </linearGradient>
      </defs>
      <rect
        x="3.5"
        y="4.5"
        width="13"
        height="17"
        rx="3.5"
        stroke={`url(#${gid})`}
        strokeWidth="1.65"
        fill="rgba(255,0,85,0.08)"
      />
      <g transform="rotate(-8 12 12.5)">
        <path
          d="M9.2 9.4v6.2l5.2-3.1-5.2-3.1z"
          fill="white"
          stroke="white"
          strokeWidth="0.35"
          strokeLinejoin="round"
        />
      </g>
      <path
        d="M17.2 6.1l0.9 0.9-0.9 0.9-0.9-0.9 0.9-0.9z"
        fill="#00F2EA"
        opacity={0.95}
      />
      <circle cx="18.1" cy="7.4" r="0.85" fill="#FF0055" opacity={0.9} />
    </svg>
  );
}
