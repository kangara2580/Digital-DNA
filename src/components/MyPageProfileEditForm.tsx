"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuthSession } from "@/hooks/useAuthSession";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import {
  upsertUserProfile,
  type AppProfile,
} from "@/lib/supabaseProfiles";

function nz(s: string): string | null {
  const t = s.trim();
  return t.length > 0 ? t : null;
}

export function MyPageProfileEditForm({
  profileRecord,
  onSaved,
}: {
  profileRecord: AppProfile | null;
  onSaved: (p: AppProfile) => void;
}) {
  const { user, supabaseConfigured } = useAuthSession();
  const [nickname, setNickname] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneCountryCode, setPhoneCountryCode] = useState("");
  const [country, setCountry] = useState("");
  const [timezone, setTimezone] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setNickname(profileRecord?.nickname ?? "");
    setFirstName(profileRecord?.first_name ?? "");
    setLastName(profileRecord?.last_name ?? "");
    setPhone(profileRecord?.phone ?? "");
    setPhoneCountryCode(profileRecord?.phone_country_code ?? "");
    setCountry(profileRecord?.country ?? "");
    setTimezone(profileRecord?.timezone ?? "");
  }, [profileRecord]);

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
      const patch = {
        nickname: nz(nickname),
        first_name: nz(firstName),
        last_name: nz(lastName),
        phone: nz(phone),
        phone_country_code: nz(phoneCountryCode),
        country: nz(country),
        timezone: nz(timezone),
      };
      const { error: authErr } = await supabase.auth.updateUser({
        data: {
          nickname: patch.nickname,
          first_name: patch.first_name,
          last_name: patch.last_name,
          phone: patch.phone,
          phone_country_code: patch.phone_country_code,
          country: patch.country,
          timezone: patch.timezone,
        },
      });
      if (authErr) {
        setMessage("계정 메타데이터 갱신에 실패했습니다. 잠시 후 다시 시도해 주세요.");
        return;
      }
      const updated = await upsertUserProfile(supabase, user.id, {
        ...patch,
        email: user.email ?? profileRecord?.email ?? null,
      });
      if (!updated) {
        setMessage("profiles 테이블 저장에 실패했습니다. RLS·테이블 생성 여부를 확인해 주세요.");
        return;
      }
      onSaved(updated);
      setMessage("저장되었습니다.");
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
    timezone,
    profileRecord?.email,
    onSaved,
  ]);

  if (!user) {
    return (
      <p className="text-[13px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
        로그인하면 프로필 정보를 수정하고 Supabase에 저장할 수 있습니다.
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
      <p className="text-[12px] text-zinc-500 [html[data-theme='light']_&]:text-zinc-600">
        아래 내용은 <strong className="font-semibold">Supabase <code className="text-[11px]">profiles</code></strong> 테이블과 로그인 메타데이터에 함께 반영됩니다.
      </p>
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
          이름 (First)
          <input className={input} value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="given-name" />
        </label>
        <label className="block text-[12px] font-semibold text-zinc-400 [html[data-theme='light']_&]:text-zinc-700">
          성 (Last)
          <input className={input} value={lastName} onChange={(e) => setLastName(e.target.value)} autoComplete="family-name" />
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
          국가
          <input className={input} value={country} onChange={(e) => setCountry(e.target.value)} autoComplete="country-name" />
        </label>
        <label className="block text-[12px] font-semibold text-zinc-400 [html[data-theme='light']_&]:text-zinc-700">
          시간대
          <input className={input} value={timezone} onChange={(e) => setTimezone(e.target.value)} placeholder="Asia/Seoul" />
        </label>
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
