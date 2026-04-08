import { DEMO_FACE_PROFILES } from "@/data/demoFaceProfiles";
import {
  FACE_PROFILE_STORAGE_KEY_V2,
  LEGACY_FACE_STORAGE_KEY,
  parseStoredFaceProfile,
} from "@/lib/faceProfileStorage";

export type FacePickerOption = {
  id: string;
  label: string;
  src: string;
};

/** 브라우저에서만 호출 */
export function buildFacePickerOptions(): FacePickerOption[] {
  if (typeof window === "undefined") return [];

  const out: FacePickerOption[] = [];

  try {
    let raw = localStorage.getItem(FACE_PROFILE_STORAGE_KEY_V2);
    let p = parseStoredFaceProfile(raw);
    if (!p) {
      const legacy = localStorage.getItem(LEGACY_FACE_STORAGE_KEY);
      if (legacy?.startsWith("data:image/")) {
        p = { kind: "ai", source: legacy, generatedAt: Date.now() };
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
