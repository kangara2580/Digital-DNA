import type { SupabaseClient, User } from "@supabase/supabase-js";
import { getProfilesTableName } from "@/lib/supabaseTableNames";

export type AppProfile = {
  user_id: string;
  email: string | null;
  nickname: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  phone_country_code: string | null;
  country: string | null;
  /** 레거시 컬럼 — UI에서는 사용하지 않음 */
  timezone: string | null;
  avatar_kind: string | null;
  avatar_seed: string | null;
  avatar_custom: string | null;
  /** 마이페이지 3면/AI 얼굴 프로필 (JSON) — 마이그레이션 전에는 없을 수 있음 */
  face_profile_json?: unknown | null;
};

type ProfilePatch = Partial<AppProfile>;

function toNullableString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function buildProfilePatchFromUser(user: User): ProfilePatch {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  return {
    user_id: user.id,
    email: toNullableString(user.email ?? null),
    nickname: toNullableString(meta.nickname),
    first_name: toNullableString(meta.first_name),
    last_name: toNullableString(meta.last_name),
    phone:
      toNullableString(meta.phone) ?? toNullableString(user.phone),
    phone_country_code: toNullableString(meta.phone_country_code),
    country: toNullableString(meta.country),
    timezone: toNullableString(meta.timezone),
    avatar_kind: toNullableString(meta.avatar_kind),
    avatar_seed: toNullableString(meta.avatar_seed),
    avatar_custom: toNullableString(meta.avatar_custom),
  };
}

function coalesceField(
  fromRow: string | null | undefined,
  meta: Record<string, unknown>,
  key: string,
): string | null {
  const a = toNullableString(fromRow);
  if (a) return a;
  return toNullableString(meta[key]);
}

/** DB 또는 여러 메타 키 후보 중 첫 번째 비어 있지 않은 문자열 */
function coalesceFieldKeys(
  fromRow: string | null | undefined,
  meta: Record<string, unknown>,
  keys: string[],
): string | null {
  const a = toNullableString(fromRow);
  if (a) return a;
  for (const key of keys) {
    const v = toNullableString(meta[key]);
    if (v) return v;
  }
  return null;
}

/**
 * DB `profiles` 행은 있지만 일부 컬럼이 비어 있고, 가입 시점 `user_metadata`에만 값이 있는 경우가 있습니다.
 * 폼·요약 카드에서 동일하게 보이도록 행과 인증 메타를 합칩니다.
 */
export function mergeProfileRowWithAuthUser(
  row: AppProfile | null,
  user: User,
): AppProfile {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const empty: AppProfile = {
    user_id: user.id,
    email: null,
    nickname: null,
    first_name: null,
    last_name: null,
    phone: null,
    phone_country_code: null,
    country: null,
    timezone: null,
    avatar_kind: null,
    avatar_seed: null,
    avatar_custom: null,
    face_profile_json: null,
  };
  const base = row ?? empty;

  const email =
    toNullableString(base.email) ??
    toNullableString(user.email) ??
    toNullableString(meta.email as string | undefined);

  const mergedPhone =
    coalesceField(base.phone, meta, "phone") ??
    toNullableString(meta.phone_number) ??
    toNullableString(user.phone);

  let mergedPhoneCountry = coalesceField(
    base.phone_country_code,
    meta,
    "phone_country_code",
  );
  if (!mergedPhoneCountry && mergedPhone?.startsWith("+82")) {
    mergedPhoneCountry = "+82";
  }

  const firstFromMeta = toNullableString(meta.first_name);
  const lastFromMeta = toNullableString(meta.last_name);
  const firstName =
    toNullableString(base.first_name) ??
    firstFromMeta ??
    toNullableString(meta.given_name);
  const lastName =
    toNullableString(base.last_name) ??
    lastFromMeta ??
    toNullableString(meta.family_name);

  return {
    ...base,
    user_id: user.id,
    email,
    nickname: coalesceFieldKeys(base.nickname, meta, [
      "nickname",
      "display_name",
      "preferred_username",
    ]),
    first_name: firstName,
    last_name: lastName,
    phone: mergedPhone,
    phone_country_code: mergedPhoneCountry,
    country: coalesceField(base.country, meta, "country"),
    timezone: coalesceField(base.timezone, meta, "timezone"),
    avatar_kind: coalesceField(base.avatar_kind, meta, "avatar_kind"),
    avatar_seed: coalesceField(base.avatar_seed, meta, "avatar_seed"),
    avatar_custom: coalesceField(base.avatar_custom, meta, "avatar_custom"),
  };
}

/**
 * DB/메타에 저장된 번호와 Supabase `user.phone`(E.164)에서 국가번호·국내 번호를 나눕니다.
 * `+` 없이 010…만 저장된 경우에도 국가번호(+82)와 맞춰 표시합니다.
 */
export function derivePhoneFieldsForForm(
  profile: AppProfile,
  authPhoneE164?: string | null,
): {
  phoneCountryCode: string;
  phoneNational: string;
} {
  let full = (profile.phone ?? "").trim();
  if (!full) {
    full = (authPhoneE164 ?? "").trim();
  }

  const codeRaw = (profile.phone_country_code ?? "").trim();
  let normalizedCode = codeRaw.startsWith("+")
    ? codeRaw
    : codeRaw
      ? `+${codeRaw}`
      : "+82";

  if (!full) {
    return { phoneCountryCode: normalizedCode, phoneNational: "" };
  }

  // 한국 휴대전화 E.164 (+82 10…)
  if (full.startsWith("+82")) {
    return {
      phoneCountryCode: "+82",
      phoneNational: full.slice(3).replace(/\D/g, ""),
    };
  }

  if (full.startsWith(normalizedCode)) {
    return {
      phoneCountryCode: normalizedCode,
      phoneNational: full.slice(normalizedCode.length).replace(/\D/g, ""),
    };
  }

  if (full.startsWith("+")) {
    const digits = full.replace(/\D/g, "");
    const codeDigits = normalizedCode.replace(/\D/g, "");
    if (codeDigits.length > 0 && digits.startsWith(codeDigits)) {
      return {
        phoneCountryCode: normalizedCode,
        phoneNational: digits.slice(codeDigits.length),
      };
    }
  }

  // 국가번호 없이 숫자만 (예: 01012345678)
  const digitsOnly = full.replace(/\D/g, "");
  if (digitsOnly.length >= 8 && digitsOnly.length <= 15) {
    return { phoneCountryCode: normalizedCode, phoneNational: digitsOnly };
  }

  return { phoneCountryCode: normalizedCode, phoneNational: digitsOnly };
}

/** 회원가입과 동일하게 국가번호 + 숫자만 이어붙인 값을 `profiles.phone`에 저장합니다. */
export function buildInternationalPhone(
  phoneCountryCode: string,
  nationalDigits: string,
): string | null {
  const digits = nationalDigits.replace(/\D/g, "");
  const c = phoneCountryCode.trim();
  if (!digits) return null;
  const prefix = c.startsWith("+") ? c : c ? `+${c}` : "+";
  return `${prefix}${digits}`;
}

function profileNeedsBackfillFromMerge(
  row: AppProfile | null,
  merged: AppProfile,
): boolean {
  if (!row) return true;
  const keys: (keyof AppProfile)[] = [
    "email",
    "nickname",
    "first_name",
    "last_name",
    "phone",
    "phone_country_code",
    "country",
  ];
  for (const k of keys) {
    const before = toNullableString(row[k] as string | null | undefined);
    const after = toNullableString(merged[k] as string | null | undefined);
    if (!before && after) return true;
  }
  return false;
}

export async function loadProfileMergedWithBackfill(
  supabase: SupabaseClient,
  user: User,
): Promise<AppProfile | null> {
  // 세션에 담긴 user 객체보다 Auth 서버의 최신 `raw_user_meta_data`가 필요합니다.
  const { data: authData } = await supabase.auth.getUser();
  const authUser = authData?.user ?? user;

  const row = await fetchUserProfile(supabase, authUser.id);
  const merged = mergeProfileRowWithAuthUser(row, authUser);

  if (profileNeedsBackfillFromMerge(row, merged)) {
    const saved = await upsertUserProfile(supabase, authUser.id, {
      email: merged.email,
      nickname: merged.nickname,
      first_name: merged.first_name,
      last_name: merged.last_name,
      phone: merged.phone,
      phone_country_code: merged.phone_country_code,
      country: merged.country,
      timezone: merged.timezone,
      avatar_kind: merged.avatar_kind,
      avatar_seed: merged.avatar_seed,
      avatar_custom: merged.avatar_custom,
    });
    return saved ?? merged;
  }

  return merged;
}

export async function fetchUserProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<AppProfile | null> {
  try {
    const { data, error } = await supabase
      .from(getProfilesTableName())
      .select(
        "user_id,email,nickname,first_name,last_name,phone,phone_country_code,country,timezone,avatar_kind,avatar_seed,avatar_custom,face_profile_json",
      )
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data) return null;
    return data as AppProfile;
  } catch {
    // profiles 테이블 미생성/권한 에러 시 앱 동작은 계속 유지합니다.
    return null;
  }
}

export async function upsertUserProfile(
  supabase: SupabaseClient,
  userId: string,
  patch: ProfilePatch,
): Promise<AppProfile | null> {
  try {
    const payload: ProfilePatch = {
      user_id: userId,
      ...patch,
    };

    const { data, error } = await supabase
      .from(getProfilesTableName())
      .upsert(payload, { onConflict: "user_id" })
      .select(
        "user_id,email,nickname,first_name,last_name,phone,phone_country_code,country,timezone,avatar_kind,avatar_seed,avatar_custom,face_profile_json",
      )
      .single();

    if (error) return null;
    return data as AppProfile;
  } catch {
    return null;
  }
}

export async function syncProfileFromAuthUser(
  supabase: SupabaseClient,
  user: User,
): Promise<AppProfile | null> {
  const patch = buildProfilePatchFromUser(user);
  return upsertUserProfile(supabase, user.id, patch);
}
