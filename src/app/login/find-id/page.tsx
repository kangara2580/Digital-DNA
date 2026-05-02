"use client";

import Link from "next/link";
import { useState } from "react";

const INPUT =
  "w-full rounded-xl border border-white/20 bg-black/30 px-3.5 py-3 text-sm text-zinc-100 outline-none backdrop-blur-sm transition placeholder:text-zinc-500 focus:border-[#fc03a5]/60 focus:ring-2 focus:ring-[#fc03a5]/26";

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
  const [countryCode, setCountryCode] = useState("+82");
  const [smsCode, setSmsCode] = useState("");
  const [sendingSms, setSendingSms] = useState(false);
  const [verifyingSms, setVerifyingSms] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [smsProof, setSmsProof] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ApiOk | null>(null);

  const sendSmsCode = async () => {
    setError("");
    setPhoneVerified(false);
    setSmsProof("");
    const p = phone.trim();
    if (!p) {
      setError("휴대폰 번호를 먼저 입력해 주세요.");
      return;
    }
    setSendingSms(true);
    try {
      const res = await fetch("/api/auth/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context: "find-email", countryCode, phone: p }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok || !data.ok) {
        setError(data.message || "인증번호 발송에 실패했습니다.");
      }
    } catch {
      setError("인증번호 발송 중 오류가 발생했습니다.");
    } finally {
      setSendingSms(false);
    }
  };

  const verifySmsCode = async () => {
    setError("");
    const p = phone.trim();
    const code = smsCode.trim();
    if (!p || !code) {
      setError("휴대폰 번호와 인증번호를 입력해 주세요.");
      return;
    }
    setVerifyingSms(true);
    try {
      const res = await fetch("/api/auth/sms/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context: "find-email",
          countryCode,
          phone: p,
          code,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        message?: string;
        proof?: string;
      };
      if (!res.ok || !data.ok || !data.proof) {
        setError(data.message || "인증번호 확인에 실패했습니다.");
        setPhoneVerified(false);
        setSmsProof("");
        return;
      }
      setPhoneVerified(true);
      setSmsProof(data.proof);
    } catch {
      setError("인증번호 확인 중 오류가 발생했습니다.");
    } finally {
      setVerifyingSms(false);
    }
  };

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
    if (!p) {
      setError("보안을 위해 휴대폰 번호 입력이 필요합니다.");
      return;
    }
    if (!phoneVerified || !smsProof) {
      setError("보안을 위해 휴대폰 SMS 인증을 먼저 완료해 주세요.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/find-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(n ? { nickname: n } : {}),
          phone: p,
          countryCode,
          smsProof,
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
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(252,3,165,0.17),transparent_40%),radial-gradient(circle_at_80%_90%,rgba(59,130,246,0.16),transparent_45%),linear-gradient(180deg,#05060b_0%,#080913_100%)]" />
      <div className="relative mx-auto mt-10 w-full max-w-md rounded-2xl border border-white/15 bg-white/[0.04] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:mt-16 sm:p-8">
        <p className="text-xs uppercase tracking-[0.35em] text-zinc-400">ARA</p>
        <h1 className="mt-3 text-2xl font-black tracking-tight text-white">아이디(이메일) 찾기</h1>
        <p className="mt-2 text-sm text-zinc-400">
          로그인 아이디는 <strong className="text-zinc-300">이메일 주소</strong>입니다. 가입 시 등록한{" "}
          <strong className="text-zinc-300">닉네임</strong> 또는{" "}
          <strong className="text-zinc-300">휴대폰 번호</strong>로 조회하면 일부만 표시됩니다.
        </p>

        {error ? (
          <p className="mt-5 rounded-xl border border-reels-crimson/45 bg-reels-crimson/12 px-3 py-2 text-[13px] font-semibold text-[#fce9f5]">
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
            <label className="mb-1.5 block text-[12px] font-bold text-zinc-300">휴대폰 번호 (필수, SMS 인증)</label>
            <div className="flex gap-2">
              <select
                className={`${INPUT} max-w-[110px]`}
                value={countryCode}
                onChange={(e) => {
                  setCountryCode(e.target.value);
                  setPhoneVerified(false);
                  setSmsProof("");
                }}
              >
                <option value="+82">+82</option>
                <option value="+1">+1</option>
                <option value="+81">+81</option>
                <option value="+44">+44</option>
              </select>
              <input
                className={INPUT}
                type="tel"
                autoComplete="tel"
                placeholder="01012345678"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setPhoneVerified(false);
                  setSmsProof("");
                }}
              />
              <button
                type="button"
                onClick={() => void sendSmsCode()}
                disabled={sendingSms}
                className="shrink-0 rounded-xl border border-reels-crimson/42 bg-reels-crimson/12 px-3 py-2 text-[12px] font-bold text-[#fcd6ec] transition hover:bg-reels-crimson/22 disabled:opacity-50"
              >
                {sendingSms ? "발송 중…" : "코드 발송"}
              </button>
            </div>
            <div className="mt-2 flex gap-2">
              <input
                className={INPUT}
                type="text"
                inputMode="numeric"
                placeholder="인증번호 입력"
                value={smsCode}
                onChange={(e) => setSmsCode(e.target.value)}
              />
              <button
                type="button"
                onClick={() => void verifySmsCode()}
                disabled={verifyingSms}
                className="shrink-0 rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-[12px] font-bold text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-50"
              >
                {verifyingSms ? "확인 중…" : phoneVerified ? "인증 완료" : "인증 확인"}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-gradient-to-r from-[#fc03a5] to-indigo-500 py-3 text-[15px] font-extrabold text-white shadow-[0_12px_30px_rgba(252,3,165,0.42)] transition hover:brightness-110 disabled:opacity-60"
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
          <Link href="/login" className="font-semibold text-[#fda6dc] hover:underline">
            로그인으로 돌아가기
          </Link>
          {" · "}
          <Link href="/forgot-password" className="font-semibold text-[#fda6dc] hover:underline">
            비밀번호 찾기
          </Link>
        </p>
      </div>
    </main>
  );
}
