import { buildNotionistsAvatarUrl } from "@/data/reelsAvatarPresets";
import type { User } from "@supabase/supabase-js";

const STORAGE_KEY = "reels-market-profile-avatar-v1";
/** 직접 업로드 data URL 상한(대략 1.5MB) — localStorage 안전 여유 */
export const PROFILE_AVATAR_UPLOAD_MAX_CHARS = 1_500_000;

export type ProfileAvatar =
  | { kind: "preset"; seed: string }
  | { kind: "upload"; dataUrl: string };

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
  return v.dataUrl;
}

/**
 * 로컬 저장 → 없으면 Supabase user_metadata.avatar_seed(프리셋만).
 * 업로드 이미지는 서버에 없으므로 로컬 우선.
 */
export function resolveProfileAvatar(user: User | null): ProfileAvatar | null {
  const local = readProfileAvatar();
  if (local) return local;
  const seed = user?.user_metadata?.avatar_seed;
  if (typeof seed === "string" && seed.trim().length > 0) {
    return { kind: "preset", seed: seed.trim() };
  }
  return null;
}
