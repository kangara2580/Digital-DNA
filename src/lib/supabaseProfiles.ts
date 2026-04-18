import type { SupabaseClient, User } from "@supabase/supabase-js";

export type AppProfile = {
  user_id: string;
  email: string | null;
  nickname: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  phone_country_code: string | null;
  country: string | null;
  timezone: string | null;
  avatar_kind: string | null;
  avatar_seed: string | null;
  avatar_custom: string | null;
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
    phone: toNullableString(meta.phone),
    phone_country_code: toNullableString(meta.phone_country_code),
    country: toNullableString(meta.country),
    timezone: toNullableString(meta.timezone),
    avatar_kind: toNullableString(meta.avatar_kind),
    avatar_seed: toNullableString(meta.avatar_seed),
    avatar_custom: toNullableString(meta.avatar_custom),
  };
}

export async function fetchUserProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<AppProfile | null> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "user_id,email,nickname,first_name,last_name,phone,phone_country_code,country,timezone,avatar_kind,avatar_seed,avatar_custom",
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
      .from("profiles")
      .upsert(payload, { onConflict: "user_id" })
      .select(
        "user_id,email,nickname,first_name,last_name,phone,phone_country_code,country,timezone,avatar_kind,avatar_seed,avatar_custom",
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
