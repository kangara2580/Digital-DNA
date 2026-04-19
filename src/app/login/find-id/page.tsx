"use client";

import Link from "next/link";
import { useState } from "react";

const INPUT =
  "w-full rounded-xl border border-white/20 bg-black/30 px-3.5 py-3 text-sm text-zinc-100 outline-none backdrop-blur-sm transition placeholder:text-zinc-500 focus:border-fuchsia-400/70 focus:ring-2 focus:ring-fuchsia-500/30";

type ApiOk =
  | {
      ok: true;
      found: true;
      maskedEmail: string;
      hint?: string;
    }
  | {
      ok: true;
      found: false;
      ambiguous?: boolean;
      message?: string;
    }
  | {
      ok: false;
      error?: string;
      message?: string;
    };

export default function FindIdPage() {
  const [nickname, setNickname] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ApiOk | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResult(null);
    const n = nickname.trim();
    const p = phone.trim();
    if (!n && !p) {
      setError("닉네임 또는 휴대폰 번호 중 하나 이상 입력해 주세요.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/find-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(n ? { nickname: n } : {}),
          ...(p ? { phone: p } : {}),
        }),
      });
      const data = (await res.json()) as ApiOk & { message?: string };
      if (!res.ok) {
        setError(data.message || "요청을 처리하지 못했습니다.");
        return;
      }
      setResult(data);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07080f] px-4 py-12 text-zinc-100 sm:px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(236,72,153,0.18),transparent_40%),radial-gradient(circle_at_80%_90%,rgba(59,130,246,0.16),transparent_45%),linear-gradient(180deg,#05060b_0%,#080913_100%)]" />
      <div className="relative mx-auto mt-10 w-full max-w-md rounded-2xl border border-white/15 bg-white/[0.04] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:mt-16 sm:p-8">
        <p className="text-xs uppercase tracking-[0.35em] text-zinc-400">Reels Market</p>
        <h1 className="mt-3 text-2xl font-black tracking-tight text-white">아이디(이메일) 찾기</h1>
        <p className="mt-2 text-sm text-zinc-400">
          로그인 아이디는 <strong className="text-zinc-300">이메일 주소</strong>입니다. 가입 시 등록한{" "}
          <strong className="text-zinc-300">닉네임</strong> 또는{" "}
          <strong className="text-zinc-300">휴대폰 번호</strong>로 조회하면 일부만 표시됩니다.
        </p>

        {error ? (
          <p className="mt-5 rounded-xl border border-rose-500/45 bg-rose-500/10 px-3 py-2 text-[13px] font-semibold text-rose-200">
            {error}
          </p>
        ) : null}

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="mb-1.5 block text-[12px] font-bold text-zinc-300">닉네임 (선택)</label>
            <input
              className={INPUT}
              type="text"
              autoComplete="nickname"
              placeholder="가입 시 닉네임"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-bold text-zinc-300">휴대폰 번호 (선택)</label>
            <input
              className={INPUT}
              type="tel"
              autoComplete="tel"
              placeholder="01012345678 또는 +82…"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-gradient-to-r from-fuchsia-500 to-indigo-500 py-3 text-[15px] font-extrabold text-white shadow-[0_12px_30px_rgba(168,85,247,0.45)] transition hover:brightness-110 disabled:opacity-60"
          >
            {busy ? "조회 중…" : "이메일 힌트 받기"}
          </button>
        </form>

        {result && result.ok && "found" in result && result.found ? (
          <div className="mt-6 rounded-xl border border-emerald-500/45 bg-emerald-500/10 px-3 py-3 text-[13px] text-emerald-100">
            <p className="font-bold">조회 결과</p>
            <p className="mt-2 font-mono text-[15px] text-white">{result.maskedEmail}</p>
            {result.hint ? <p className="mt-2 text-[12px] text-emerald-200/90">{result.hint}</p> : null}
          </div>
        ) : null}

        {result && result.ok && "found" in result && !result.found ? (
          <p className="mt-6 rounded-xl border border-amber-500/35 bg-amber-500/10 px-3 py-3 text-[13px] text-amber-100">
            {result.message ||
              "일치하는 정보가 없습니다."}
          </p>
        ) : null}

        <p className="mt-6 text-center text-sm text-zinc-500">
          <Link href="/login" className="font-semibold text-fuchsia-300 hover:underline">
            로그인으로 돌아가기
          </Link>
          {" · "}
          <Link href="/forgot-password" className="font-semibold text-fuchsia-300 hover:underline">
            비밀번호 찾기
          </Link>
        </p>
      </div>
    </main>
  );
}
