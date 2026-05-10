import type { ComponentProps } from "react";

/**
 * 좌측 레일「쇼핑」과 동일 SVG — 가방 윤곽 + 손잡이 호 + 가운데 줄.
 */
export function ShopBagOutlineIcon({
  className,
  strokeWidth = 1.75,
  ...props
}: ComponentProps<"svg"> & { strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden {...props}>
      <path
        d="M5.3 8.8H18.7L17.5 20H6.5L5.3 8.8Z"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.8 8.8V6.9C8.8 5.1 10.2 3.7 12 3.7C13.8 3.7 15.2 5.1 15.2 6.9V8.8"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.3 15.8H14.7"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
