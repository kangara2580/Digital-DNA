import { DEMO_FACE_PROFILES } from "@/data/demoFaceProfiles";
import {
  FACE_PROFILE_STORAGE_KEY_V2,
  LEGACY_FACE_STORAGE_KEY,
  parseStoredFaceProfile,
  type StoredFaceProfile,
} from "@/lib/faceProfileStorage";

export type FacePickerOption = {
  id: string;
  label: string;
  src: string;
  aiAngles?: string[];
};

/**
 * `storedProfile !== undefined` 이면 해당 값만 사용(로컬 스토리지 미사용).
 * `undefined`이면 비로그인·구버전 호환용으로 로컬에서 읽습니다.
 */
export function buildFacePickerOptions(
  storedProfile?: StoredFaceProfile | null,
): FacePickerOption[] {
  if (typeof window === "undefined") return [];

  const out: FacePickerOption[] = [];

  try {
    let p: StoredFaceProfile | null = null;
    if (storedProfile !== undefined) {
      p = storedProfile;
    } else {
      let raw = localStorage.getItem(FACE_PROFILE_STORAGE_KEY_V2);
      p = parseStoredFaceProfile(raw);
      if (!p) {
        const legacy = localStorage.getItem(LEGACY_FACE_STORAGE_KEY);
        if (legacy?.startsWith("data:image/")) {
          p = { kind: "ai", source: legacy, generatedAt: Date.now() };
        }
      }
    }
    if (p?.kind === "triple") {
      out.push({
        id: "my-profile-triple",
        label: "내 프로필 (3면 · 정면)",
        src: p.front,
      });
    } else if (p?.kind === "ai") {
      out.push({
        id: "my-profile-ai",
        label: "내 프로필 (AI 3면)",
        src: p.source,
      });
    }
  } catch {
    /* ignore */
  }

  for (const d of DEMO_FACE_PROFILES) {
    out.push({
      id: `demo-${d.id}`,
      label: d.label,
      src: d.src,
    });
  }

  return out;
}
