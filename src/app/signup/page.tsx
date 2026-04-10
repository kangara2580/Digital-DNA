"use client";

import { Link2, ShieldCheck, UserPlus2 } from "lucide-react";
import { useMemo, useState } from "react";

type SignupForm = {
  email: string;
  password: string;
  passwordConfirm: string;
  nickname: string;
  phone: string;
  country: string;
  agreeAge: boolean;
  agreeTerms: boolean;
  agreePrivacy: boolean;
  agreeMarketing: boolean;
  instagramUrl: string;
  tiktokUrl: string;
};

const INITIAL_FORM: SignupForm = {
  email: "",
  password: "",
  passwordConfirm: "",
  nickname: "",
  phone: "",
  country: "KR",
  agreeAge: false,
  agreeTerms: false,
  agreePrivacy: false,
  agreeMarketing: false,
  instagramUrl: "",
  tiktokUrl: "",
};

const INPUT_CLS =
  "w-full rounded-xl border border-white/15 bg-white/[0.06] px-3.5 py-2.5 text-[14px] text-zinc-100 outline-none transition focus:border-reels-cyan/45 [html[data-theme='light']_&]:border-black/15 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-[#24163b]";

export default function SignupPage() {
  const [form, setForm] = useState<SignupForm>(INITIAL_FORM);
  const [message, setMessage] = useState("");

  const canSubmit = useMemo(() => {
    if (!form.email.trim()) return false;
    if (!form.password || form.password.length < 8) return false;
    if (form.password !== form.passwordConfirm) return false;
    if (!form.nickname.trim()) return false;
    if (!form.agreeAge || !form.agreeTerms || !form.agreePrivacy) return false;
    return true;
  }, [form]);

  const onChange = <K extends keyof SignupForm>(key: K, value: SignupForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    try {
      const payload = {
        email: form.email,
        nickname: form.nickname,
        phone: form.phone,
        country: form.country,
        social: {
          instagramUrl: form.instagramUrl,
          tiktokUrl: form.tiktokUrl,
        },
        savedAt: Date.now(),
      };
      window.localStorage.setItem("reels-market-signup-draft", JSON.stringify(payload));
      setMessage("회원가입 정보가 저장되었습니다. SNS 링크 연동도 함께 준비되었어요.");
    } catch {
      setMessage("저장 중 문제가 발생했어요. 다시 시도해 주세요.");
    }
  };

  return (
    <main className="mx-auto min-h-[70vh] max-w-3xl px-4 py-10 text-zinc-100 [html[data-theme='light']_&]:text-zinc-900 sm:px-6 sm:py-12">
      <div className="reels-glass-card rounded-2xl p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <UserPlus2 className="h-5 w-5 text-reels-cyan" />
          <h1 className="text-2xl font-extrabold tracking-tight [html[data-theme='light']_&]:text-zinc-900">회원가입</h1>
        </div>
        <p className="mt-2 text-[13px] text-zinc-400 [html[data-theme='light']_&]:text-[#6d5a88]">
          기본 계정 생성 후 인스타그램/틱톡 링크를 연결해 릴스 소스를 빠르게 가져올 수 있어요.
        </p>

        <form className="mt-6 space-y-6" onSubmit={onSubmit}>
          <section className="rounded-xl border border-white/10 bg-black/20 p-4 [html[data-theme='light']_&]:border-black/10 [html[data-theme='light']_&]:bg-white">
            <h2 className="text-[14px] font-bold">기본 정보</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <input className={INPUT_CLS} placeholder="이메일*" type="email" value={form.email} onChange={(e) => onChange("email", e.target.value)} />
              <input className={INPUT_CLS} placeholder="닉네임*" value={form.nickname} onChange={(e) => onChange("nickname", e.target.value)} />
              <input className={INPUT_CLS} placeholder="비밀번호* (8자 이상)" type="password" value={form.password} onChange={(e) => onChange("password", e.target.value)} />
              <input className={INPUT_CLS} placeholder="비밀번호 확인*" type="password" value={form.passwordConfirm} onChange={(e) => onChange("passwordConfirm", e.target.value)} />
              <input className={INPUT_CLS} placeholder="휴대폰 번호 (선택)" value={form.phone} onChange={(e) => onChange("phone", e.target.value)} />
              <select className={INPUT_CLS} value={form.country} onChange={(e) => onChange("country", e.target.value)}>
                <option value="KR">대한민국</option>
                <option value="US">United States</option>
                <option value="JP">Japan</option>
                <option value="ID">Indonesia</option>
              </select>
            </div>
          </section>

          <section className="rounded-xl border border-white/10 bg-black/20 p-4 [html[data-theme='light']_&]:border-black/10 [html[data-theme='light']_&]:bg-white">
            <h2 className="text-[14px] font-bold">SNS 연동 (릴스 소스 가져오기)</h2>
            <p className="mt-2 text-[12px] text-zinc-400 [html[data-theme='light']_&]:text-[#6d5a88]">
              공개 링크 기반 가져오기만 지원합니다. 비공개 계정/권한 없는 콘텐츠는 수집하지 않으며, 플랫폼 정책과 저작권을 준수해 주세요.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-white/10 p-3 [html[data-theme='light']_&]:border-black/10">
                <p className="inline-flex items-center gap-1 text-[13px] font-semibold">
                  <Link2 className="h-4 w-4" /> Instagram 링크
                </p>
                <input
                  className={`${INPUT_CLS} mt-2`}
                  placeholder="https://www.instagram.com/reel/..."
                  value={form.instagramUrl}
                  onChange={(e) => onChange("instagramUrl", e.target.value)}
                />
              </div>
              <div className="rounded-lg border border-white/10 p-3 [html[data-theme='light']_&]:border-black/10">
                <p className="inline-flex items-center gap-1 text-[13px] font-semibold">
                  <Link2 className="h-4 w-4" /> TikTok 링크
                </p>
                <input
                  className={`${INPUT_CLS} mt-2`}
                  placeholder="https://www.tiktok.com/@.../video/..."
                  value={form.tiktokUrl}
                  onChange={(e) => onChange("tiktokUrl", e.target.value)}
                />
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-white/10 bg-black/20 p-4 [html[data-theme='light']_&]:border-black/10 [html[data-theme='light']_&]:bg-white">
            <h2 className="inline-flex items-center gap-1 text-[14px] font-bold">
              <ShieldCheck className="h-4 w-4 text-reels-cyan" />
              약관 동의
            </h2>
            <div className="mt-3 space-y-2 text-[13px]">
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.agreeAge} onChange={(e) => onChange("agreeAge", e.target.checked)} /> 만 14세 이상입니다. (필수)</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.agreeTerms} onChange={(e) => onChange("agreeTerms", e.target.checked)} /> 서비스 이용약관 동의 (필수)</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.agreePrivacy} onChange={(e) => onChange("agreePrivacy", e.target.checked)} /> 개인정보 처리방침 동의 (필수)</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.agreeMarketing} onChange={(e) => onChange("agreeMarketing", e.target.checked)} /> 마케팅 정보 수신 동의 (선택)</label>
            </div>
          </section>

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-xl bg-reels-crimson px-4 py-3 text-[14px] font-extrabold text-white shadow-reels-crimson transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45"
          >
            회원가입 완료
          </button>
          {message ? (
            <p className="text-[13px] font-semibold text-reels-cyan">{message}</p>
          ) : null}
        </form>
      </div>
    </main>
  );
}
