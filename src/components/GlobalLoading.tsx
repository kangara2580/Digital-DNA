"use client";

import type { ReactNode } from "react";
import { AraDualSpinLogo } from "@/components/AraDualSpinLogo";
import { useTranslation } from "@/hooks/useTranslation";

const SIZE_PX = {
  sm: 24,
  md: 40,
  lg: 56,
  xl: 72,
} as const;

export type GlobalLoadingSize = keyof typeof SIZE_PX;

type GlobalLoadingProps = {
  size?: GlobalLoadingSize;
  /** 보조 문구 (없으면 스피너만) */
  label?: string;
  className?: string;
  /** 텍스트를 스피너 옆에 배치 */
  inline?: boolean;
};

/** 앱 전역 커스텀 로딩 스피너 */
export function GlobalLoading({
  size = "md",
  label,
  className = "",
  inline = false,
}: GlobalLoadingProps) {
  const { t } = useTranslation();
  const px = SIZE_PX[size];
  const aria = t("globalLoading.aria");

  return (
    <div
      className={`flex items-center justify-center ${
        inline ? "flex-row gap-2.5" : "flex-col gap-3"
      } ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label ?? aria}
    >
      <AraDualSpinLogo size={px} title={aria} />
      {label ? (
        <p className="text-[15px] font-medium text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
          {label}
        </p>
      ) : null}
    </div>
  );
}

/** Loader2 / animate-spin 대체용 별칭 */
export function LoadingSpinner(props: GlobalLoadingProps) {
  return <GlobalLoading {...props} />;
}

type PageLoadingShellProps = {
  className?: string;
  label?: string;
  /** 탐색·풀뷰포트 등 */
  fullViewport?: boolean;
  children?: ReactNode;
};

/** Next.js loading.tsx · 페이지 스켈레톤 공통 셸 */
export function PageLoadingShell({
  className = "",
  label,
  fullViewport = false,
  children,
}: PageLoadingShellProps) {
  return (
    <div
      className={`flex w-full items-center justify-center px-4 ${
        fullViewport
          ? "min-h-[calc(100dvh-var(--header-height,4.5rem))] max-md:min-h-[100dvh]"
          : "min-h-[min(70vh,32rem)] py-16"
      } ${className}`}
    >
      {children ?? <GlobalLoading size="lg" label={label} />}
    </div>
  );
}
