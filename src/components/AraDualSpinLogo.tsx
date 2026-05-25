"use client";

/** 레일과 동일한 홈 로고 PNG */
export const ARA_LOGO_SRC = "/brand/ara-brand-mark.png";

type Props = {
  size?: number;
  className?: string;
  /** 접근성 — 스크린리더용 (시각적으로 숨김) */
  title?: string;
};

/** ARA 로딩: 라이트 로고 PNG 그대로 회전 */
export function AraDualSpinLogo({ size = 56, className = "", title }: Props) {
  const dim = Math.max(12, Math.round(size));

  return (
    <span
      className={`ara-dual-spin-stage relative inline-flex shrink-0 items-center justify-center bg-transparent ${className}`}
      style={{ width: dim, height: dim }}
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
    >
      {title ? <span className="sr-only">{title}</span> : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={ARA_LOGO_SRC}
        alt=""
        width={dim}
        height={dim}
        draggable={false}
        decoding="async"
        className="ara-dual-spin-logo pointer-events-none h-full w-full select-none object-contain"
      />
    </span>
  );
}
