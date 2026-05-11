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
  void storedProfile;
  const first = DEMO_FACE_PROFILES[0];
  if (!first) return [];
  return [{ id: first.id, label: first.label, src: first.src }];
}
