"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useEffect } from "react";
import { useAuthSession } from "@/hooks/useAuthSession";
import { MYPAGE_OUTLINE_BTN_MD } from "@/lib/mypageOutlineCta";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function SellRegistrationModal({ open, onClose }: Props) {
  const { user, loading } = useAuthSession();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[10060] flex items-center justify-center bg-black p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="flex w-full max-w-[min(44rem,100%)] min-h-0 flex-col overflow-hidden rounded-2xl border border-white/12 bg-[#06070d] shadow-2xl [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3 [html[data-theme='light']_&]:border-zinc-200">
          <h2 className="text-[18px] font-bold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
            판매 등록
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 transition hover:bg-white/10 hover:text-zinc-100 [html[data-theme='light']_&]:hover:bg-zinc-100 [html[data-theme='light']_&]:hover:text-zinc-900"
            aria-label="닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
          {loading ? (
            <div className="flex h-full items-center justify-center text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
              계정 정보를 확인하는 중…
            </div>
          ) : !user ? (
            <div className="mx-auto max-w-[min(40rem,100%)] rounded-2xl border border-white/10 bg-zinc-900/50 p-6 text-center [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white">
              <p className="text-[16px] text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
                판매 등록을 하려면 로그인 또는 회원가입이 필요해요.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
                <Link href="/login?redirect=%2Fsell" className="inline-flex items-center justify-center rounded-xl bg-reels-crimson px-6 py-3 text-[14px] font-semibold text-white transition hover:bg-market-bloomHover">
                  로그인
                </Link>
                <Link href="/signup?redirect=%2Fsell" className={MYPAGE_OUTLINE_BTN_MD}>
                  회원가입
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <div className="mx-auto w-full max-w-[min(40rem,100%)] rounded-2xl border border-white/10 bg-zinc-900/70 p-8 text-center [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white">
                <p className="mb-6 text-[14px] font-medium text-zinc-300/80 [html[data-theme='light']_&]:text-zinc-600/80">
                  등록 방식을 먼저 선택해 주세요
                </p>
                <div className="mx-auto flex w-full max-w-[31rem] gap-1.5 rounded-[2.35rem] border border-white/[0.14] bg-white/[0.04] p-2.5 [html[data-theme='light']_&]:border-zinc-200/90 [html[data-theme='light']_&]:bg-zinc-100/60">
                  <Link
                    href="/sell?source=file"
                    className="inline-flex min-h-[88px] flex-1 items-center justify-center rounded-[1.9rem] px-5 py-4 text-[22px] font-semibold leading-none text-zinc-100 transition-colors hover:bg-white/[0.08] [html[data-theme='light']_&]:text-zinc-800 [html[data-theme='light']_&]:hover:bg-white/80"
                  >
                    직접 업로드
                  </Link>
                  <Link
                    href="/sell?source=url"
                    className="inline-flex min-h-[88px] flex-1 items-center justify-center rounded-[1.9rem] px-5 py-4 text-[22px] font-semibold leading-none text-zinc-100 transition-colors hover:bg-white/[0.08] [html[data-theme='light']_&]:text-zinc-800 [html[data-theme='light']_&]:hover:bg-white/80"
                  >
                    영상 URL
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

