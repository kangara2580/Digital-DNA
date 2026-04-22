"use client";

import { ShieldCheck, UserPlus2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { GoogleOAuthButton } from "@/components/GoogleOAuthButton";
import { ProfileAvatarPicker } from "@/components/ProfileAvatarPicker";
import { SocialLinkFields } from "@/components/SocialLinkFields";
import { DEFAULT_BEST_REVIEW_AVATAR_SEED } from "@/data/reelsAvatarPresets";
import type { ProfileAvatar } from "@/lib/profileAvatarStorage";
import { readProfileAvatar, writeProfileAvatar } from "@/lib/profileAvatarStorage";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { upsertUserProfile } from "@/lib/supabaseProfiles";

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
  agreeAge: false,
  agreeTerms: false,
  agreePrivacy: false,
  agreeMarketing: false,
  socialLinks: [""],
};

const INPUT_CLS =
  "w-full rounded-xl border border-white/20 bg-black/30 px-3.5 py-2.5 text-[14px] text-zinc-100 outline-none backdrop-blur-sm transition placeholder:text-zinc-500 focus:border-fuchsia-400/70 focus:ring-2 focus:ring-fuchsia-500/30";

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

function SignupLoginLink() {
  const params = useSearchParams();
  const redirect = params.get("redirect") ?? "/";
  return (
    <p className="mt-3 text-[13px] text-zinc-400 [html[data-theme='light']_&]:text-[#6d5a88]">
      이미 계정이 있나요?{" "}
      <Link
        href={`/login?redirect=${encodeURIComponent(redirect)}`}
        className="font-bold text-reels-cyan hover:underline"
      >
        로그인
      </Link>
    </p>
  );
}

function SignupGoogleSection() {
  const params = useSearchParams();
  const redirect = params.get("redirect");
  return (
    <div className="mt-5 space-y-3">
      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden>
          <span className="w-full border-t border-white/15 [html[data-theme='light']_&]:border-zinc-300" />
        </div>
        <div className="relative flex justify-center text-[11px] font-semibold uppercase tracking-wider">
          <span className="bg-[#07080f] px-3 text-zinc-500 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-500">
            또는 Google로 가입·로그인
          </span>
        </div>
      </div>
      <GoogleOAuthButton nextPath={redirect} label="Google 계정으로 계속하기" />
      <p className="text-center text-[11px] leading-relaxed text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
        Google로 처음 들어오면 계정이 만들어집니다. 이메일·이름은 Google에 등록된 정보가
        인증에 사용됩니다.{" "}
        <Link href="/privacy" className="font-semibold text-reels-cyan hover:underline">
          개인정보처리방침
        </Link>
      </p>
    </div>
  );
}

const SIGNUP_DRAFT_KEY = "reels-market-signup-draft";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState<SignupForm>(INITIAL_FORM);
  const [profileAvatar, setProfileAvatar] = useState<ProfileAvatar | null>({
    kind: "preset",
    seed: DEFAULT_BEST_REVIEW_AVATAR_SEED,
  });
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingNickname, setIsCheckingNickname] = useState(false);
  const [nicknameCheckedValue, setNicknameCheckedValue] = useState("");
  const [nicknameCheckedAvailable, setNicknameCheckedAvailable] = useState(false);
  const [nicknameCheckMessage, setNicknameCheckMessage] = useState("");
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailCheckedValue, setEmailCheckedValue] = useState("");
  const [emailCheckedAvailable, setEmailCheckedAvailable] = useState(false);
  const [emailCheckMessage, setEmailCheckMessage] = useState("");
  const [isSendingPhoneCode, setIsSendingPhoneCode] = useState(false);
  const [phoneCodeInput, setPhoneCodeInput] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [phoneVerificationProof, setPhoneVerificationProof] = useState("");
  const [phoneVerifyMessage, setPhoneVerifyMessage] = useState("");
  const [phoneInputUnlocked, setPhoneInputUnlocked] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  useEffect(() => {
    const saved = readProfileAvatar();
    if (saved) setProfileAvatar(saved);
  }, []);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SIGNUP_DRAFT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        form?: Partial<SignupForm>;
        phoneVerified?: boolean;
      };
      if (parsed.form) {
        const safeDraft = { ...parsed.form };
        // 민감값/인증값은 자동 복원하지 않아 예기치 않은 자동 입력을 방지합니다.
        delete safeDraft.password;
        delete safeDraft.passwordConfirm;
        delete safeDraft.phone;
        delete safeDraft.phoneCountryCode;
        setForm((prev) => ({ ...prev, ...safeDraft }));
      }
      // SMS 인증 토큰은 서버 발급 단기값이므로 새 세션에서는 재인증을 요구합니다.
      setPhoneVerified(false);
    } catch {
      /* noop */
    }
  }, []);

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
    if (!phoneVerified) return false;
    if (!phoneVerificationProof) return false;
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
    phoneVerificationProof,
    phoneVerified,
  ]);

  const onChange = <K extends keyof SignupForm>(key: K, value: SignupForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    // 입력이 바뀔 때마다 임시저장해서 새로고침/재접속 시 복원합니다.
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(
          SIGNUP_DRAFT_KEY,
          JSON.stringify({
            form: {
              ...form,
              // 비밀번호/휴대폰 값은 로컬 자동복원에서 제외합니다.
              password: "",
              passwordConfirm: "",
              phone: "",
              phoneCountryCode: INITIAL_FORM.phoneCountryCode,
            },
            phoneVerified,
            savedAt: Date.now(),
          }),
        );
      } catch {
        /* noop — 자동 저장 실패는 조용히 무시 */
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [form, phoneVerified]);

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

  const checkEmailDuplicate = async () => {
    setEmailCheckMessage("");
    if (emailMissing) {
      setEmailCheckMessage("이메일은 필수 입력 사항입니다.");
      setEmailCheckedAvailable(false);
      return;
    }
    if (emailError) {
      setEmailCheckMessage("올바른 이메일 형식을 먼저 입력해 주세요.");
      setEmailCheckedAvailable(false);
      return;
    }

    setIsCheckingEmail(true);
    try {
      const res = await fetch("/api/signup/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        available?: boolean;
        message?: string;
      };
      if (!res.ok || !data.ok) {
        setEmailCheckMessage(data.message || "이메일 중복 확인에 실패했습니다.");
        setEmailCheckedAvailable(false);
        return;
      }
      setEmailCheckedValue(normalizedEmail);
      setEmailCheckedAvailable(Boolean(data.available));
      setEmailCheckMessage(
        data.available
          ? "사용 가능한 이메일입니다."
          : "이미 가입된 이메일입니다. 다른 이메일을 사용해 주세요.",
      );
    } catch {
      setEmailCheckMessage("이메일 중복 확인 중 오류가 발생했습니다.");
      setEmailCheckedAvailable(false);
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const sendPhoneVerificationCode = async () => {
    setPhoneVerifyMessage("");
    if (phoneError) {
      setPhoneVerifyMessage("휴대폰 번호를 올바르게 입력한 뒤 인증해 주세요.");
      return;
    }

    setIsSendingPhoneCode(true);
    try {
      const res = await fetch("/api/auth/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context: "signup",
          countryCode: form.phoneCountryCode,
          phone: normalizedPhone,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok || !data.ok) {
        setPhoneVerifyMessage(data.message || "인증번호 발송에 실패했습니다.");
        return;
      }
      setPhoneCodeInput("");
      setPhoneVerified(false);
      setPhoneVerificationProof("");
      setPhoneVerifyMessage("SMS 인증번호를 발송했습니다. 수신 문자를 확인해 주세요.");
    } finally {
      setIsSendingPhoneCode(false);
    }
  };

  const verifyPhoneCode = async () => {
    if (!phoneCodeInput.trim()) {
      setPhoneVerifyMessage("먼저 인증번호 발송 버튼을 눌러 주세요.");
      return;
    }
    try {
      const res = await fetch("/api/auth/sms/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context: "signup",
          countryCode: form.phoneCountryCode,
          phone: normalizedPhone,
          code: phoneCodeInput.trim(),
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        message?: string;
        proof?: string;
      };
      if (!res.ok || !data.ok || !data.proof) {
        setPhoneVerifyMessage(data.message || "인증번호가 일치하지 않습니다. 다시 확인해 주세요.");
        setPhoneVerified(false);
        return;
      }
      setPhoneVerificationProof(data.proof);
      setPhoneVerified(true);
      setPhoneVerifyMessage("휴대폰 인증이 완료되었습니다.");
    } catch {
      setPhoneVerified(false);
      setPhoneVerifyMessage("휴대폰 인증 확인 중 오류가 발생했습니다.");
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
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

      const av =
        profileAvatar ??
        ({ kind: "preset" as const, seed: DEFAULT_BEST_REVIEW_AVATAR_SEED });

      const { data: signUpData, error } = await supabase.auth.signUp({
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
            social_links: payload.social.links,
            avatar_kind: av.kind,
            avatar_seed: av.kind === "preset" ? av.seed : null,
            avatar_custom:
              av.kind === "custom" ? JSON.stringify(av.parts) : null,
          },
        },
      });

      const emailAlreadyExists =
        !error &&
        Boolean(signUpData.user) &&
        Array.isArray(signUpData.user?.identities) &&
        signUpData.user!.identities.length === 0;

      if (emailAlreadyExists) {
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
        setMessage(
          "이미 가입된 이메일입니다. 로그인하거나 비밀번호 찾기에서 계정을 복구해 주세요.",
        );
        return;
      }

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

      writeProfileAvatar(
        profileAvatar ??
          ({ kind: "preset", seed: DEFAULT_BEST_REVIEW_AVATAR_SEED } satisfies ProfileAvatar),
      );

      const profilePayload = {
        email: normalizedEmail,
        nickname: form.nickname.trim() || null,
        first_name: form.firstName.trim() || null,
        last_name: form.lastName.trim() || null,
        phone: `${form.phoneCountryCode}${normalizedPhone}`,
        phone_country_code: form.phoneCountryCode,
        country: form.country,
        avatar_kind: av.kind,
        avatar_seed: av.kind === "preset" ? av.seed : null,
        avatar_custom: av.kind === "custom" ? JSON.stringify(av.parts) : null,
      };

      let userId = signUpData.user?.id ?? null;
      let session = signUpData.session;

      // 이메일 확인 ON 등으로 signUp 직후 세션이 없으면 같은 자격으로 로그인 시도
      if (!session && userId) {
        const { data: signInData, error: signInErr } =
          await supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password: form.password,
          });
        if (!signInErr && signInData.session) {
          session = signInData.session;
          userId = signInData.user?.id ?? userId;
        }
      }

      window.localStorage.removeItem(SIGNUP_DRAFT_KEY);

      if (session && userId) {
        await upsertUserProfile(supabase, userId, profilePayload);
        setMessage("회원가입이 완료되었습니다. 홈으로 이동합니다…");
        router.replace("/");
        router.refresh();
        return;
      }

      setMessage(
        "회원가입은 완료되었습니다. 이메일 인증이 필요한 경우 메일 확인 후 로그인해 주세요.",
      );
      router.replace(`/login?registered=1&email=${encodeURIComponent(normalizedEmail)}`);
    } catch {
      setMessage("저장 중 문제가 발생했어요. 다시 시도해 주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07080f] px-4 py-10 text-zinc-100 sm:px-6 sm:py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(236,72,153,0.18),transparent_40%),radial-gradient(circle_at_85%_90%,rgba(59,130,246,0.16),transparent_45%),linear-gradient(180deg,#05060b_0%,#080913_100%)]" />
      <div className="relative mx-auto w-full max-w-3xl rounded-2xl border border-white/15 bg-white/[0.04] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:p-6">
        <div className="flex items-center gap-2">
          <UserPlus2 className="h-5 w-5 text-fuchsia-300" />
          <h1 className="text-2xl font-extrabold tracking-tight text-white">회원가입</h1>
        </div>
        <Suspense fallback={null}>
          <SignupLoginLink />
        </Suspense>
        <Suspense fallback={null}>
          <SignupGoogleSection />
        </Suspense>

        <form className="mt-6 space-y-6" onSubmit={onSubmit}>
          {/* 브라우저 저장 자동완성이 휴대폰 필드를 덮어쓰지 않도록 더미 필드를 둡니다. */}
          <input
            type="text"
            autoComplete="username"
            tabIndex={-1}
            aria-hidden
            className="hidden"
          />
          <input
            type="password"
            autoComplete="new-password"
            tabIndex={-1}
            aria-hidden
            className="hidden"
          />
          <section className="rounded-xl border border-white/15 bg-black/25 p-4 backdrop-blur-sm">
            <h2 className="text-[14px] font-bold">프로필 이미지</h2>
            <p className="mt-2 text-[12px] text-zinc-400">
              홈 「오늘의 베스트 구매평」과 같은 일러스트 아바타를 고르거나, 직접 사진을 올릴 수 있어요.
            </p>
            <div className="mt-4">
              <ProfileAvatarPicker
                value={profileAvatar}
                onChange={setProfileAvatar}
              />
            </div>
          </section>

          <section className="rounded-xl border border-white/15 bg-black/25 p-4 backdrop-blur-sm">
            <h2 className="text-[14px] font-bold">기본 정보</h2>
            {submitAttempted && requiredIdentityMessage ? (
              <p className="mt-2 rounded-lg border border-rose-500/45 bg-rose-500/10 px-3 py-2 text-[12px] font-extrabold text-rose-300">
                {requiredIdentityMessage}
              </p>
            ) : null}
            <div className="mt-3 space-y-3">
              <input
                className={INPUT_CLS}
                placeholder="First name*"
                value={form.firstName}
                onChange={(e) => onChange("firstName", e.target.value)}
                autoComplete="given-name"
              />
              <input
                className={INPUT_CLS}
                placeholder="Last name*"
                value={form.lastName}
                onChange={(e) => onChange("lastName", e.target.value)}
                autoComplete="family-name"
              />
              <div>
                <div className="flex gap-2">
                  <input
                    className={INPUT_CLS}
                    placeholder="이메일*"
                    type="email"
                    value={form.email}
                    onChange={(e) => {
                      onChange("email", e.target.value);
                      setEmailCheckedAvailable(false);
                    }}
                    autoComplete="email"
                  />
                  <button
                    type="button"
                    onClick={checkEmailDuplicate}
                    disabled={isCheckingEmail}
                    className="shrink-0 rounded-xl border border-fuchsia-400/40 bg-fuchsia-500/10 px-3 py-2 text-[12px] font-bold text-fuchsia-200 transition hover:bg-fuchsia-500/20 disabled:opacity-50"
                  >
                    {isCheckingEmail ? "확인 중..." : "중복확인"}
                  </button>
                </div>
                {emailError ? (
                  <p className="mt-1.5 text-[12px] font-semibold text-rose-400">
                    {emailError}
                  </p>
                ) : null}
                {emailCheckMessage ? (
                  <p
                    className={`mt-1.5 text-[12px] font-semibold ${
                      emailCheckedAvailable && emailCheckedValue === normalizedEmail
                        ? "text-emerald-400"
                        : "text-rose-400"
                    }`}
                  >
                    {emailCheckMessage}
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
                    className="shrink-0 rounded-xl border border-fuchsia-400/40 bg-fuchsia-500/10 px-3 py-2 text-[12px] font-bold text-fuchsia-200 transition hover:bg-fuchsia-500/20 disabled:opacity-50"
                  >
                    {isCheckingNickname ? "확인 중..." : "중복확인"}
                  </button>
                </div>
                {nicknameCheckMessage ? (
                  <p
                    className={`mt-1.5 text-[12px] font-semibold ${
                      nicknameCheckedAvailable && !nicknameChangedAfterCheck
                        ? "text-emerald-400"
                        : "text-rose-400"
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
                {(submitAttempted || form.password.length > 0) && passwordError ? (
                  <p className="mt-1.5 text-[12px] font-semibold text-rose-400">
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
                {(submitAttempted || form.passwordConfirm.length > 0) &&
                passwordConfirmError ? (
                  <p className="mt-1.5 text-[12px] font-semibold text-rose-400">
                    {passwordConfirmError}
                  </p>
                ) : null}
              </div>
              <div className="sm:col-span-2">
                <div className="space-y-2">
                  <select
                    className={INPUT_CLS}
                    value={form.phoneCountryCode}
                    onChange={(e) => {
                      onChange("phoneCountryCode", e.target.value);
                      setPhoneVerified(false);
                      setPhoneVerificationProof("");
                    }}
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
                    onChange={(e) => {
                      onChange("phone", e.target.value);
                      setPhoneVerified(false);
                      setPhoneVerificationProof("");
                    }}
                    onFocus={() => setPhoneInputUnlocked(true)}
                    onClick={() => setPhoneInputUnlocked(true)}
                    inputMode="numeric"
                    autoComplete="new-password"
                    name="signup_phone_manual_input"
                    readOnly={!phoneInputUnlocked}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={sendPhoneVerificationCode}
                      disabled={isSendingPhoneCode}
                      className="shrink-0 rounded-xl border border-fuchsia-400/40 bg-fuchsia-500/10 px-3 py-2 text-[12px] font-bold text-fuchsia-200 transition hover:bg-fuchsia-500/20 disabled:opacity-50"
                    >
                      {isSendingPhoneCode ? "발송 중..." : "인증번호 발송"}
                    </button>
                    {phoneVerified ? (
                      <span className="inline-flex items-center rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-[12px] font-bold text-emerald-300">
                        인증 완료
                      </span>
                    ) : null}
                  </div>
                  <div className="flex gap-2">
                    <input
                      className={INPUT_CLS}
                      placeholder="인증번호 6자리 입력"
                      value={phoneCodeInput}
                      onChange={(e) => setPhoneCodeInput(e.target.value)}
                      inputMode="numeric"
                      maxLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => void verifyPhoneCode()}
                      className="shrink-0 rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-[12px] font-bold text-emerald-300 transition hover:bg-emerald-500/20"
                    >
                      인증 확인
                    </button>
                  </div>
                </div>
                {(submitAttempted || form.phone.trim().length > 0) && phoneError ? (
                  <p className="mt-1.5 text-[12px] font-semibold text-rose-400">
                    {phoneError}
                  </p>
                ) : null}
                {phoneVerifyMessage ? (
                  <p
                    className={`mt-1.5 text-[12px] font-semibold ${
                      phoneVerified ? "text-emerald-400" : "text-zinc-300"
                    }`}
                  >
                    {phoneVerifyMessage}
                  </p>
                ) : null}
              </div>
              <label className="block text-[12px] font-semibold text-zinc-300 [html[data-theme='light']_&]:text-zinc-700">
                국가 / Country
                <select
                  className={`${INPUT_CLS} mt-1`}
                  value={form.country}
                  onChange={(e) => onChange("country", e.target.value)}
                  aria-label="국가 선택"
                >
                  {COUNTRY_OPTIONS.map((opt) => (
                    <option key={opt.code} value={opt.code}>
                      {opt.label} ({opt.code})
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="rounded-xl border border-white/15 bg-black/25 p-4 backdrop-blur-sm">
            <h2 className="text-[14px] font-bold">SNS 연동 (릴스 소스 가져오기)</h2>
            <p className="mt-2 rounded-lg border border-fuchsia-400/35 bg-fuchsia-500/10 px-3 py-2 text-[12px] font-semibold text-fuchsia-200">
              본인의 인스타그램이나 유튜브 링크를 연결하면 판매 신뢰도가 높아집니다!
            </p>
            <p className="mt-2 text-[12px] text-zinc-400">
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
              <p className="mt-3 rounded-lg border border-rose-500/45 bg-rose-500/10 px-3 py-2 text-[12px] font-extrabold text-rose-300">
                올바른 링크 주소를 입력해주세요
              </p>
            ) : null}
          </section>

          <section className="rounded-xl border border-white/15 bg-black/25 p-4 backdrop-blur-sm">
            <h2 className="inline-flex items-center gap-1 text-[14px] font-bold">
              <ShieldCheck className="h-4 w-4 text-fuchsia-300" />
              약관 동의
            </h2>
            <div className="mt-3">
              <button
                type="button"
                onClick={() => {
                  const shouldSelectAll =
                    !form.agreeAge ||
                    !form.agreeTerms ||
                    !form.agreePrivacy ||
                    !form.agreeMarketing;
                  setForm((prev) => ({
                    ...prev,
                    agreeAge: shouldSelectAll,
                    agreeTerms: shouldSelectAll,
                    agreePrivacy: shouldSelectAll,
                    agreeMarketing: shouldSelectAll,
                  }));
                }}
                className="rounded-xl border border-fuchsia-400/40 bg-fuchsia-500/10 px-3 py-2 text-[12px] font-bold text-fuchsia-200 transition hover:bg-fuchsia-500/20"
              >
                {form.agreeAge &&
                form.agreeTerms &&
                form.agreePrivacy &&
                form.agreeMarketing
                  ? "전체해제"
                  : "전체선택"}
              </button>
            </div>
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
            className="w-full rounded-xl bg-gradient-to-r from-fuchsia-500 to-indigo-500 px-4 py-3 text-[14px] font-extrabold text-white shadow-[0_12px_30px_rgba(168,85,247,0.45)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {isSubmitting ? "회원가입 처리 중..." : "회원가입 완료"}
          </button>
          {message ? <p className="text-[13px] font-semibold text-fuchsia-200">{message}</p> : null}
        </form>
      </div>
    </main>
  );
}
