import { buildNotionistsAvatarUrl } from "@/data/reelsAvatarPresets";
import {
  buildNotionistsCustomAvatarUrl,
  createDefaultCharacterParts,
  normalizeCharacterParts,
  type CharacterPartsV1,
} from "@/lib/notionistsCharacter";
import type { User } from "@supabase/supabase-js";
import type { AppProfile } from "@/lib/supabaseProfiles";

const STORAGE_KEY = "reels-market-profile-avatar-v1";
/** 직접 업로드 data URL 상한(대략 1.5MB) — localStorage 안전 여유 */
export const PROFILE_AVATAR_UPLOAD_MAX_CHARS = 1_500_000;

export type ProfileAvatar =
  | { kind: "preset"; seed: string }
  | { kind: "upload"; dataUrl: string }
  | { kind: "custom"; parts: CharacterPartsV1 };

export function readProfileAvatar(): ProfileAvatar | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const j = JSON.parse(raw) as unknown;
    if (!j || typeof j !== "object") return null;
    const o = j as Partial<ProfileAvatar>;
    if (o.kind === "preset" && typeof o.seed === "string" && o.seed.trim()) {
      return { kind: "preset", seed: o.seed.trim() };
    }
    if (
      o.kind === "upload" &&
      typeof o.dataUrl === "string" &&
      o.dataUrl.startsWith("data:image/")
    ) {
      return { kind: "upload", dataUrl: o.dataUrl };
    }
    if (o.kind === "custom" && o.parts && typeof o.parts === "object") {
      const p = normalizeCharacterParts(o.parts, "reels-market");
      if (p) return { kind: "custom", parts: p };
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

/** 표시용 URL(data URL 또는 DiceBear SVG) */
export function getProfileAvatarDisplayUrl(
  v: ProfileAvatar | null,
  fallbackSeed = "reels-market",
): string {
  if (!v) return buildNotionistsAvatarUrl(fallbackSeed);
  if (v.kind === "preset") return buildNotionistsAvatarUrl(v.seed);
  if (v.kind === "custom") return buildNotionistsCustomAvatarUrl(v.parts);
  return v.dataUrl;
}

function profileAvatarFromMetadata(
  meta: Record<string, unknown> | undefined,
  userId: string,
): ProfileAvatar | null {
  if (!meta) return null;
  const customRaw = meta.avatar_custom;
  if (typeof customRaw === "string" && customRaw.trim()) {
    try {
      const parsed = JSON.parse(customRaw) as unknown;
      const p = normalizeCharacterParts(parsed, userId);
      if (p) return { kind: "custom", parts: p };
    } catch {
      /* ignore */
    }
  }
  const seed = meta.avatar_seed;
  if (typeof seed === "string" && seed.trim().length > 0) {
    return { kind: "preset", seed: seed.trim() };
  }
  return null;
}

/** DB `profiles` 행 우선, 없으면 auth 메타데이터. 로그인 사용자는 로컬 스토리지를 쓰지 않습니다. */
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
  if (dbProfile?.avatar_kind === "upload" && dbProfile.avatar_custom?.startsWith("data:image/")) {
    return { kind: "upload", dataUrl: dbProfile.avatar_custom };
  }
  if (dbProfile?.avatar_kind === "preset" && dbProfile.avatar_seed?.trim()) {
    return { kind: "preset", seed: dbProfile.avatar_seed.trim() };
  }
  if (dbProfile?.avatar_kind === "custom" && dbProfile.avatar_custom?.trim()) {
    try {
      const parsed = JSON.parse(dbProfile.avatar_custom) as unknown;
      const p = normalizeCharacterParts(parsed, uid);
      if (p) return { kind: "custom", parts: p };
    } catch {
      /* ignore */
    }
  }
  if (user) {
    const fromMeta = profileAvatarFromMetadata(
      user.user_metadata as Record<string, unknown> | undefined,
      uid,
    );
    if (fromMeta) return fromMeta;
    return null;
  }
  return readProfileAvatar();
}

export function profileAvatarFromDbOnly(record: AppProfile | null): ProfileAvatar | null {
  if (!record) return null;
  return resolveProfileAvatar({ id: record.user_id } as User, record);
}

export { createDefaultCharacterParts, type CharacterPartsV1 };
