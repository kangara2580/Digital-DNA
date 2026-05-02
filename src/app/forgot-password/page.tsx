"use client";

import Link from "next/link";
import { useState } from "react";

const INPUT =
  "w-full rounded-xl border border-white/20 bg-black/30 px-3.5 py-3 text-sm text-zinc-100 outline-none backdrop-blur-sm transition placeholder:text-zinc-500 focus:border-[#fc03a5]/60 focus:ring-2 focus:ring-[#fc03a5]/26";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+82");
  const [smsCode, setSmsCode] = useState("");
  const [sendingSms, setSendingSms] = useState(false);
  const [verifyingSms, setVerifyingSms] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [smsProof, setSmsProof] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

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
        body: JSON.stringify({
          context: "forgot-password",
          countryCode,
          phone: p,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok || !data.ok) {
        setError(data.message || "인증번호 발송에 실패했습니다.");
        return;
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
          context: "forgot-password",
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
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("올바른 이메일 형식을 입력해 주세요.");
      return;
    }
    if (!phoneVerified || !smsProof) {
      setError("휴대폰 인증을 먼저 완료해 주세요.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmed,
          countryCode,
          phone: phone.trim(),
          smsProof,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok || !data.ok) {
        setError(data.message || "메일 발송에 실패했습니다.");
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
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(252,3,165,0.17),transparent_40%),radial-gradient(circle_at_80%_90%,rgba(59,130,246,0.16),transparent_45%),linear-gradient(180deg,#05060b_0%,#080913_100%)]" />
      <div className="relative mx-auto mt-10 w-full max-w-md rounded-2xl border border-white/15 bg-white/[0.04] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:mt-16 sm:p-8">
        <p className="text-xs uppercase tracking-[0.35em] text-zinc-400">ARA</p>
        <h1 className="mt-3 text-2xl font-black tracking-tight text-white">비밀번호 찾기</h1>
        <p className="mt-2 text-sm text-zinc-400">
          가입 시 사용한 이메일로 재설정 링크를 보냅니다. 받은 편지함과 스팸함을 확인해 주세요.
        </p>

        {error ? (
          <p className="mt-5 rounded-xl border border-reels-crimson/45 bg-reels-crimson/12 px-3 py-2 text-[13px] font-semibold text-[#fce9f5]">
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
            <div>
              <label className="mb-1.5 block text-[12px] font-bold text-zinc-300">휴대폰 번호 인증</label>
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
              {busy ? "발송 중…" : "재설정 링크 보내기"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-zinc-500">
          <Link href="/login" className="font-semibold text-[#fda6dc] hover:underline">
            로그인으로 돌아가기
          </Link>
        </p>
      </div>
    </main>
  );
}
