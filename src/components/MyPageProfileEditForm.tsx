"use client";

import { useCallback, useEffect, useState } from "react";
import { SocialLinkFields } from "@/components/SocialLinkFields";
import { useAuthSession } from "@/hooks/useAuthSession";
import {
  fetchUserDataBlob,
  upsertUserDataBlob,
} from "@/lib/supabaseUserSync";
import {
  normalizeSellerSocialLinksInput,
  parseSellerSocialBlob,
} from "@/lib/sellerSocialLinks";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import {
  buildInternationalPhone,
  derivePhoneFieldsForForm,
  fetchUserProfile,
  mergeProfileRowWithAuthUser,
  upsertUserProfile,
  type AppProfile,
} from "@/lib/supabaseProfiles";

function nz(s: string): string | null {
  const t = s.trim();
  return t.length > 0 ? t : null;
}

const SOCIAL_LINKS_BLOB_KEY = "social_links";

export function MyPageProfileEditForm({
  profileForForm,
  onSaved,
}: {
  /** DB 행 + 로그인 메타 병합 결과 (부모에서 mergeProfileRowWithAuthUser 로 생성) */
  profileForForm: AppProfile | null;
  onSaved: (p: AppProfile) => void;
}) {
  const { user, supabaseConfigured } = useAuthSession();
  const [nickname, setNickname] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneCountryCode, setPhoneCountryCode] = useState("");
  const [country, setCountry] = useState("");
  const [socialLinks, setSocialLinks] = useState<string[]>([""]);
  const [socialLinksReady, setSocialLinksReady] = useState(false);
  const [socialBusy, setSocialBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!profileForForm) {
      setNickname("");
      setFirstName("");
      setLastName("");
      setPhone("");
      setPhoneCountryCode("+82");
      setCountry("");
      return;
    }
    setNickname(profileForForm.nickname ?? "");
    setFirstName(profileForForm.first_name ?? "");
    setLastName(profileForForm.last_name ?? "");
    const { phoneCountryCode: code, phoneNational } = derivePhoneFieldsForForm(
      profileForForm,
      user?.phone,
    );
    setPhoneCountryCode(code || "+82");
    setPhone(phoneNational);
    setCountry(profileForForm.country ?? "");
  }, [profileForForm, user?.phone]);

  useEffect(() => {
    let cancelled = false;
    const loadSocialLinks = async () => {
      if (!user || !supabaseConfigured) {
        setSocialLinks([""]);
        setSocialLinksReady(false);
        return;
      }
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        setSocialLinks([""]);
        setSocialLinksReady(false);
        return;
      }

      const blob = await fetchUserDataBlob(supabase, user.id, SOCIAL_LINKS_BLOB_KEY);
      if (cancelled) return;
      const parsedFromBlob = parseSellerSocialBlob(blob);
      if (parsedFromBlob.length > 0) {
        setSocialLinks(parsedFromBlob.map((x) => x.url));
      } else {
        const metaLinks = Array.isArray((user.user_metadata as { social_links?: unknown })?.social_links)
          ? (user.user_metadata as { social_links: unknown[] }).social_links
              .filter((x): x is string => typeof x === "string")
          : [];
        const parsedFromMeta = normalizeSellerSocialLinksInput(metaLinks);
        setSocialLinks(parsedFromMeta.length > 0 ? parsedFromMeta.map((x) => x.url) : [""]);
      }
      setSocialLinksReady(true);
    };
    void loadSocialLinks();
    return () => {
      cancelled = true;
    };
  }, [user, supabaseConfigured]);

  const save = useCallback(async () => {
    setMessage(null);
    if (!user || !supabaseConfigured) {
      setMessage("로그인 후 저장할 수 있습니다.");
      return;
    }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setMessage("Supabase 연결을 확인해 주세요.");
      return;
    }
    setBusy(true);
    try {
      const phoneIntl = buildInternationalPhone(phoneCountryCode, phone);
      const patch = {
        nickname: nz(nickname),
        first_name: nz(firstName),
        last_name: nz(lastName),
        phone: phoneIntl,
        phone_country_code: nz(phoneCountryCode),
        country: nz(country),
        timezone: null,
      };
      const { error: authErr } = await supabase.auth.updateUser({
        data: {
          nickname: patch.nickname,
          first_name: patch.first_name,
          last_name: patch.last_name,
          phone: patch.phone,
          phone_country_code: patch.phone_country_code,
          country: patch.country,
          timezone: null,
        },
      });
      if (authErr) {
        setMessage("계정 메타데이터 갱신에 실패했습니다. 잠시 후 다시 시도해 주세요.");
        return;
      }
      const updated = await upsertUserProfile(supabase, user.id, {
        ...patch,
        email: user.email ?? profileForForm?.email ?? null,
      });
      if (updated) {
        onSaved(updated);
        setMessage(null);
        return;
      }
      /* profiles upsert가 null이어도 위에서 auth.updateUser는 이미 반영됨.
         새로고침 시 merge는 메타데이터를 쓰므로, 최신 Auth 유저로 병합해 UI만 맞춤 */
      const { data: authFresh, error: refreshErr } = await supabase.auth.getUser();
      const freshUser = authFresh.user;
      if (refreshErr || !freshUser) {
        setMessage("저장 상태를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.");
        return;
      }
      const row = await fetchUserProfile(supabase, user.id);
      onSaved(mergeProfileRowWithAuthUser(row, freshUser));
      setMessage(null);
    } finally {
      setBusy(false);
    }
  }, [
    user,
    supabaseConfigured,
    nickname,
    firstName,
    lastName,
    phone,
    phoneCountryCode,
    country,
    profileForForm?.email,
    onSaved,
  ]);

  useEffect(() => {
    if (!user || !supabaseConfigured || !socialLinksReady) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const timer = window.setTimeout(async () => {
      setSocialBusy(true);
      const normalized = normalizeSellerSocialLinksInput(socialLinks);
      const ok = await upsertUserDataBlob(
        supabase,
        user.id,
        SOCIAL_LINKS_BLOB_KEY,
        normalized,
      );
      setSocialBusy(false);
      if (!ok) {
        setMessage("SNS 링크 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.");
        return;
      }
      // 동일 브라우저 세션에서 판매 카드 아이콘을 즉시 갱신합니다.
      window.dispatchEvent(
        new CustomEvent("seller-social-links-updated", {
          detail: { sellerId: user.id, links: normalized },
        }),
      );
    }, 450);

    return () => window.clearTimeout(timer);
  }, [socialLinks, socialLinksReady, supabaseConfigured, user]);

  if (!user) {
    return (
      <p className="text-[13px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
        로그인하면 프로필 정보를 수정할 수 있습니다.
      </p>
    );
  }

  const input =
    "mt-1 w-full rounded-lg border border-white/15 bg-black/25 px-3 py-2 text-[14px] text-zinc-100 outline-none focus:border-reels-cyan/45 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:text-zinc-900";

  return (
    <div className="mt-6 space-y-4 rounded-xl border border-white/10 bg-black/20 p-4 [html[data-theme='light']_&]:border-zinc-200 [html[data-theme='light']_&]:bg-zinc-50">
      <h3 className="text-[15px] font-bold text-zinc-100 [html[data-theme='light']_&]:text-zinc-900">
        프로필 정보 수정
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-[12px] font-semibold text-zinc-400 [html[data-theme='light']_&]:text-zinc-700">
          닉네임
          <input className={input} value={nickname} onChange={(e) => setNickname(e.target.value)} autoComplete="nickname" />
        </label>
        <label className="block text-[12px] font-semibold text-zinc-400 [html[data-theme='light']_&]:text-zinc-700">
          이메일 (읽기 전용)
          <input className={`${input} opacity-70`} value={user.email ?? ""} readOnly />
        </label>
        <label className="block text-[12px] font-semibold text-zinc-400 [html[data-theme='light']_&]:text-zinc-700">
          First name
          <input
            className={input}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            autoComplete="given-name"
            placeholder="e.g. Ara"
          />
        </label>
        <label className="block text-[12px] font-semibold text-zinc-400 [html[data-theme='light']_&]:text-zinc-700">
          Last name
          <input
            className={input}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            autoComplete="family-name"
            placeholder="e.g. Kang"
          />
        </label>
        <label className="block text-[12px] font-semibold text-zinc-400 [html[data-theme='light']_&]:text-zinc-700">
          전화 국가번호
          <input className={input} value={phoneCountryCode} onChange={(e) => setPhoneCountryCode(e.target.value)} placeholder="+82" />
        </label>
        <label className="block text-[12px] font-semibold text-zinc-400 [html[data-theme='light']_&]:text-zinc-700">
          전화번호
          <input className={input} value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
        </label>
        <label className="block text-[12px] font-semibold text-zinc-400 [html[data-theme='light']_&]:text-zinc-700">
          국가 (ISO 코드, 예: KR)
          <input
            className={input}
            value={country}
            onChange={(e) => setCountry(e.target.value.toUpperCase())}
            placeholder="KR"
            maxLength={2}
            autoComplete="country"
          />
        </label>
      </div>
      <div>
        <p className="text-[12px] font-semibold text-zinc-400 [html[data-theme='light']_&]:text-zinc-700">
          SNS 링크 (TikTok / Instagram / YouTube / X)
        </p>
        <p className="mt-1 text-[11px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
          입력 후 잠시 기다리면 자동 저장되고, 판매 영상 카드 아이콘에 바로 반영됩니다.
        </p>
        <div className="mt-2">
          <SocialLinkFields
            links={socialLinks}
            onChange={setSocialLinks}
            placeholder="ex. tiktok.com/@yourid"
          />
        </div>
        {socialBusy ? (
          <p className="mt-2 text-[12px] font-medium text-zinc-400 [html[data-theme='light']_&]:text-zinc-600">
            SNS 링크 저장 중...
          </p>
        ) : null}
      </div>
      {message ? (
        <p className="text-[13px] font-medium text-reels-cyan [html[data-theme='light']_&]:text-teal-700" role="status">
          {message}
        </p>
      ) : null}
      <button
        type="button"
        disabled={busy}
        onClick={() => void save()}
        className="rounded-full bg-reels-cyan/20 px-5 py-2.5 text-[14px] font-extrabold text-reels-cyan transition hover:bg-reels-cyan/30 disabled:opacity-50 [html[data-theme='light']_&]:text-teal-800"
      >
        {busy ? "저장 중…" : "변경 사항 저장"}
      </button>
    </div>
  );
}
