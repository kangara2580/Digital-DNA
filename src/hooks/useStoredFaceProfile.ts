"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { useAuthSession } from "@/hooks/useAuthSession";
import {
  parseStoredFaceProfileJson,
  type StoredFaceProfile,
} from "@/lib/faceProfileStorage";
import {
  fetchUserProfile,
  upsertUserProfile,
} from "@/lib/supabaseProfiles";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

export type { FaceProfileAi, FaceProfileTriple, StoredFaceProfile } from "@/lib/faceProfileStorage";

export { FACE_PROFILE_STORAGE_KEY_V2 } from "@/lib/faceProfileStorage";

export function useStoredFaceProfile() {
  const { user, loading: authLoading, supabaseConfigured } = useAuthSession();
  const [profile, setProfileState] = useState<StoredFaceProfile | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (authLoading) {
      setHydrated(false);
      return;
    }

    if (!supabaseConfigured || !user) {
      setProfileState(null);
      setHydrated(true);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setHydrated(true);
      return;
    }

    let cancelled = false;
    void (async () => {
      const row = await fetchUserProfile(supabase, user.id);
      if (cancelled) return;
      const parsed = parseStoredFaceProfileJson(row?.face_profile_json ?? null);
      setProfileState(parsed);
      setHydrated(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, supabaseConfigured, user]);

  const setProfile = useCallback(
    async (next: StoredFaceProfile | null) => {
      setProfileState(next);
      if (!user || !supabaseConfigured) return;
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;
      await upsertUserProfile(supabase, user.id, {
        face_profile_json: next,
      });
    },
    [user, supabaseConfigured],
  );

  return { profile, setProfile, hydrated };
}

/** 하위 호환 — 예전 export */
export const FACE_PROFILE_STORAGE_KEY = "reels-mypage-face-dataurl";
