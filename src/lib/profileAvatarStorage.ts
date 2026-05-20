import type { User } from "@supabase/supabase-js";
import type { AppProfile } from "@/lib/supabaseProfiles";
import {
  normalizeProfileColorHex,
  profileColorFromSeed,
  resolveStoredProfileColor,
} from "@/lib/profileColorSpectrum";

const STORAGE_KEY = "reels-market-profile-avatar-v1";

/** 직접 업로드 data URL 상한 — DB·API 전송 안전 여유 */
export const PROFILE_AVATAR_UPLOAD_MAX_CHARS = 900_000;
/** 압축 목표(이보다 작게 맞추면 저장 실패 가능성↓) */
export const PROFILE_AVATAR_TARGET_CHARS = 650_000;

export type ProfileAvatar =
  | { kind: "color"; hex: string }
  | { kind: "upload"; dataUrl: string };

/** auth `user_metadata`/JWT — 이미지 본문 금지(쿠키 431 방지) */
export function isOversizedAuthAvatarCustom(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const s = value.trim();
  if (!s) return false;
  return s.startsWith("data:image/") || s.length > 280;
}

/** Supabase `auth.updateUser({ data })` — avatar_kind/seed 만 (avatar_custom 제외) */
export function profileAvatarToAuthMetaPatch(
  next: ProfileAvatar | null,
): {
  avatar_kind: string | null;
  avatar_seed: string | null;
  avatar_custom: null;
} {
  if (!next) {
    return { avatar_kind: null, avatar_seed: null, avatar_custom: null };
  }
  if (next.kind === "upload") {
    return { avatar_kind: "upload", avatar_seed: null, avatar_custom: null };
  }
  const hex = normalizeProfileColorHex(next.hex);
  return {
    avatar_kind: "color",
    avatar_seed: hex ?? next.hex,
    avatar_custom: null,
  };
}

export function profileAvatarToDbPatch(
  next: ProfileAvatar | null,
): Pick<AppProfile, "avatar_kind" | "avatar_seed" | "avatar_custom"> {
  if (!next) {
    return { avatar_kind: null, avatar_seed: null, avatar_custom: null };
  }
  if (next.kind === "upload") {
    return {
      avatar_kind: "upload",
      avatar_seed: null,
      avatar_custom: next.dataUrl,
    };
  }
  const hex = normalizeProfileColorHex(next.hex);
  return {
    avatar_kind: "color",
    avatar_seed: hex ?? next.hex,
    avatar_custom: null,
  };
}

export function readProfileAvatar(): ProfileAvatar | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const j = JSON.parse(raw) as unknown;
    if (!j || typeof j !== "object") return null;
    const o = j as { kind?: string; hex?: string; seed?: string };
    if (
      o.kind === "upload" &&
      typeof (o as { dataUrl?: string }).dataUrl === "string" &&
      (o as { dataUrl: string }).dataUrl.startsWith("data:image/")
    ) {
      return { kind: "upload", dataUrl: (o as { dataUrl: string }).dataUrl };
    }
    if (o.kind === "color" && typeof o.hex === "string") {
      const hex = normalizeProfileColorHex(o.hex);
      if (hex) return { kind: "color", hex };
    }
    if (typeof o.seed === "string" && o.seed.trim()) {
      return { kind: "color", hex: profileColorFromSeed(o.seed.trim()) };
    }
    return null;
  } catch {
    return null;
  }
}

export function writeProfileAvatar(next: ProfileAvatar | null) {
  if (typeof window === "undefined") return;
  try {
    if (!next) {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
    window.dispatchEvent(new Event("reels-profile-avatar-updated"));
  } catch {
    /* quota */
  }
}

function profileAvatarFromMetadata(
  meta: Record<string, unknown> | undefined,
  userId: string,
): ProfileAvatar | null {
  if (!meta) return null;
  const avatarKind = typeof meta.avatar_kind === "string" ? meta.avatar_kind : "";
  const avatarSeed = typeof meta.avatar_seed === "string" ? meta.avatar_seed : "";
  const avatarCustom =
    typeof meta.avatar_custom === "string" ? meta.avatar_custom : "";
  if (avatarKind === "color") {
    const hex = normalizeProfileColorHex(avatarSeed);
    if (hex) return { kind: "color", hex };
  }
  if (avatarKind === "upload" && avatarCustom.startsWith("data:image/")) {
    if (!isOversizedAuthAvatarCustom(avatarCustom)) {
      return { kind: "upload", dataUrl: avatarCustom };
    }
  }
  if (avatarKind === "preset" && avatarSeed.trim()) {
    return { kind: "color", hex: profileColorFromSeed(avatarSeed.trim()) };
  }
  return null;
}

function defaultColorAvatar(seed: string): ProfileAvatar {
  return { kind: "color", hex: profileColorFromSeed(seed) };
}

/** DB `profiles` 행 우선. 로그인 사용자는 항상 색상 아바타를 반환합니다. */
export function resolveProfileAvatar(
  user: User | null,
  dbProfile?: AppProfile | null,
): ProfileAvatar | null {
  const uid =
    typeof user?.id === "string"
      ? user.id
      : typeof dbProfile?.user_id === "string"
        ? dbProfile.user_id
        : "reels-market";

  if (dbProfile?.avatar_kind === "upload" && dbProfile.avatar_custom?.trim()) {
    const src = dbProfile.avatar_custom.trim();
    if (
      src.startsWith("data:image/") ||
      src.startsWith("https://") ||
      src.startsWith("http://")
    ) {
      return { kind: "upload", dataUrl: src };
    }
  }

  if (dbProfile?.avatar_kind === "color" && dbProfile.avatar_seed?.trim()) {
    const hex = normalizeProfileColorHex(dbProfile.avatar_seed);
    if (hex) return { kind: "color", hex };
  }

  if (dbProfile?.avatar_kind === "preset" && dbProfile.avatar_seed?.trim()) {
    return defaultColorAvatar(dbProfile.avatar_seed.trim());
  }

  if (dbProfile?.avatar_kind === "custom") {
    return defaultColorAvatar(uid);
  }

  if (user) {
    const fromMeta = profileAvatarFromMetadata(
      user.user_metadata as Record<string, unknown> | undefined,
      uid,
    );
    if (fromMeta) return fromMeta;
    return defaultColorAvatar(uid);
  }

  return readProfileAvatar() ?? defaultColorAvatar(uid);
}

export function profileAvatarFromDbOnly(record: AppProfile | null): ProfileAvatar | null {
  if (!record) return null;
  return resolveProfileAvatar({ id: record.user_id } as User, record);
}

export function profileColorHexFromDb(
  record: Pick<AppProfile, "avatar_kind" | "avatar_seed" | "user_id"> | null,
  fallbackSeed: string,
): string {
  return resolveStoredProfileColor(
    record?.avatar_kind,
    record?.avatar_seed,
    fallbackSeed || record?.user_id || "reels-market",
  );
}

export function needsProfileColorMigration(
  record: Pick<AppProfile, "avatar_kind"> | null | undefined,
): boolean {
  const kind = record?.avatar_kind;
  if (kind === "color" || kind === "upload") return false;
  return true;
}
