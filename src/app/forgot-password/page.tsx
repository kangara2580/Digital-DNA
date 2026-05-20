"use client";

import Link from "next/link";
import { useState } from "react";
import {
  araAuthFlowWordmarkClassName,
  araWordmarkFontStyle,
} from "@/lib/araBrandTypography";
import { useTranslation } from "@/hooks/useTranslation";
import { localizeApiError } from "@/lib/i18n/localizeApiError";
import type { SiteLocale } from "@/lib/sitePreferences";

const INPUT =
  "w-full rounded-xl border border-white/20 bg-black/30 px-3.5 py-3 text-sm text-zinc-100 outline-none backdrop-blur-sm transition placeholder:text-zinc-500 focus:border-[#FF2D8D]/60 focus:ring-2 focus:ring-[#FF2D8D]/26";

export default function ForgotPasswordPage() {
  const { t, locale } = useTranslation();
  const loc = locale as SiteLocale;
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
    if (!phone.trim()) {
      setError(t("findId.errPhoneFirst"));
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
          phone: phone.trim(),
        }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok || !data.ok) {
        setError(localizeApiError(loc, data.message));
      }
    } catch {
      setError(t("findId.errSmsSendGeneric"));
    } finally {
      setSendingSms(false);
    }
  };

  const verifySmsCode = async () => {
    setError("");
    if (!phone.trim() || !smsCode.trim()) {
      setError(t("findId.errPhoneAndCode"));
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
          phone: phone.trim(),
          code: smsCode.trim(),
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        message?: string;
        proof?: string;
      };
      if (!res.ok || !data.ok || !data.proof) {
        setError(localizeApiError(loc, data.message));
        setPhoneVerified(false);
        setSmsProof("");
        return;
      }
      setPhoneVerified(true);
      setSmsProof(data.proof);
    } catch {
      setError(t("findId.errVerifyGeneric"));
    } finally {
      setVerifyingSms(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError(t("forgot.errEmailFormat"));
      return;
    }
    if (!phoneVerified || !smsProof) {
      setError(t("forgot.errPhoneVerifyFirst"));
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          countryCode,
          phone: phone.trim(),
          smsProof,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok || !data.ok) {
        setError(localizeApiError(loc, data.message) || t("forgot.errMailFail"));
        return;
      }
      setDone(true);
    } catch {
      setError(t("forgot.errRequestGeneric"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07080f] px-4 py-12 text-zinc-100 sm:px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,45,141,0.17),transparent_40%),radial-gradient(circle_at_80%_90%,rgba(59,130,246,0.16),transparent_45%),linear-gradient(180deg,#05060b_0%,#080913_100%)]" />
      <div className="relative mx-auto mt-10 w-full max-w-md rounded-2xl border border-white/15 bg-white/[0.04] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:mt-16 sm:p-8">
        <p className={araAuthFlowWordmarkClassName} style={araWordmarkFontStyle}>
          ARA
        </p>
        <h1 className="mt-3 text-2xl font-black tracking-tight text-white">{t("forgot.title")}</h1>
        <p className="mt-2 text-sm text-zinc-400">{t("forgot.lead")}</p>

        {error ? (
          <p className="mt-5 rounded-xl border border-reels-crimson/45 bg-reels-crimson/12 px-3 py-2 text-[13px] font-semibold text-[#F9ECF3]">
            {error}
          </p>
        ) : null}

        {done ? (
          <p className="mt-6 rounded-xl border border-emerald-500/45 bg-emerald-500/10 px-3 py-3 text-[13px] font-semibold text-emerald-200">
            {t("forgot.done")}
          </p>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="mb-1.5 block text-[12px] font-bold text-zinc-300">
                {t("forgot.email")}
              </label>
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
              <label className="mb-1.5 block text-[12px] font-bold text-zinc-300">
                {t("forgot.phoneVerify")}
              </label>
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
                  className="shrink-0 rounded-xl border border-reels-crimson/42 bg-reels-crimson/12 px-3 py-2 text-[12px] font-bold text-[#F6D5E8] transition hover:bg-reels-crimson/22 disabled:opacity-50"
                >
                  {sendingSms ? t("findId.sendingSms") : t("forgot.sendCode")}
                </button>
              </div>
              <div className="mt-2 flex gap-2">
                <input
                  className={INPUT}
                  type="text"
                  inputMode="numeric"
                  placeholder={t("forgot.codePh")}
                  value={smsCode}
                  onChange={(e) => setSmsCode(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => void verifySmsCode()}
                  disabled={verifyingSms}
                  className="shrink-0 rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-[12px] font-bold text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-50"
                >
                  {verifyingSms
                    ? t("findId.verifyingSms")
                    : phoneVerified
                      ? t("password.verified")
                      : t("findId.verifySms")}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-full bg-gradient-to-r from-[#FF2D8D] to-indigo-500 py-3 text-[15px] font-extrabold text-white shadow-[0_12px_30px_rgba(255,45,141,0.42)] transition hover:brightness-110 disabled:opacity-60"
            >
              {busy ? t("forgot.submitBusy") : t("forgot.submit")}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-zinc-500">
          <Link href="/login" className="font-semibold text-[#F07AB0] hover:underline">
            {t("forgot.backLogin")}
          </Link>
        </p>
      </div>
    </main>
  );
}
