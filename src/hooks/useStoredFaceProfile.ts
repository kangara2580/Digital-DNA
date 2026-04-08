"use client";

import { useCallback, useEffect, useState } from "react";
import {
  FACE_PROFILE_STORAGE_KEY_V2,
  LEGACY_FACE_STORAGE_KEY,
  parseStoredFaceProfile,
  type StoredFaceProfile,
} from "@/lib/faceProfileStorage";

export type { FaceProfileAi, FaceProfileTriple, StoredFaceProfile } from "@/lib/faceProfileStorage";

export { FACE_PROFILE_STORAGE_KEY_V2 } from "@/lib/faceProfileStorage";

export function useStoredFaceProfile() {
  const [profile, setProfileState] = useState<StoredFaceProfile | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const v2 = localStorage.getItem(FACE_PROFILE_STORAGE_KEY_V2);
      let parsed = parseStoredFaceProfile(v2);
      if (!parsed) {
        const legacy = localStorage.getItem(LEGACY_FACE_STORAGE_KEY);
        if (legacy?.startsWith("data:image/")) {
          parsed = { kind: "ai", source: legacy, generatedAt: Date.now() };
          localStorage.setItem(FACE_PROFILE_STORAGE_KEY_V2, JSON.stringify(parsed));
          localStorage.removeItem(LEGACY_FACE_STORAGE_KEY);
        }
      }
      setProfileState(parsed);
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  const setProfile = useCallback((next: StoredFaceProfile | null) => {
    setProfileState(next);
    try {
      if (next) localStorage.setItem(FACE_PROFILE_STORAGE_KEY_V2, JSON.stringify(next));
      else localStorage.removeItem(FACE_PROFILE_STORAGE_KEY_V2);
      localStorage.removeItem(LEGACY_FACE_STORAGE_KEY);
    } catch {
      /* quota */
    }
  }, []);

  return { profile, setProfile, hydrated };
}

/** 하위 호환 — 예전 export */
export const FACE_PROFILE_STORAGE_KEY = LEGACY_FACE_STORAGE_KEY;
