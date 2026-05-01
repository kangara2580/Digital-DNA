"use client";

import type { ReactNode } from "react";
import { authModalScrimPaint } from "@/lib/authModalTheme";

type Props = {
  onDismiss: () => void;
  children: ReactNode;
};

/**
 * 로그인 모달 포털 레이아웃 — 딤 레이어(blur)와 다이얼로그를 형제로 두어,
 * `backdrop-filter`가 적용된 단일 부모 아래 `inset-0` 버튼이 앞에 그려져 클릭이 막히는
 * 브라우저 레이아웃 버그를 피합니다.
 */
export function AuthModalPortal({ onDismiss, children }: Props) {
  return (
    <>
      <div
        role="presentation"
        tabIndex={-1}
        className={`fixed inset-0 z-[500] ${authModalScrimPaint}`}
        onClick={onDismiss}
        aria-hidden
      />
      <div className="pointer-events-none fixed inset-0 z-[500] flex items-center justify-center px-4">
        <div className="pointer-events-auto w-full max-w-[560px]">{children}</div>
      </div>
    </>
  );
}
