"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { GoogleOAuthButton } from "@/components/GoogleOAuthButton";
import { useAuthSession } from "@/hooks/useAuthSession";
import { postLoginRedirectPath } from "@/lib/postLoginRedirect";

function oauthErrorMessage(reason: string): string {
  const lower = reason.toLowerCase();

  if (lower.includes("redirect") || lower.includes("mismatch")) {
    return "리다이렉트 URL이 정확히 등록되지 않았습니다. Supabase Redirect URLs와 현재 접속 주소의 /auth/callback 경로를 다시 확인해 주세요.";
  }
  if (lower.includes("provider") && lower.includes("enabled")) {
    return "Supabase Authentication > Providers에서 Google 제공자가 켜져 있는지 확인해 주세요.";
  }
  if (lower.includes("invalid client") || lower.includes("oauth client")) {
    return "Google OAuth Client ID 또는 Client Secret 설정이 올바르지 않습니다. Google Cloud와 Supabase Provider 설정을 다시 저장해 주세요.";
  }
  if (lower.includes("access_denied")) {
    return "Google 인증 화면에서 권한 승인이 취소되었습니다. 다시 시도해 주세요.";
  }
  if (lower.includes("missing_code_or_config") || lower.includes("missing_code")) {
    return "로그인 완료 코드가 없습니다. 이전 실패 URL을 새로고침하지 말고, Google 로그인 버튼으로 다시 시작해 주세요.";
  }
  if (lower.includes("missing_next_public_supabase_url")) {
    return "서버 환경변수 NEXT_PUBLIC_SUPABASE_URL이 비어 있습니다. Vercel Environment Variables를 확인해 주세요.";
  }
  if (lower.includes("missing_next_public_supabase_anon_key")) {
    return "서버 환경변수 NEXT_PUBLIC_SUPABASE_ANON_KEY가 비어 있습니다. Vercel Environment Variables를 확인해 주세요.";
  }
  if (lower.includes("exchange") || lower.includes("invalid_grant")) {
    return "Supabase가 Google 로그인 코드를 세션으로 바꾸지 못했습니다. Supabase Redirect URL과 Google Cloud callback URI를 다시 확인해 주세요.";
  }
  if (lower.includes("fetch failed") || lower.includes("failed to fetch")) {
    return "서버가 Supabase에 연결하지 못했습니다. 잠시 후 다시 시도하고, Vercel 환경변수의 Supabase URL과 Anon Key를 확인해 주세요.";
  }
  if (reason) {
    return `원인: ${reason}`;
  }
  return "Supabase 대시보드에서 Google 제공자를 켜고, Redirect URL에 현재 사이트 주소의 /auth/callback 경로가 등록되어 있는지 확인해 주세요.";
}

export function LoginPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuthSession();

  const [error, setError] = useState("");
  const notice = "";

  useEffect(() => {
    const errorType = searchParams.get("error") ?? "";
    if (!errorType.startsWith("oauth")) return;

    const reason = decodeURIComponent(searchParams.get("reason") ?? "");
    setError(`Google 로그인에 실패했습니다. ${oauthErrorMessage(reason)}`);
  }, [searchParams]);

  useEffect(() => {
    if (authLoading || !user) return;
    const raw = searchParams.get("redirect");
    const path =
      raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : null;
    router.replace(postLoginRedirectPath(path));
  }, [authLoading, router, searchParams, user]);

  const redirectPath = useMemo(() => searchParams.get("redirect"), [searchParams]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07080f] px-4 py-6 text-zinc-100 sm:px-6 sm:py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(0,51,255,0.22),transparent_42%),radial-gradient(circle_at_78%_86%,rgba(0,242,234,0.16),transparent_42%),linear-gradient(180deg,#05060b_0%,#080913_100%)]" />
      <div className="relative flex min-h-[calc(100vh-3rem)] items-center justify-center sm:min-h-[calc(100vh-4rem)]">
        <div className="absolute inset-0 bg-black/58 backdrop-blur-[6px]" />
        <div className="relative w-full max-w-[560px] rounded-[24px] border border-white/20 bg-[radial-gradient(120%_120%_at_0%_0%,rgba(0,51,255,0.34)_0%,rgba(8,14,30,0.94)_52%,rgba(2,6,16,0.98)_100%)] px-5 pb-8 pt-8 shadow-[0_60px_130px_-40px_rgba(0,0,0,0.95)] sm:rounded-[28px] sm:px-7 sm:pb-10 sm:pt-10">
          <button
            type="button"
            onClick={() => router.back()}
            className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10 text-zinc-200 transition hover:bg-white/20"
            aria-label="닫기"
          >
            x
          </button>
          <p className="relative text-center text-[clamp(1.85rem,6vw,2.65rem)] font-black tracking-tight text-white">
            ARA
          </p>
          <p className="relative mt-3 text-center text-[clamp(1.15rem,4.6vw,1.85rem)] font-semibold leading-tight text-zinc-100">
            로그인/회원가입
          </p>
          {error ? (
            <p
              className="mt-5 rounded-xl border border-rose-500/45 bg-rose-500/10 px-3 py-2 text-[13px] font-semibold text-rose-200"
              role="alert"
            >
              {error}
            </p>
          ) : null}
          {notice ? (
            <p
              className="mt-5 rounded-xl border border-emerald-500/45 bg-emerald-500/10 px-3 py-2 text-[13px] font-semibold text-emerald-200"
              role="status"
            >
              {notice}
            </p>
          ) : null}
          <div className="mx-auto mt-9 w-full max-w-[360px]">
            <GoogleOAuthButton
              nextPath={redirectPath}
              label="Google로 바로 시작"
              className="flex w-full items-center justify-center gap-3 rounded-full bg-white px-4 py-3 text-[clamp(1rem,3.8vw,1.25rem)] font-extrabold text-[#1a1a1a] shadow-[0_16px_34px_-18px_rgba(255,255,255,0.95)] transition hover:brightness-95 sm:px-6 sm:py-4"
            />
          </div>
        </div>
      </div>
    </main>
  );
}
