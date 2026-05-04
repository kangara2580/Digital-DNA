"use client";

import Link from "next/link";
import { Store } from "lucide-react";
import { SellerClipUploadForm } from "@/components/SellerClipUploadForm";
import { useAuthSession } from "@/hooks/useAuthSession";
import { MYPAGE_OUTLINE_BTN_MD } from "@/lib/mypageOutlineCta";

const REDIRECT = "/sell";

export function SellPageClient() {
  const { user, loading, supabaseConfigured } = useAuthSession();

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
        계정 정보를 확인하는 중…
      </main>
    );
  }

  if (!supabaseConfigured) {
    return (
      <main className="mx-auto max-w-[min(44rem,100%)] px-4 pb-14 pt-[max(4rem,env(safe-area-inset-top)+2.75rem)] text-zinc-100 sm:px-6 lg:max-w-3xl lg:pb-16 [html[data-theme='light']_&]:text-zinc-900">
        <div className="mb-8 rounded-2xl border border-white/10 bg-zinc-900/50 p-6 sm:p-8 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:shadow-sm">
          <h1 className="text-[clamp(1.25rem,3.5vw,1.6rem)] font-semibold tracking-tight text-zinc-50 [html[data-theme='light']_&]:text-zinc-900">
            동영상 판매 등록 (데모 모드)
          </h1>
          <p className="mt-3 text-[14px] leading-relaxed text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
            로그인 없이도 등록 폼을 사용할 수 있도록 임시 판매 모드로 열었습니다.
            파일 업로드 또는 영상 URL 등록, 제목·설명·가격·권리 동의까지 한 번에 진행할
            수 있어요.
          </p>
        </div>

        <SellerClipUploadForm />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-[min(40rem,100%)] px-4 pb-14 pt-[max(4rem,env(safe-area-inset-top)+2.75rem)] text-zinc-100 sm:px-6 [html[data-theme='light']_&]:text-zinc-900">
        <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6 sm:p-8 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:shadow-sm">
          <div className="flex items-center gap-2">
            <Store
              aria-hidden
              className="h-6 w-6 shrink-0"
              color="#E42980"
              strokeWidth={2}
            />
            <h1 className="text-[clamp(1.15rem,3.2vw,1.35rem)] font-semibold tracking-tight text-zinc-50 [html[data-theme='light']_&]:text-zinc-900">
              동영상을 판매하려면 로그인이 필요해요
            </h1>
          </div>
          <p className="mt-3 text-[14px] leading-relaxed text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
            회원가입 후 이메일 인증을 완료한 계정으로 로그인하면, 동영상 업로드와 가격 등을
            입력할 수 있습니다.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href={`/login?redirect=${encodeURIComponent(REDIRECT)}`}
              className="inline-flex items-center justify-center rounded-xl bg-reels-crimson px-6 py-3 text-[14px] font-semibold text-white transition hover:bg-market-bloomHover"
            >
              로그인
            </Link>
            <Link
              href={`/signup?redirect=${encodeURIComponent(REDIRECT)}`}
              className={MYPAGE_OUTLINE_BTN_MD}
            >
              회원가입
            </Link>
          </div>
          <p className="mt-6 text-[12px] text-zinc-600 [html[data-theme='light']_&]:text-zinc-500">
            이미 계정이 있다면 로그인만 하면 됩니다. 아직 없다면 회원가입 → 메일
            인증 순서로 진행해 주세요.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[min(46rem,100%)] px-4 pb-16 pt-[max(3.5rem,env(safe-area-inset-top)+2.25rem)] text-zinc-100 sm:px-6 lg:max-w-3xl [html[data-theme='light']_&]:text-zinc-900">
      <SellerClipUploadForm />
    </main>
  );
}
