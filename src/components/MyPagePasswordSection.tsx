"use client";

import { useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { useTranslation } from "@/hooks/useTranslation";

const INPUT =
  "w-full rounded-xl border border-white/15 bg-white/[0.06] px-3.5 py-2.5 text-[14px] text-zinc-100 outline-none transition focus:border-reels-cyan/45 [html[data-theme='light']_&]:border-black/15 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-[#24163b]";

function mapPasswordError(message: string, t: (key: string) => string): string {
  const normalized = message.toLowerCase();
  if (normalized.includes("current password required when setting new password")) {
    return t("password.err.currentRequired");
  }
  if (normalized.includes("password should contain at least one character of each")) {
    return t("password.policy");
  }
  if (normalized.includes("new password should be different from the old password")) {
    return t("password.err.differentFromOld");
  }
  if (normalized.includes("password should be at least")) {
    return t("password.err.tooShort");
  }
  if (normalized.includes("password") && normalized.includes("weak")) {
    return t("password.err.weak");
  }
  if (normalized.includes("for security purposes") && normalized.includes("password")) {
    return t("password.err.rateLimited");
  }
  if (normalized.includes("password")) {
    return t("password.err.generic");
  }
  return message;
}

function maskPhone(phone: string): string {
  if (phone.length <= 4) return phone;
  return `${phone.slice(0, 4)}****${phone.slice(-3)}`;
}

export function MyPagePasswordSection() {
  const { t } = useTranslation();
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
      setError(t("password.supabaseMissing"));
      return;
    }
    if (!phone) {
      setError(t("password.noPhoneForSms"));
      return;
    }
    setSendingSms(true);
    try {
      const { error: smsErr } = await supabase.auth.signInWithOtp({
        phone,
        options: { shouldCreateUser: false },
      });
      if (smsErr) {
        setError(smsErr.message || t("password.smsSendFail"));
        return;
      }
      setSmsSent(true);
      setMessage(t("password.smsSent"));
    } catch {
      setError(t("password.smsRequestError"));
    } finally {
      setSendingSms(false);
    }
  };

  const verifySmsCode = async () => {
    setError("");
    setMessage("");
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError(t("password.supabaseMissing"));
      return;
    }
    if (!phone) {
      setError(t("password.noPhoneRegistered"));
      return;
    }
    if (!smsCode.trim()) {
      setError(t("password.enterCode"));
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
        setError(verifyErr.message || t("password.verifyFail"));
        return;
      }
      setPhoneVerified(true);
      setMessage(t("password.smsVerified"));
    } catch {
      setError(t("password.verifyError"));
    } finally {
      setVerifyingSms(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (next.length < 8) {
      setError(t("password.newTooShort"));
      return;
    }
    if (next !== confirm) {
      setError(t("password.mismatch"));
      return;
    }
    if (next === current) {
      setError(t("password.sameAsOld"));
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError(t("password.supabaseMissing"));
      return;
    }

    if (!current.trim()) {
      setError(t("password.enterCurrent"));
      return;
    }
    if (phone && !phoneVerified) {
      setError(t("password.verifySmsFirst"));
      return;
    }

    setBusy(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      const email = u.user?.email;
      if (!email) {
        setError(t("password.noEmail"));
        return;
      }
      const { error: reErr } = await supabase.auth.signInWithPassword({
        email,
        password: current,
      });
      if (reErr) {
        setError(t("password.wrongCurrent"));
        return;
      }

      // Supabase Auth에서 "Secure password change"가 켜져 있으면 updateUser에 current_password를 함께 보내야 합니다.
      // (로그인만으로는 이 요구를 충족하지 못해 "Current password required…" 오류가 날 수 있음)
      const { error: upErr } = await supabase.auth.updateUser({
        password: next,
        current_password: current,
      });
      if (upErr) {
        setError(upErr.message ? mapPasswordError(upErr.message, t) : t("password.changeFail"));
        return;
      }
      setMessage(t("password.changed"));
      resetForm();
      setOpen(false);
    } catch {
      setError(t("password.processError"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-4 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-bold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
            {t("password.sectionTitle")}
          </h3>
          <p className="mt-1 text-[12px] leading-relaxed text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
            {t("password.sectionLead")}
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
          {open ? t("password.closePanel") : t("password.openPanel")}
        </button>
      </div>

      {error ? (
        <p className="mt-3 rounded-lg border border-reels-crimson/45 bg-reels-crimson/12 px-3 py-2 text-[12px] font-semibold text-[#F3C4D9] [html[data-theme='light']_&]:text-reels-crimson">          {error}
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
                {t("password.phoneVerifyTitle")}
              </p>
              <p className="mt-1 text-[12px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
                {t("password.phoneVerifyLead", { phone: maskedPhone })}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void sendSmsCode()}
                  disabled={sendingSms}
                  className="rounded-full border border-white/20 bg-white/[0.06] px-3 py-1.5 text-[12px] font-bold text-zinc-100 transition hover:bg-white/[0.1] disabled:opacity-50 [html[data-theme='light']_&]:border-zinc-300 [html[data-theme='light']_&]:bg-zinc-100 [html[data-theme='light']_&]:text-zinc-900"
                >
                  {sendingSms ? t("password.sending") : smsSent ? t("password.resendCode") : t("password.getCode")}
                </button>
                <input
                  className={`${INPUT} max-w-[180px]`}
                  type="text"
                  inputMode="numeric"
                  placeholder={t("password.codePlaceholder")}
                  value={smsCode}
                  onChange={(e) => setSmsCode(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => void verifySmsCode()}
                  disabled={verifyingSms}
                  className="rounded-full border border-reels-cyan/40 bg-reels-cyan/15 px-3 py-1.5 text-[12px] font-extrabold text-reels-cyan transition hover:bg-reels-cyan/25 disabled:opacity-50"
                >
                  {verifyingSms ? t("password.verifying") : phoneVerified ? t("password.verified") : t("password.verifyCode")}
                </button>
              </div>
            </div>
          ) : (
            <p className="rounded-xl border border-amber-500/45 bg-amber-500/10 px-3 py-2 text-[12px] font-semibold text-amber-200 [html[data-theme='light']_&]:text-amber-900">
              {t("password.skipSmsHint")}
            </p>
          )}

        <div>
          <label className="mb-1 block text-[12px] font-bold text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
            {t("password.currentLabel")}
          </label>
          <input
            className={INPUT}
            type="password"
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            placeholder={t("password.currentPlaceholder")}
          />
        </div>
        <div>
          <label className="mb-1 block text-[12px] font-bold text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
            {t("password.newLabel")}
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
            {t("password.confirmLabel")}
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
          {busy ? t("password.saveBusy") : t("password.save")}
        </button>
        </form>
      ) : null}
    </div>
  );
}
