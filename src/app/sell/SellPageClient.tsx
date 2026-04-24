"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Store } from "lucide-react";
import { useCallback } from "react";
import { SellerClipUploadForm } from "@/components/SellerClipUploadForm";
import { useAuthSession } from "@/hooks/useAuthSession";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

const REDIRECT = "/sell";

export function SellPageClient() {
  const router = useRouter();
  const { user, loading, supabaseConfigured } = useAuthSession();

  const onLogout = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase?.auth.signOut({ scope: "global" });
    router.replace("/login?logged_out=1");
    router.refresh();
  }, [router]);

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
        계정 정보를 확인하는 중…
      </main>
    );
  }

  if (!supabaseConfigured) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 text-zinc-100 sm:px-6 sm:py-14 [html[data-theme='light']_&]:text-zinc-900">
        <nav className="mb-6 font-mono text-[11px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
          <Link href="/" className="text-reels-cyan/90 hover:text-reels-cyan">
            홈
          </Link>
          <span className="mx-1.5 text-zinc-700 [html[data-theme='light']_&]:text-zinc-500">
            /
          </span>
          <span className="text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
            릴스 판매 등록
          </span>
        </nav>

        <div className="mb-6 reels-glass-card rounded-2xl p-5 sm:p-6">
          <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">
            릴스 판매 등록 (데모 모드)
          </h1>
          <p className="mt-2 text-[13px] leading-relaxed text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
            로그인 없이도 등록 폼을 사용할 수 있도록 임시 판매 모드로 열었습니다.
            파일 업로드 또는 영상 URL 등록, 제목/설명/가격/권리 동의까지 한 번에
            진행할 수 있어요.
          </p>
        </div>

        <SellerClipUploadForm />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12 text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
        <div className="reels-glass-card rounded-2xl p-6 sm:p-8">
          <div className="flex items-center gap-2">
            <Store className="h-6 w-6 text-reels-cyan" strokeWidth={2} aria-hidden />
            <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">
              릴스를 판매하려면 로그인이 필요해요
            </h1>
          </div>
          <p className="mt-3 text-[14px] leading-relaxed text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
            회원가입 후 이메일 인증을 완료한 계정으로 로그인하면, 동영상 업로드와
            가격·해시태그 등을 입력할 수 있습니다.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href={`/login?redirect=${encodeURIComponent(REDIRECT)}`}
              className="inline-flex items-center justify-center rounded-full bg-reels-crimson px-6 py-3 text-[14px] font-extrabold text-white shadow-reels-crimson transition hover:brightness-110"
            >
              로그인
            </Link>
            <Link
              href={`/signup?redirect=${encodeURIComponent(REDIRECT)}`}
              className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/[0.06] px-6 py-3 text-[14px] font-bold text-zinc-100 transition hover:border-reels-cyan/40 hover:bg-white/[0.1] [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-900"
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

  const email = user.email ?? "연동된 계정";

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 text-zinc-100 sm:px-6 sm:py-14 [html[data-theme='light']_&]:text-zinc-900">
      <nav className="mb-6 font-mono text-[11px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
        <Link href="/" className="text-reels-cyan/90 hover:text-reels-cyan">
          홈
        </Link>
        <span className="mx-1.5 text-zinc-700 [html[data-theme='light']_&]:text-zinc-500">
          /
        </span>
        <span className="text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
          릴스 판매 등록
        </span>
      </nav>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl [html[data-theme='light']_&]:text-zinc-900">
            릴스 판매 등록
          </h1>
          <p className="mt-1 text-[13px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
            로그인: <span className="font-semibold text-zinc-300 [html[data-theme='light']_&]:text-zinc-800">{email}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="inline-flex items-center justify-center gap-2 self-start rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-[13px] font-bold text-zinc-300 transition hover:border-white/25 hover:bg-white/[0.1] [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-900"
        >
          <LogOut className="h-4 w-4" strokeWidth={2} aria-hidden />
          로그아웃
        </button>
      </div>

      <SellerClipUploadForm />
    </main>
  );
}
