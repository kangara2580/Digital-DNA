"use client";

/** 레일과 동일한 홈 로고 PNG */
export const ARA_LOGO_SRC = "/brand/ara-brand-mark.png";

/** 다크 모드 로딩·레일 — 흰 윤곽 baked-in */
const ARA_LOGO_SRC_DARK = "/brand/ara-brand-mark-dark-rail.png?v=2";

const spinLogoImgClass =
  "pointer-events-none h-full w-full select-none object-contain";

type Props = {
  size?: number;
  className?: string;
  /** 접근성 — 스크린리더용 (시각적으로 숨김) */
  title?: string;
};

/** ARA 로딩: 점프·보잉 착지 후 좌우 젤리 흔들 */
export function AraDualSpinLogo({ size = 36, className = "", title }: Props) {
  const dim = Math.max(12, Math.round(size));

  return (
    <span
      className={`ara-dual-spin-stage relative inline-flex shrink-0 items-center justify-center bg-transparent ${className}`}
      style={{ width: dim, height: dim }}
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
    >
      {title ? <span className="sr-only">{title}</span> : null}
      <span className="ara-dual-spin-inner inline-flex h-full w-full items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={ARA_LOGO_SRC}
          alt=""
          width={dim}
          height={dim}
          draggable={false}
          decoding="async"
          className={`${spinLogoImgClass} [html[data-theme='dark']_&]:hidden`}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={ARA_LOGO_SRC_DARK}
          alt=""
          width={dim}
          height={dim}
          draggable={false}
          decoding="async"
          className={`${spinLogoImgClass} hidden [html[data-theme='dark']_&]:block`}
        />
      </span>
    </span>
  );
}
