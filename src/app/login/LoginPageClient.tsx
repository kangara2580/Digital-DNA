"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { GoogleOAuthButton } from "@/components/GoogleOAuthButton";
import { useAuthSession } from "@/hooks/useAuthSession";
import { postLoginRedirectPath } from "@/lib/postLoginRedirect";

export function LoginPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuthSession();

  const [error, setError] = useState("");
  const notice = "";

  useEffect(() => {
    if (searchParams.get("error") === "oauth") {
      const reasonRaw = searchParams.get("reason") ?? "";
      const reason = decodeURIComponent(reasonRaw);
      const lower = reason.toLowerCase();
      let detail = "";
      if (lower.includes("redirect") || lower.includes("mismatch")) {
        detail =
          "리다이렉트 URL이 정확히 등록되지 않았습니다. Supabase Redirect URLs와 현재 접속 주소의 /auth/callback 경로를 다시 확인해 주세요.";
      } else if (lower.includes("provider") && lower.includes("enabled")) {
        detail = "Supabase Authentication > Providers에서 Google 제공자가 켜져 있는지 확인해 주세요.";
      } else if (lower.includes("invalid client") || lower.includes("oauth client")) {
        detail =
          "Google OAuth Client ID/Secret 설정이 올바르지 않습니다. Google Cloud와 Supabase 설정을 다시 저장해 주세요.";
      } else if (lower.includes("access_denied")) {
        detail = "Google 인증 화면에서 권한이 취소되었습니다. 다시 시도해 주세요.";
      } else if (lower.includes("missing_code_or_config")) {
        detail = "콜백 코드가 누락되었거나 환경변수 설정이 비어 있습니다.";
      } else if (lower.includes("fetch failed") || lower.includes("failed to fetch")) {
        detail =
          "서버가 Supabase에 연결하지 못했습니다. Vercel(또는 호스팅) 환경변수의 NEXT_PUBLIC_SUPABASE_URL·NEXT_PUBLIC_SUPABASE_ANON_KEY가 맞는지 확인하고, 잠시 후 다시 시도해 주세요.";
      } else if (reason) {
        detail = `원인: ${reason}`;
      }
      setError(
        `Google 로그인에 실패했습니다. ${detail || "Supabase 대시보드에서 Google 제공자를 켜고, 리다이렉트 URL에 이 사이트 주소를 등록했는지 확인해 주세요."}`,
      );
    }
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
            ×
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
