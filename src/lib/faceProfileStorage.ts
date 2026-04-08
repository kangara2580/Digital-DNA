/** 마이페이지 프로필 — localStorage 스키마 (클라이언트 전용 읽기/쓰기) */

/** @deprecated 마이그레이션용 */
export const LEGACY_FACE_STORAGE_KEY = "reels-mypage-face-dataurl";
export const FACE_PROFILE_STORAGE_KEY_V2 = "reels-mypage-face-profile-v2";

export type FaceProfileTriple = {
  kind: "triple";
  front: string;
  left: string;
  right: string;
};

export type FaceProfileAi = {
  kind: "ai";
  source: string;
  generatedAt: number;
};

export type StoredFaceProfile = FaceProfileTriple | FaceProfileAi;

export function parseStoredFaceProfile(raw: string | null): StoredFaceProfile | null {
  if (!raw) return null;
  try {
    const j = JSON.parse(raw) as unknown;
    if (!j || typeof j !== "object") return null;
    const o = j as Record<string, unknown>;
    if (
      o.kind === "triple" &&
      typeof o.front === "string" &&
      typeof o.left === "string" &&
      typeof o.right === "string"
    ) {
      return { kind: "triple", front: o.front, left: o.left, right: o.right };
    }
    if (o.kind === "ai" && typeof o.source === "string" && typeof o.generatedAt === "number") {
      return { kind: "ai", source: o.source, generatedAt: o.generatedAt };
    }
  } catch {
    return null;
  }
  return null;
}
