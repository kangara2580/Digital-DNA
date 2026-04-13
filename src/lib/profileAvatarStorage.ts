import { buildNotionistsAvatarUrl } from "@/data/reelsAvatarPresets";
import {
  buildNotionistsCustomAvatarUrl,
  createDefaultCharacterParts,
  normalizeCharacterParts,
  type CharacterPartsV1,
} from "@/lib/notionistsCharacter";
import type { User } from "@supabase/supabase-js";

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

/**
 * 로컬 저장 → 없으면 Supabase user_metadata(avatar_custom → avatar_seed).
 * 업로드 이미지는 서버에 없으므로 로컬 우선.
 */
export function resolveProfileAvatar(user: User | null): ProfileAvatar | null {
  const local = readProfileAvatar();
  if (local) return local;
  const meta = user?.user_metadata as Record<string, unknown> | undefined;
  const customRaw = meta?.avatar_custom;
  if (typeof customRaw === "string" && customRaw.trim()) {
    try {
      const parsed = JSON.parse(customRaw) as unknown;
      const p = normalizeCharacterParts(
        parsed,
        typeof user?.id === "string" ? user.id : "reels-market",
      );
      if (p) return { kind: "custom", parts: p };
    } catch {
      /* ignore */
    }
  }
  const seed = meta?.avatar_seed;
  if (typeof seed === "string" && seed.trim().length > 0) {
    return { kind: "preset", seed: seed.trim() };
  }
  return null;
}

export { createDefaultCharacterParts, type CharacterPartsV1 };
