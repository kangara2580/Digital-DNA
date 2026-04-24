"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { EmailOtpType } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

const INPUT =
  "w-full rounded-xl border border-white/20 bg-black/30 px-3.5 py-3 text-sm text-zinc-100 outline-none backdrop-blur-sm transition placeholder:text-zinc-500 focus:border-fuchsia-400/70 focus:ring-2 focus:ring-fuchsia-500/30";
const SAME_PASSWORD_MESSAGE = "기존 비밀번호와 동일해요. 새로운 비밀번호로 변경해 주세요.";
const RECOVERY_COOKIE = "rm_recovery_in_progress";

function setRecoveryCookie() {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${RECOVERY_COOKIE}=1; Path=/; Max-Age=900; SameSite=Lax${secure}`;
}

function clearRecoveryCookie() {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${RECOVERY_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}

function hasRecoveryCookie(): boolean {
  return document.cookie
    .split(";")
    .map((v) => v.trim())
    .some((v) => v === `${RECOVERY_COOKIE}=1`);
}

function isSamePasswordError(message: string): boolean {
  return /same password|different from the old|should be different|same as old|이전 비밀번호와 달라야/i.test(
    message,
  );
}

export default function ResetPasswordPage() {
  const [initializing, setInitializing] = useState(true);
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setInitializing(false);
      return;
    }

    let cancelled = false;

    const boot = async () => {
      try {
        const url = new URL(window.location.href);
        const searchParams = url.searchParams;
        const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
        let linkError = "";

        const urlError =
          searchParams.get("error_description") || searchParams.get("error") || "";
        if (urlError) {
          linkError = "유효한 재설정 링크가 아니거나 만료되었습니다. 비밀번호 찾기를 다시 시도해 주세요.";
        }

        const code = searchParams.get("code");
        const tokenHash = searchParams.get("token_hash");
        const otpType = searchParams.get("type");
        const hashAccessToken = hashParams.get("access_token");
        const hashRefreshToken = hashParams.get("refresh_token");
        const hasRecoveryParams = Boolean(code || tokenHash || hashAccessToken);
        if (hasRecoveryParams) {
          setRecoveryCookie();
        }
        const hasRecoveryContext = hasRecoveryParams || hasRecoveryCookie();

        if (code) {
          const { error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeErr) {
            linkError = exchangeErr.message || "재설정 링크 확인에 실패했습니다. 다시 시도해 주세요.";
          }
        } else if (tokenHash && otpType) {
          const { error: verifyErr } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: otpType as EmailOtpType,
          });
          if (verifyErr) {
            linkError = verifyErr.message || "재설정 링크 확인에 실패했습니다. 다시 시도해 주세요.";
          }
        } else if (hashAccessToken && hashRefreshToken) {
          const { error: setSessionErr } = await supabase.auth.setSession({
            access_token: hashAccessToken,
            refresh_token: hashRefreshToken,
          });
          if (setSessionErr) {
            linkError = setSessionErr.message || "재설정 링크 확인에 실패했습니다. 다시 시도해 주세요.";
          }
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!cancelled) {
          const hasSession = Boolean(session?.user);
          const canResetPassword = hasSession && hasRecoveryContext;
          setReady(canResetPassword);
          if (canResetPassword) {
            setError("");
          } else if (linkError) {
            setError(linkError);
            clearRecoveryCookie();
          } else if (!hasRecoveryContext) {
            clearRecoveryCookie();
          }
          if (hasSession && (code || tokenHash || hashAccessToken)) {
            // URL에서 일회성 인증 파라미터를 제거해 재사용/노출을 줄입니다.
            window.history.replaceState({}, "", "/reset-password");
          }
        }
      } catch {
        if (!cancelled) {
          setError("링크 확인 중 오류가 발생했습니다. 비밀번호 찾기를 다시 시도해 주세요.");
        }
      } finally {
        if (!cancelled) setInitializing(false);
      }
    };

    void boot();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setRecoveryCookie();
      }
      const inRecoveryContext = hasRecoveryCookie();
      if (
        (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN" || event === "TOKEN_REFRESHED") &&
        session?.user &&
        inRecoveryContext
      ) {
        setReady(true);
      } else if (event === "SIGNED_OUT") {
        clearRecoveryCookie();
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    if (password !== confirm) {
      setError("비밀번호와 확인이 일치하지 않습니다.");
      return;
    }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Supabase 환경변수가 없습니다.");
      return;
    }
    setBusy(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const email = userData.user?.email?.trim() || "";
      if (email) {
        const { error: sameCheckErr } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (!sameCheckErr) {
          setError(SAME_PASSWORD_MESSAGE);
          return;
        }
      }

      const { error: upErr } = await supabase.auth.updateUser({ password });
      if (upErr) {
        if (isSamePasswordError(upErr.message || "")) {
          setError(SAME_PASSWORD_MESSAGE);
          return;
        }
        setError(upErr.message || "비밀번호를 저장하지 못했습니다.");
        return;
      }
      clearRecoveryCookie();
      await supabase.auth.signOut({ scope: "global" });
      setDone(true);
      setReady(false);
    } catch {
      setError("처리 중 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07080f] px-4 py-12 text-zinc-100 sm:px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(236,72,153,0.18),transparent_40%),radial-gradient(circle_at_80%_90%,rgba(59,130,246,0.16),transparent_45%),linear-gradient(180deg,#05060b_0%,#080913_100%)]" />
      <div className="relative mx-auto mt-10 w-full max-w-md rounded-2xl border border-white/15 bg-white/[0.04] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:mt-16 sm:p-8">
        <p className="text-xs uppercase tracking-[0.35em] text-zinc-400">ARA</p>
        <h1 className="mt-3 text-2xl font-black tracking-tight text-white">새 비밀번호 설정</h1>
        <p className="mt-2 text-sm text-zinc-400">
          이메일로 받은 링크를 연 뒤, 아래에 새 비밀번호를 입력해 주세요.
        </p>

        {initializing && !done ? (
          <p className="mt-6 text-[13px] text-zinc-400">재설정 링크를 확인하고 있습니다…</p>
        ) : null}

        {!initializing && !ready && !done ? (
          <p className="mt-6 text-[13px] text-zinc-500">
            유효한 재설정 링크가 아니거나 만료되었을 수 있습니다.{" "}
            <Link href="/forgot-password" className="font-semibold text-fuchsia-300 hover:underline">
              비밀번호 찾기
            </Link>
            를 다시 시도해 주세요.
          </p>
        ) : null}

        {error ? (
          <p className="mt-5 rounded-xl border border-rose-500/45 bg-rose-500/10 px-3 py-2 text-[13px] font-semibold text-rose-200">
            {error}
          </p>
        ) : null}

        {done ? (
          <p className="mt-6 rounded-xl border border-emerald-500/45 bg-emerald-500/10 px-3 py-3 text-[13px] font-semibold text-emerald-200">
            비밀번호가 변경되었습니다. 새 비밀번호로 로그인해 주세요.
          </p>
        ) : null}

        {!initializing && ready && !done ? (
          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="mb-1.5 block text-[12px] font-bold text-zinc-300">새 비밀번호</label>
              <input
                className={INPUT}
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-bold text-zinc-300">새 비밀번호 확인</label>
              <input
                className={INPUT}
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-full bg-gradient-to-r from-fuchsia-500 to-indigo-500 py-3 text-[15px] font-extrabold text-white shadow-[0_12px_30px_rgba(168,85,247,0.45)] transition hover:brightness-110 disabled:opacity-60"
            >
              {busy ? "저장 중…" : "비밀번호 저장"}
            </button>
          </form>
        ) : null}

        <p className="mt-6 text-center text-sm text-zinc-500">
          <Link href="/login" className="font-semibold text-fuchsia-300 hover:underline">
            로그인으로 이동
          </Link>
        </p>
      </div>
    </main>
  );
}
