"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

const INPUT =
  "w-full rounded-xl border border-white/15 bg-white/[0.06] px-3.5 py-2.5 text-[14px] text-zinc-100 outline-none transition focus:border-reels-cyan/45 [html[data-theme='light']_&]:border-black/15 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-[#24163b]";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") ?? "/sell";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Supabase 환경변수가 없어 로그인할 수 없습니다.");
      return;
    }
    setBusy(true);
    try {
      const { error: signErr } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signErr) {
        setError(signErr.message || "로그인에 실패했습니다.");
        return;
      }
      const safe =
        redirect.startsWith("/") && !redirect.startsWith("//")
          ? redirect
          : "/sell";
      router.replace(safe);
    } catch {
      setError("로그인 중 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto min-h-[70vh] max-w-md px-4 py-12 text-zinc-100 [html[data-theme='light']_&]:text-zinc-900 sm:px-6 sm:py-16">
      <div className="reels-glass-card rounded-2xl p-6 sm:p-8">
        <h1 className="text-2xl font-extrabold tracking-tight [html[data-theme='light']_&]:text-zinc-900">
          로그인
        </h1>
        <p className="mt-2 text-[13px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
          릴스 판매 등록 등 회원 전용 기능에 사용됩니다.
        </p>

        {error ? (
          <p
            className="mt-4 rounded-xl border border-rose-500/45 bg-rose-500/10 px-3 py-2 text-[13px] font-semibold text-rose-200 [html[data-theme='light']_&]:text-rose-800"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="mb-1.5 block text-[12px] font-bold text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
              이메일
            </label>
            <input
              className={INPUT}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-bold text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
              비밀번호
            </label>
            <input
              className={INPUT}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-reels-crimson py-3 text-[15px] font-extrabold text-white shadow-reels-crimson transition hover:brightness-110 disabled:opacity-60"
          >
            {busy ? "처리 중…" : "로그인"}
          </button>
        </form>

        <p className="mt-6 text-center text-[13px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
          아직 계정이 없나요?{" "}
          <Link
            href={`/signup?redirect=${encodeURIComponent(redirect)}`}
            className="font-bold text-reels-cyan hover:underline"
          >
            회원가입
          </Link>
        </p>
        <p className="mt-4 text-center">
          <Link
            href="/sell"
            className="text-[12px] font-semibold text-zinc-500 hover:text-zinc-300 [html[data-theme='light']_&]:text-zinc-600"
          >
            ← 판매 등록으로 돌아가기
          </Link>
        </p>
      </div>
    </main>
  );
}
