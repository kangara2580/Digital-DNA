import type { StoredFaceProfile } from "@/lib/faceProfileStorage";
import { DEMO_FACE_PROFILES } from "@/data/demoFaceProfiles";

export type FacePickerOption = {
  id: string;
  label: string;
  src: string;
  aiAngles?: string[];
};

/**
 * 기본 데모 프로필 1개를 항상 제공합니다.
 * 직접 업로드한 아바타(`custom-*`)는 스튜디오에서 `setFaceOptions`로 이 배열 뒤에 붙습니다.
 * `storedProfile`은 이후 마이페이지 연동 시 확장용으로 둡니다.
 */
export function buildFacePickerOptions(
  storedProfile?: StoredFaceProfile | null,
): FacePickerOption[] {
  const options: FacePickerOption[] = [];

  if (storedProfile?.kind === "ai" && storedProfile.source.trim()) {
    options.push({
      id: "profile-saved-ai",
      label: "내 프로필",
      src: storedProfile.source.trim(),
    });
  } else if (storedProfile?.kind === "triple") {
    const front = storedProfile.front.trim();
    if (front) {
      options.push({
        id: "profile-saved-triple",
        label: "내 프로필 (3면)",
        src: front,
        aiAngles: [storedProfile.left, front, storedProfile.right].filter(Boolean),
      });
    }
  }

  for (const demo of DEMO_FACE_PROFILES) {
    options.push({ id: demo.id, label: demo.label, src: demo.src });
  }

  return options;
}
