"use client";

import { ShieldCheck, UserPlus2 } from "lucide-react";
import { useMemo, useState } from "react";
import { SocialLinkFields } from "@/components/SocialLinkFields";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

type SignupForm = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  passwordConfirm: string;
  nickname: string;
  phone: string;
  phoneCountryCode: string;
  country: string;
  timezone: string;
  agreeAge: boolean;
  agreeTerms: boolean;
  agreePrivacy: boolean;
  agreeMarketing: boolean;
  /** Instagram·TikTok·YouTube 등 공개 URL (여러 개) */
  socialLinks: string[];
};

const INITIAL_FORM: SignupForm = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  passwordConfirm: "",
  nickname: "",
  phone: "",
  phoneCountryCode: "+82",
  country: "KR",
  timezone: "Asia/Seoul",
  agreeAge: false,
  agreeTerms: false,
  agreePrivacy: false,
  agreeMarketing: false,
  socialLinks: [""],
};

const INPUT_CLS =
  "w-full rounded-xl border border-white/15 bg-white/[0.06] px-3.5 py-2.5 text-[14px] text-zinc-100 outline-none transition focus:border-reels-cyan/45 [html[data-theme='light']_&]:border-black/15 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-[#24163b]";

const COUNTRY_OPTIONS = [
  { code: "KR", label: "대한민국" },
  { code: "US", label: "United States" },
  { code: "CA", label: "Canada" },
  { code: "MX", label: "Mexico" },
  { code: "BR", label: "Brazil" },
  { code: "AR", label: "Argentina" },
  { code: "CL", label: "Chile" },
  { code: "PE", label: "Peru" },
  { code: "CO", label: "Colombia" },
  { code: "DE", label: "Germany" },
  { code: "FR", label: "France" },
  { code: "ES", label: "Spain" },
  { code: "IT", label: "Italy" },
  { code: "NL", label: "Netherlands" },
  { code: "SE", label: "Sweden" },
  { code: "NO", label: "Norway" },
  { code: "DK", label: "Denmark" },
  { code: "FI", label: "Finland" },
  { code: "PL", label: "Poland" },
  { code: "PT", label: "Portugal" },
  { code: "CH", label: "Switzerland" },
  { code: "AT", label: "Austria" },
  { code: "IE", label: "Ireland" },
  { code: "BE", label: "Belgium" },
  { code: "GB", label: "United Kingdom" },
  { code: "TR", label: "Turkiye" },
  { code: "SA", label: "Saudi Arabia" },
  { code: "AE", label: "United Arab Emirates" },
  { code: "EG", label: "Egypt" },
  { code: "ZA", label: "South Africa" },
  { code: "NG", label: "Nigeria" },
  { code: "IN", label: "India" },
  { code: "PK", label: "Pakistan" },
  { code: "BD", label: "Bangladesh" },
  { code: "LK", label: "Sri Lanka" },
  { code: "JP", label: "Japan" },
  { code: "CN", label: "China" },
  { code: "TW", label: "Taiwan" },
  { code: "HK", label: "Hong Kong" },
  { code: "TH", label: "Thailand" },
  { code: "VN", label: "Vietnam" },
  { code: "PH", label: "Philippines" },
  { code: "MY", label: "Malaysia" },
  { code: "AU", label: "Australia" },
  { code: "NZ", label: "New Zealand" },
  { code: "ID", label: "Indonesia" },
  { code: "SG", label: "Singapore" },
];

const TIMEZONE_OPTIONS = [
  { value: "Asia/Seoul", label: "Asia/Seoul (GMT+9)" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo (GMT+9)" },
  { value: "Asia/Jakarta", label: "Asia/Jakarta (GMT+7)" },
  { value: "Asia/Singapore", label: "Asia/Singapore (GMT+8)" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles (GMT-8/-7)" },
  { value: "Europe/London", label: "Europe/London (GMT+0/+1)" },
];

export default function SignupPage() {
  const [form, setForm] = useState<SignupForm>(INITIAL_FORM);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingNickname, setIsCheckingNickname] = useState(false);
  const [nicknameCheckedValue, setNicknameCheckedValue] = useState("");
  const [nicknameCheckedAvailable, setNicknameCheckedAvailable] = useState(false);
  const [nicknameCheckMessage, setNicknameCheckMessage] = useState("");
  const [isSendingVerifyEmail, setIsSendingVerifyEmail] = useState(false);
  const [verifyEmailMessage, setVerifyEmailMessage] = useState("");
  const nameMissing = useMemo(
    () => !form.firstName.trim() || !form.lastName.trim(),
    [form.firstName, form.lastName],
  );
  const normalizedEmail = useMemo(() => form.email.trim().toLowerCase(), [form.email]);
  const emailMissing = useMemo(() => !normalizedEmail, [normalizedEmail]);
  const requiredIdentityMessage = useMemo(() => {
    if (nameMissing && emailMissing) return "이름과 이메일은 필수 입력 사항입니다.";
    if (nameMissing) return "이름은 필수 입력 사항입니다.";
    if (emailMissing) return "이메일은 필수 입력 사항입니다.";
    return "";
  }, [emailMissing, nameMissing]);
  const emailError = useMemo(() => {
    if (!normalizedEmail) return "";
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(normalizedEmail)) return "올바른 이메일 형식을 입력해 주세요.";
    return "";
  }, [normalizedEmail]);
  const passwordError = useMemo(() => {
    if (!form.password) return "비밀번호는 필수 입력 사항입니다.";
    if (form.password.length < 8) return "비밀번호는 8자 이상이어야 합니다.";
    return "";
  }, [form.password]);
  const passwordConfirmError = useMemo(() => {
    if (!form.passwordConfirm) return "비밀번호 확인을 입력해 주세요.";
    if (form.password !== form.passwordConfirm)
      return "비밀번호와 비밀번호 확인이 일치하지 않습니다.";
    return "";
  }, [form.password, form.passwordConfirm]);

  const normalizedPhone = useMemo(
    () => form.phone.replace(/[\s-]/g, ""),
    [form.phone],
  );

  const phoneError = useMemo(() => {
    if (!normalizedPhone) return "휴대폰 번호는 필수 입력 사항입니다";
    if (!/^\d{7,15}$/.test(normalizedPhone))
      return "휴대폰 번호는 필수 입력 사항입니다";
    return "";
  }, [normalizedPhone]);

  const socialLinkErrors = useMemo(() => {
    const toHttpUrl = (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) return "";
      return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    };

    return form.socialLinks.map((link) => {
      const trimmed = link.trim();
      if (!trimmed) return "";
      try {
        const parsed = new URL(toHttpUrl(trimmed));
        const validProtocol =
          parsed.protocol === "http:" || parsed.protocol === "https:";
        if (!validProtocol || !parsed.hostname.includes(".")) {
          return "올바른 링크 주소를 입력해주세요";
        }
        return "";
      } catch {
        return "올바른 링크 주소를 입력해주세요";
      }
    });
  }, [form.socialLinks]);

  const hasInvalidSocialLink = socialLinkErrors.some(Boolean);
  const nicknameChangedAfterCheck =
    nicknameCheckedValue !== form.nickname.trim().toLowerCase();
  const nicknameNotVerified =
    !form.nickname.trim() ||
    !nicknameCheckedAvailable ||
    nicknameChangedAfterCheck;

  const canSubmit = useMemo(() => {
    if (nameMissing) return false;
    if (emailError) return false;
    if (emailMissing) return false;
    if (passwordError) return false;
    if (passwordConfirmError) return false;
    if (!form.nickname.trim()) return false;
    if (nicknameNotVerified) return false;
    if (phoneError) return false;
    if (hasInvalidSocialLink) return false;
    if (!form.agreeAge || !form.agreeTerms || !form.agreePrivacy) return false;
    return true;
  }, [
    emailError,
    emailMissing,
    form,
    hasInvalidSocialLink,
    nameMissing,
    nicknameNotVerified,
    passwordConfirmError,
    passwordError,
    phoneError,
  ]);

  const onChange = <K extends keyof SignupForm>(key: K, value: SignupForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const checkNickname = async () => {
    const nickname = form.nickname.trim();
    if (!nickname) {
      setNicknameCheckMessage("닉네임을 먼저 입력해 주세요.");
      setNicknameCheckedAvailable(false);
      return;
    }
    setIsCheckingNickname(true);
    setNicknameCheckMessage("");
    try {
      const res = await fetch("/api/signup/nickname", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname,
          intent: "check",
        }),
      });
      const data = (await res.json()) as { ok?: boolean; available?: boolean };
      if (!res.ok || !data.ok) {
        setNicknameCheckMessage("중복 확인에 실패했습니다. 다시 시도해 주세요.");
        setNicknameCheckedAvailable(false);
        return;
      }
      setNicknameCheckedValue(nickname.toLowerCase());
      setNicknameCheckedAvailable(Boolean(data.available));
      setNicknameCheckMessage(
        data.available
          ? "사용 가능한 닉네임입니다."
          : "이미 사용 중인 닉네임입니다. 다른 닉네임을 입력해 주세요.",
      );
    } catch {
      setNicknameCheckMessage("중복 확인에 실패했습니다. 다시 시도해 주세요.");
      setNicknameCheckedAvailable(false);
    } finally {
      setIsCheckingNickname(false);
    }
  };

  const sendVerificationEmail = async () => {
    setVerifyEmailMessage("");
    if (emailMissing) {
      setVerifyEmailMessage("이메일은 필수 입력 사항입니다.");
      return;
    }
    if (emailError) {
      setVerifyEmailMessage("올바른 이메일 형식을 먼저 입력해 주세요.");
      return;
    }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setVerifyEmailMessage(
        "Supabase 환경변수가 없어 인증 메일을 보낼 수 없습니다.",
      );
      return;
    }

    setIsSendingVerifyEmail(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: normalizedEmail,
        options: {
          emailRedirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/signup?verified=1`
              : undefined,
        },
      });

      if (error) {
        setVerifyEmailMessage(
          "인증 메일 발송에 실패했어요. 먼저 회원가입을 완료했는지 확인해 주세요.",
        );
        return;
      }

      setVerifyEmailMessage(
        "인증 메일을 보냈어요. 받은 편지함(스팸함 포함)을 확인해 주세요.",
      );
    } catch {
      setVerifyEmailMessage("인증 메일 발송 중 오류가 발생했어요.");
    } finally {
      setIsSendingVerifyEmail(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setMessage("");
    setIsSubmitting(true);

    try {
      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: normalizedEmail,
        nickname: form.nickname,
        phone: `${form.phoneCountryCode}${normalizedPhone}`,
        phoneCountryCode: form.phoneCountryCode,
        country: form.country,
        timezone: form.timezone,
        social: {
          links: form.socialLinks.map((s) => s.trim()).filter(Boolean),
        },
        savedAt: Date.now(),
      };

      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        setMessage(
          "Supabase 환경변수(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)가 없어 회원가입을 진행할 수 없습니다.",
        );
        return;
      }

      const reserveRes = await fetch("/api/signup/nickname", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: form.nickname,
          intent: "reserve",
          email: normalizedEmail,
        }),
      });
      const reserveData = (await reserveRes.json()) as {
        ok?: boolean;
        available?: boolean;
      };
      if (!reserveRes.ok || !reserveData.ok || !reserveData.available) {
        setMessage("닉네임이 이미 사용 중입니다. 다른 닉네임으로 다시 확인해 주세요.");
        setNicknameCheckedAvailable(false);
        setNicknameCheckMessage(
          "이미 사용 중인 닉네임입니다. 다른 닉네임을 입력해 주세요.",
        );
        return;
      }

      const { error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: form.password,
        options: {
          emailRedirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/signup?verified=1`
              : undefined,
          data: {
            first_name: form.firstName.trim(),
            last_name: form.lastName.trim(),
            nickname: form.nickname.trim(),
            phone: `${form.phoneCountryCode}${normalizedPhone}`,
            phone_country_code: form.phoneCountryCode,
            country: form.country,
            timezone: form.timezone,
            social_links: payload.social.links,
          },
        },
      });

      if (error) {
        await fetch("/api/signup/nickname", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nickname: form.nickname,
            intent: "release",
            email: normalizedEmail,
          }),
        }).catch(() => {
          /* noop */
        });
        setMessage(error.message || "회원가입 중 문제가 발생했어요. 다시 시도해 주세요.");
        return;
      }

      window.localStorage.setItem("reels-market-signup-draft", JSON.stringify(payload));
      setMessage(
        "회원가입 요청이 완료되었습니다. 입력하신 이메일로 인증 메일을 보냈어요. 메일의 인증 링크를 눌러 계정을 활성화해 주세요.",
      );
    } catch {
      setMessage("저장 중 문제가 발생했어요. 다시 시도해 주세요.");
    } finally {
      setIsSubmitting(false);
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
          글로벌 크리에이터 계정을 위한 기본 정보(이름·국가·시간대)를 먼저 설정해 주세요.
        </p>

        <form className="mt-6 space-y-6" onSubmit={onSubmit}>
          <section className="rounded-xl border border-white/10 bg-black/20 p-4 [html[data-theme='light']_&]:border-black/10 [html[data-theme='light']_&]:bg-white">
            <h2 className="text-[14px] font-bold">기본 정보</h2>
            {requiredIdentityMessage ? (
              <p className="mt-2 rounded-lg border border-rose-500/45 bg-rose-500/10 px-3 py-2 text-[12px] font-extrabold text-rose-300 [html[data-theme='light']_&]:text-rose-700">
                {requiredIdentityMessage}
              </p>
            ) : null}
            <div className="mt-3 space-y-3">
              <input className={INPUT_CLS} placeholder="First name*" value={form.firstName} onChange={(e) => onChange("firstName", e.target.value)} autoComplete="given-name" />
              <input className={INPUT_CLS} placeholder="Last name*" value={form.lastName} onChange={(e) => onChange("lastName", e.target.value)} autoComplete="family-name" />
              <div>
                <div className="flex gap-2">
                  <input
                    className={INPUT_CLS}
                    placeholder="이메일*"
                    type="email"
                    value={form.email}
                    onChange={(e) => onChange("email", e.target.value)}
                    autoComplete="email"
                  />
                  <button
                    type="button"
                    onClick={sendVerificationEmail}
                    disabled={isSendingVerifyEmail}
                    className="shrink-0 rounded-xl border border-reels-cyan/40 bg-reels-cyan/10 px-3 py-2 text-[12px] font-bold text-reels-cyan transition hover:bg-reels-cyan/20 disabled:opacity-50"
                  >
                    {isSendingVerifyEmail ? "발송 중..." : "인증 메일 보내기"}
                  </button>
                </div>
                {emailError ? (
                  <p className="mt-1.5 text-[12px] font-semibold text-rose-400 [html[data-theme='light']_&]:text-rose-600">
                    {emailError}
                  </p>
                ) : null}
                {verifyEmailMessage ? (
                  <p
                    className={`mt-1.5 text-[12px] font-semibold ${
                      verifyEmailMessage.includes("보냈어요")
                        ? "text-emerald-400 [html[data-theme='light']_&]:text-emerald-700"
                        : "text-rose-400 [html[data-theme='light']_&]:text-rose-600"
                    }`}
                  >
                    {verifyEmailMessage}
                  </p>
                ) : null}
              </div>
              <div>
                <div className="flex gap-2">
                  <input
                    className={INPUT_CLS}
                    placeholder="닉네임*"
                    value={form.nickname}
                    onChange={(e) => {
                      onChange("nickname", e.target.value);
                      setNicknameCheckedAvailable(false);
                    }}
                  />
                  <button
                    type="button"
                    onClick={checkNickname}
                    disabled={isCheckingNickname}
                    className="shrink-0 rounded-xl border border-reels-cyan/40 bg-reels-cyan/10 px-3 py-2 text-[12px] font-bold text-reels-cyan transition hover:bg-reels-cyan/20 disabled:opacity-50"
                  >
                    {isCheckingNickname ? "확인 중..." : "중복확인"}
                  </button>
                </div>
                {nicknameCheckMessage ? (
                  <p
                    className={`mt-1.5 text-[12px] font-semibold ${
                      nicknameCheckedAvailable && !nicknameChangedAfterCheck
                        ? "text-emerald-400 [html[data-theme='light']_&]:text-emerald-700"
                        : "text-rose-400 [html[data-theme='light']_&]:text-rose-600"
                    }`}
                  >
                    {nicknameCheckMessage}
                  </p>
                ) : null}
              </div>
              <div>
                <input
                  className={INPUT_CLS}
                  placeholder="비밀번호* (8자 이상)"
                  type="password"
                  value={form.password}
                  onChange={(e) => onChange("password", e.target.value)}
                  autoComplete="new-password"
                />
                {passwordError ? (
                  <p className="mt-1.5 text-[12px] font-semibold text-rose-400 [html[data-theme='light']_&]:text-rose-600">
                    {passwordError}
                  </p>
                ) : null}
              </div>
              <div>
                <input
                  className={INPUT_CLS}
                  placeholder="비밀번호 확인*"
                  type="password"
                  value={form.passwordConfirm}
                  onChange={(e) => onChange("passwordConfirm", e.target.value)}
                  autoComplete="new-password"
                />
                {passwordConfirmError ? (
                  <p className="mt-1.5 text-[12px] font-semibold text-rose-400 [html[data-theme='light']_&]:text-rose-600">
                    {passwordConfirmError}
                  </p>
                ) : null}
              </div>
              <div className="sm:col-span-2">
                <div className="space-y-2">
                  <select
                    className={INPUT_CLS}
                    value={form.phoneCountryCode}
                    onChange={(e) => onChange("phoneCountryCode", e.target.value)}
                  >
                    <option value="+82">+82 (KR)</option>
                    <option value="+1">+1 (US/CA)</option>
                    <option value="+81">+81 (JP)</option>
                    <option value="+62">+62 (ID)</option>
                    <option value="+65">+65 (SG)</option>
                    <option value="+44">+44 (UK)</option>
                  </select>
                  <input
                    className={INPUT_CLS}
                    placeholder="휴대폰 번호* (숫자만 입력)"
                    value={form.phone}
                    onChange={(e) => onChange("phone", e.target.value)}
                    inputMode="numeric"
                    autoComplete="tel-national"
                  />
                </div>
                {phoneError ? (
                  <p className="mt-1.5 text-[12px] font-semibold text-rose-400 [html[data-theme='light']_&]:text-rose-600">
                    {phoneError}
                  </p>
                ) : null}
              </div>
              <select className={INPUT_CLS} value={form.country} onChange={(e) => onChange("country", e.target.value)}>
                {COUNTRY_OPTIONS.map((opt) => (
                  <option key={opt.code} value={opt.code}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <select className={INPUT_CLS} value={form.timezone} onChange={(e) => onChange("timezone", e.target.value)}>
                {TIMEZONE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section className="rounded-xl border border-white/10 bg-black/20 p-4 [html[data-theme='light']_&]:border-black/10 [html[data-theme='light']_&]:bg-white">
            <h2 className="text-[14px] font-bold">SNS 연동 (릴스 소스 가져오기)</h2>
            <p className="mt-2 rounded-lg border border-reels-cyan/35 bg-reels-cyan/10 px-3 py-2 text-[12px] font-semibold text-reels-cyan">
              본인의 인스타그램이나 유튜브 링크를 연결하면 판매 신뢰도가 높아집니다!
            </p>
            <p className="mt-2 text-[12px] text-zinc-400 [html[data-theme='light']_&]:text-[#6d5a88]">
              공개 링크 기반 가져오기만 지원합니다. 유튜브 숏츠·일반 영상, 인스타 릴스, 틱톡 등 원하는 만큼 추가하세요. 비공개·권한 없는 콘텐츠는 수집하지 않으며, 플랫폼 정책과 저작권을 준수해 주세요.
            </p>
            <div className="mt-3">
              <SocialLinkFields
                links={form.socialLinks}
                onChange={(socialLinks) => setForm((prev) => ({ ...prev, socialLinks }))}
                errors={socialLinkErrors}
                placeholder="ex. instagram.com/yourid"
              />
            </div>
            {hasInvalidSocialLink ? (
              <p className="mt-3 rounded-lg border border-rose-500/45 bg-rose-500/10 px-3 py-2 text-[12px] font-extrabold text-rose-300 [html[data-theme='light']_&]:text-rose-700">
                올바른 링크 주소를 입력해주세요
              </p>
            ) : null}
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
            disabled={!canSubmit || isSubmitting}
            className="w-full rounded-xl bg-reels-crimson px-4 py-3 text-[14px] font-extrabold text-white shadow-reels-crimson transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {isSubmitting ? "회원가입 처리 중..." : "회원가입 완료"}
          </button>
          {message ? (
            <p className="text-[13px] font-semibold text-reels-cyan">{message}</p>
          ) : null}
        </form>
      </div>
    </main>
  );
}
