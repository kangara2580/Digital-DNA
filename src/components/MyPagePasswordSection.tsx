"use client";

import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

const INPUT =
  "w-full rounded-xl border border-white/15 bg-white/[0.06] px-3.5 py-2.5 text-[14px] text-zinc-100 outline-none transition focus:border-reels-cyan/45 [html[data-theme='light']_&]:border-black/15 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-[#24163b]";

export function MyPagePasswordSection() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (next.length < 8) {
      setError("새 비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    if (next !== confirm) {
      setError("새 비밀번호와 확인이 일치하지 않습니다.");
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Supabase 설정이 없습니다.");
      return;
    }

    if (!current.trim()) {
      setError("보안을 위해 현재 비밀번호를 입력해 주세요.");
      return;
    }

    setBusy(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      const email = u.user?.email;
      if (!email) {
        setError("이메일 정보를 찾을 수 없어 비밀번호를 바꿀 수 없습니다.");
        return;
      }
      const { error: reErr } = await supabase.auth.signInWithPassword({
        email,
        password: current,
      });
      if (reErr) {
        setError("현재 비밀번호가 올바르지 않거나, 이 계정은 이메일 비밀번호 로그인을 사용하지 않습니다.");
        return;
      }

      const { error: upErr } = await supabase.auth.updateUser({ password: next });
      if (upErr) {
        setError(upErr.message || "비밀번호 변경에 실패했습니다.");
        return;
      }
      setMessage("비밀번호가 변경되었습니다. 다음 로그인부터 새 비밀번호를 사용하세요.");
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch {
      setError("처리 중 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-4 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50">
      <h3 className="text-[15px] font-bold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
        비밀번호 변경
      </h3>
      <p className="mt-1 text-[12px] leading-relaxed text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
        이메일·비밀번호로 가입한 계정만 변경할 수 있어요. Google 전용 로그인은 비밀번호가 없을 수 있습니다.
      </p>

      {error ? (
        <p className="mt-3 rounded-lg border border-rose-500/45 bg-rose-500/10 px-3 py-2 text-[12px] font-semibold text-rose-300 [html[data-theme='light']_&]:text-rose-800">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="mt-3 rounded-lg border border-emerald-500/45 bg-emerald-500/10 px-3 py-2 text-[12px] font-semibold text-emerald-200 [html[data-theme='light']_&]:text-emerald-900">
          {message}
        </p>
      ) : null}

      <form className="mt-4 space-y-3" onSubmit={onSubmit}>
        <div>
          <label className="mb-1 block text-[12px] font-bold text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
            현재 비밀번호 (확인용)
          </label>
          <input
            className={INPUT}
            type="password"
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            placeholder="비밀번호를 바꾸려면 입력"
          />
        </div>
        <div>
          <label className="mb-1 block text-[12px] font-bold text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
            새 비밀번호 (8자 이상)
          </label>
          <input
            className={INPUT}
            type="password"
            autoComplete="new-password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-[12px] font-bold text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
            새 비밀번호 확인
          </label>
          <input
            className={INPUT}
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full border border-reels-cyan/40 bg-reels-cyan/15 py-2.5 text-[14px] font-extrabold text-reels-cyan transition hover:bg-reels-cyan/25 disabled:opacity-50"
        >
          {busy ? "처리 중…" : "비밀번호 저장"}
        </button>
      </form>
    </div>
  );
}
