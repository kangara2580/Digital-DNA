"use client";

import Link from "next/link";
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
      setError(
        "Google 로그인에 실패했습니다. Supabase 대시보드에서 Google 제공자를 켜고, 리다이렉트 URL에 이 사이트 주소를 등록했는지 확인해 주세요.",
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
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(236,72,153,0.18),transparent_40%),radial-gradient(circle_at_80%_90%,rgba(59,130,246,0.16),transparent_45%),linear-gradient(180deg,#05060b_0%,#080913_100%)]" />
      <div className="relative mx-auto mt-1 w-full max-w-md rounded-2xl border border-white/15 bg-white/[0.04] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:mt-4 sm:p-8">
        <p className="text-xs uppercase tracking-[0.35em] text-zinc-400">
          ARA
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-white">
          로그인
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          이제 ARA는 Google 계정으로만 로그인/회원가입을 지원합니다.
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

        <GoogleOAuthButton
          nextPath={redirectPath}
          label="Google로 로그인 / 회원가입"
        />
        <div className="mt-5">
          <Link
            href="/signup"
            className="inline-flex w-full items-center justify-center rounded-full border border-fuchsia-400/45 bg-fuchsia-500/20 px-5 py-3.5 text-[15px] font-extrabold text-fuchsia-100 shadow-[0_10px_28px_rgba(192,38,211,0.32)] transition hover:bg-fuchsia-500/30 hover:brightness-110"
          >
            구글로 시작하기 안내 보기
          </Link>
        </div>
      </div>
    </main>
  );
}
