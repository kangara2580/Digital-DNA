"use client";

import { useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

const INPUT =
  "w-full rounded-xl border border-white/15 bg-white/[0.06] px-3.5 py-2.5 text-[14px] text-zinc-100 outline-none transition focus:border-reels-cyan/45 [html[data-theme='light']_&]:border-black/15 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-[#24163b]";
const SAME_PASSWORD_MESSAGE = "기존 비밀번호와 동일해요. 새로운 비밀번호로 변경해 주세요.";

function maskPhone(phone: string): string {
  if (phone.length <= 4) return phone;
  return `${phone.slice(0, 4)}****${phone.slice(-3)}`;
}

export function MyPagePasswordSection() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [phone, setPhone] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [smsSent, setSmsSent] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sendingSms, setSendingSms] = useState(false);
  const [verifyingSms, setVerifyingSms] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const maskedPhone = useMemo(() => (phone ? maskPhone(phone) : ""), [phone]);

  const resetForm = () => {
    setCurrent("");
    setNext("");
    setConfirm("");
    setSmsCode("");
    setSmsSent(false);
    setPhoneVerified(false);
  };

  const onOpen = async () => {
    setOpen(true);
    setError("");
    setMessage("");
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    try {
      const { data } = await supabase.auth.getUser();
      setPhone(data.user?.phone?.trim() ?? "");
    } catch {
      setPhone("");
    }
  };

  const sendSmsCode = async () => {
    setError("");
    setMessage("");
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Supabase 설정이 없습니다.");
      return;
    }
    if (!phone) {
      setError("계정에 등록된 휴대폰 번호가 없어 SMS 인증을 진행할 수 없습니다.");
      return;
    }
    setSendingSms(true);
    try {
      const { error: smsErr } = await supabase.auth.signInWithOtp({
        phone,
        options: { shouldCreateUser: false },
      });
      if (smsErr) {
        setError(smsErr.message || "휴대폰 인증번호 발송에 실패했습니다.");
        return;
      }
      setSmsSent(true);
      setMessage("휴대폰으로 인증번호를 보냈습니다. 인증을 완료한 뒤 비밀번호를 저장해 주세요.");
    } catch {
      setError("휴대폰 인증 요청 중 오류가 발생했습니다.");
    } finally {
      setSendingSms(false);
    }
  };

  const verifySmsCode = async () => {
    setError("");
    setMessage("");
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Supabase 설정이 없습니다.");
      return;
    }
    if (!phone) {
      setError("계정에 등록된 휴대폰 번호가 없습니다.");
      return;
    }
    if (!smsCode.trim()) {
      setError("인증번호를 입력해 주세요.");
      return;
    }
    setVerifyingSms(true);
    try {
      const { error: verifyErr } = await supabase.auth.verifyOtp({
        phone,
        token: smsCode.trim(),
        type: "sms",
      });
      if (verifyErr) {
        setError(verifyErr.message || "인증번호 확인에 실패했습니다.");
        return;
      }
      setPhoneVerified(true);
      setMessage("휴대폰 인증이 완료되었습니다. 비밀번호를 저장해 주세요.");
    } catch {
      setError("휴대폰 인증 확인 중 오류가 발생했습니다.");
    } finally {
      setVerifyingSms(false);
    }
  };

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
    if (next === current) {
      setError(SAME_PASSWORD_MESSAGE);
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
    if (phone && !phoneVerified) {
      setError("보안을 위해 휴대폰 인증을 먼저 완료해 주세요.");
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
      resetForm();
      setOpen(false);
    } catch {
      setError("처리 중 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-4 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-bold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
            비밀번호 변경
          </h3>
          <p className="mt-1 text-[12px] leading-relaxed text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
            이메일·비밀번호로 가입한 계정만 변경할 수 있어요. Google 전용 로그인은 비밀번호가 없을 수 있습니다.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (open) {
              setOpen(false);
              resetForm();
              setError("");
              setMessage("");
              return;
            }
            void onOpen();
          }}
          className="rounded-full border border-reels-cyan/40 bg-reels-cyan/15 px-4 py-2 text-[13px] font-extrabold text-reels-cyan transition hover:bg-reels-cyan/25"
        >
          {open ? "창 닫기" : "비밀번호 변경"}
        </button>
      </div>

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

      {open ? (
        <form className="mt-4 space-y-3" onSubmit={onSubmit}>
          {phone ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white">
              <p className="text-[12px] font-semibold text-zinc-300 [html[data-theme='light']_&]:text-zinc-700">
                휴대폰 인증
              </p>
              <p className="mt-1 text-[12px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
                등록된 번호 {maskedPhone}로 인증 후 비밀번호를 변경할 수 있어요.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void sendSmsCode()}
                  disabled={sendingSms}
                  className="rounded-full border border-white/20 bg-white/[0.06] px-3 py-1.5 text-[12px] font-bold text-zinc-100 transition hover:bg-white/[0.1] disabled:opacity-50 [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:bg-zinc-100 [html[data-theme='light']_&]:text-zinc-900"
                >
                  {sendingSms ? "발송 중…" : smsSent ? "인증번호 재발송" : "인증번호 받기"}
                </button>
                <input
                  className={`${INPUT} max-w-[180px]`}
                  type="text"
                  inputMode="numeric"
                  placeholder="6자리 코드"
                  value={smsCode}
                  onChange={(e) => setSmsCode(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => void verifySmsCode()}
                  disabled={verifyingSms}
                  className="rounded-full border border-reels-cyan/40 bg-reels-cyan/15 px-3 py-1.5 text-[12px] font-extrabold text-reels-cyan transition hover:bg-reels-cyan/25 disabled:opacity-50"
                >
                  {verifyingSms ? "확인 중…" : phoneVerified ? "인증 완료" : "코드 확인"}
                </button>
              </div>
            </div>
          ) : (
            <p className="rounded-xl border border-amber-500/45 bg-amber-500/10 px-3 py-2 text-[12px] font-semibold text-amber-200 [html[data-theme='light']_&]:text-amber-900">
              계정에 등록된 휴대폰 번호가 없어 SMS 인증을 건너뜁니다. 번호를 연결하면 더 안전하게 변경할 수 있어요.
            </p>
          )}

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
      ) : null}
    </div>
  );
}
