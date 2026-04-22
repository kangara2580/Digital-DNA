"use client";

import Link from "next/link";
import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

const INPUT =
  "w-full rounded-xl border border-white/20 bg-black/30 px-3.5 py-3 text-sm text-zinc-100 outline-none backdrop-blur-sm transition placeholder:text-zinc-500 focus:border-fuchsia-400/70 focus:ring-2 focus:ring-fuchsia-500/30";

function normalizeBaseUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const u = new URL(withProtocol);
    return u.origin;
  } catch {
    return "";
  }
}

function buildResetRedirectCandidates(): string[] {
  const out: string[] = [];
  const fromWindow =
    typeof window !== "undefined" ? normalizeBaseUrl(window.location.origin) : "";
  const fromEnv = normalizeBaseUrl(process.env.NEXT_PUBLIC_SITE_URL ?? "");
  const push = (base: string) => {
    if (!base) return;
    const redirect = `${base}/reset-password`;
    if (!out.includes(redirect)) out.push(redirect);
  };
  push(fromWindow);
  push(fromEnv);
  return out;
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("올바른 이메일 형식을 입력해 주세요.");
      return;
    }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Supabase 환경변수가 없습니다.");
      return;
    }
    setBusy(true);
    try {
      const candidates = buildResetRedirectCandidates();
      let lastError = "";
      let sent = false;
      for (const redirectTo of candidates) {
        const { error: rpErr } = await supabase.auth.resetPasswordForEmail(trimmed, {
          redirectTo,
        });
        if (!rpErr) {
          sent = true;
          break;
        }
        lastError = rpErr.message || "";
        // Supabase Redirect URL 허용 목록과 일치하지 않으면 다음 후보 URL로 재시도
        if (!/invalid path specified/i.test(lastError)) {
          break;
        }
      }
      if (!sent) {
        // 마지막 폴백: redirectTo 없이 발송 (Supabase Site URL 기본값 사용)
        const { error: fallbackErr } = await supabase.auth.resetPasswordForEmail(trimmed);
        if (!fallbackErr) {
          setDone(true);
          return;
        }
        lastError = fallbackErr.message || lastError;

        if (/invalid path specified/i.test(lastError)) {
          setError("재설정 링크 URL 설정이 맞지 않습니다. 잠시 후 다시 시도해 주세요.");
          return;
        }
        setError(lastError || "메일 발송에 실패했습니다.");
        return;
      }
      setDone(true);
    } catch {
      setError("요청 처리 중 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07080f] px-4 py-12 text-zinc-100 sm:px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(236,72,153,0.18),transparent_40%),radial-gradient(circle_at_80%_90%,rgba(59,130,246,0.16),transparent_45%),linear-gradient(180deg,#05060b_0%,#080913_100%)]" />
      <div className="relative mx-auto mt-10 w-full max-w-md rounded-2xl border border-white/15 bg-white/[0.04] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:mt-16 sm:p-8">
        <p className="text-xs uppercase tracking-[0.35em] text-zinc-400">Reels Market</p>
        <h1 className="mt-3 text-2xl font-black tracking-tight text-white">비밀번호 찾기</h1>
        <p className="mt-2 text-sm text-zinc-400">
          가입 시 사용한 이메일로 재설정 링크를 보냅니다. 받은 편지함과 스팸함을 확인해 주세요.
        </p>

        {error ? (
          <p className="mt-5 rounded-xl border border-rose-500/45 bg-rose-500/10 px-3 py-2 text-[13px] font-semibold text-rose-200">
            {error}
          </p>
        ) : null}

        {done ? (
          <p className="mt-6 rounded-xl border border-emerald-500/45 bg-emerald-500/10 px-3 py-3 text-[13px] font-semibold text-emerald-200">
            입력하신 주소로 메일을 보냈습니다. 링크를 눌러 새 비밀번호를 설정한 뒤 로그인해 주세요.
          </p>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="mb-1.5 block text-[12px] font-bold text-zinc-300">이메일</label>
              <input
                className={INPUT}
                type="email"
                autoComplete="email"
                placeholder="hello@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-full bg-gradient-to-r from-fuchsia-500 to-indigo-500 py-3 text-[15px] font-extrabold text-white shadow-[0_12px_30px_rgba(168,85,247,0.45)] transition hover:brightness-110 disabled:opacity-60"
            >
              {busy ? "발송 중…" : "재설정 링크 보내기"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-zinc-500">
          <Link href="/login" className="font-semibold text-fuchsia-300 hover:underline">
            로그인으로 돌아가기
          </Link>
        </p>
      </div>
    </main>
  );
}
