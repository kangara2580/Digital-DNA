"use client";

import type { ReactNode } from "react";
import { MOBILE_TOP_FLOAT_BAR_CLASS } from "@/lib/topNavIconRing";

type Props = {
  children: ReactNode;
};

/** 모바일 전용 상단 플로팅 — 검색·계정(우). 홈은 하단 패널 첫 번째 항목. */
export function MobileTopFloatChrome({ children }: Props) {
  return (
    <div className={MOBILE_TOP_FLOAT_BAR_CLASS}>
      <div className="ml-auto flex min-w-0 w-full flex-row flex-nowrap items-center justify-end gap-1.5 sm:gap-2">
        {children}
      </div>
    </div>
  );
}
