"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { GoogleOAuthButton } from "@/components/GoogleOAuthButton";
import { useAuthSession } from "@/hooks/useAuthSession";
import { postLoginRedirectPath } from "@/lib/postLoginRedirect";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

const INPUT_CLASS =
  "w-full rounded-xl border border-white/20 bg-black/30 px-3.5 py-3 text-sm text-zinc-100 outline-none backdrop-blur-sm transition placeholder:text-zinc-500 focus:border-fuchsia-400/70 focus:ring-2 focus:ring-fuchsia-500/30";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuthSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const registered = searchParams.get("registered");
    const emailFromQuery = searchParams.get("email");
    if (emailFromQuery) setEmail(emailFromQuery);
    if (registered === "1") {
      setNotice("회원가입이 완료되었습니다. 방금 만든 계정으로 로그인해 주세요.");
    }
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

  const validateForm = () => {
    const trimmedEmail = email.trim();
    if (!emailPattern.test(trimmedEmail)) {
      return "이메일 형식이 올바르지 않습니다. 예: hello@example.com";
    }
    if (password.length < 8) {
      return "비밀번호는 8자 이상으로 입력해 주세요.";
    }
    return "";
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const validationMessage = validateForm();
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError(
        "Supabase 환경변수가 비어 있습니다. .env.local의 URL/KEY를 먼저 입력해 주세요.",
      );
      return;
    }

    setBusy(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) {
        setError("로그인에 실패했습니다. 이메일 또는 비밀번호를 확인해 주세요.");
        return;
      }
      const raw = searchParams.get("redirect");
      const path =
        raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : null;
      router.replace(postLoginRedirectPath(path));
      router.refresh();
    } catch {
      setError("요청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07080f] px-4 py-6 text-zinc-100 sm:px-6 sm:py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(236,72,153,0.18),transparent_40%),radial-gradient(circle_at_80%_90%,rgba(59,130,246,0.16),transparent_45%),linear-gradient(180deg,#05060b_0%,#080913_100%)]" />
      <div className="relative mx-auto mt-1 w-full max-w-md rounded-2xl border border-white/15 bg-white/[0.04] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:mt-4 sm:p-8">
        <p className="text-xs uppercase tracking-[0.35em] text-zinc-400">
          Reels Market
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-white">
          로그인
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          이메일 계정으로 접속하고 홈 화면으로 바로 이동하세요.
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

        <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
          <div>
            <label className="mb-1.5 block text-[12px] font-bold text-zinc-300">
              이메일
            </label>
            <input
              className={INPUT_CLASS}
              type="email"
              autoComplete="email"
              placeholder="hello@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] font-bold text-zinc-300">
              비밀번호 (8자 이상)
            </label>
            <input
              className={INPUT_CLASS}
              type="password"
              autoComplete="current-password"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center text-[12px] text-zinc-500">
            <Link
              href="/login/find-id"
              className="font-semibold text-fuchsia-300/90 hover:text-fuchsia-200 hover:underline"
            >
              아이디(이메일) 찾기
            </Link>
            <span className="text-zinc-600" aria-hidden>
              |
            </span>
            <Link
              href="/forgot-password"
              className="font-semibold text-fuchsia-300/90 hover:text-fuchsia-200 hover:underline"
            >
              비밀번호 찾기
            </Link>
          </p>

          <button
            type="submit"
            disabled={busy}
            className="mt-2 w-full rounded-full bg-gradient-to-r from-fuchsia-500 to-indigo-500 py-3 text-[15px] font-extrabold text-white shadow-[0_12px_30px_rgba(168,85,247,0.45)] transition hover:brightness-110 disabled:opacity-60"
          >
            {busy ? "로그인 중…" : "홈으로 로그인"}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center" aria-hidden>
            <span className="w-full border-t border-white/15 [html[data-theme='light']_&]:border-zinc-300" />
          </div>
          <div className="relative flex justify-center text-[11px] font-semibold uppercase tracking-wider">
            <span className="bg-[#07080f] px-3 text-zinc-500 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-500">
              또는
            </span>
          </div>
        </div>

        <GoogleOAuthButton
          nextPath={searchParams.get("redirect")}
          label="Google로 로그인"
        />
        <div className="mt-5">
          <Link
            href="/signup"
            className="inline-flex w-full items-center justify-center rounded-full border border-fuchsia-400/45 bg-fuchsia-500/20 px-5 py-3.5 text-[15px] font-extrabold text-fuchsia-100 shadow-[0_10px_28px_rgba(192,38,211,0.32)] transition hover:bg-fuchsia-500/30 hover:brightness-110"
          >
            회원가입
          </Link>
        </div>
      </div>
    </main>
  );
}
