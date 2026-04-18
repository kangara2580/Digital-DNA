"use client";

import { useEffect } from "react";
import { useAuthSession } from "@/hooks/useAuthSession";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import {
  STUDIO_HISTORY_BLOB_KEY,
  applyCustomizeDraftsToLocalStorage,
  applyStudioHistoryBlobToLocal,
  fetchUserCustomizeDrafts,
  fetchUserDataBlob,
} from "@/lib/supabaseUserSync";

/** 로그인 시 클라우드에 있는 임시저장·스튜디오 기록을 localStorage 로 내려받습니다. */
export function SupabaseUserBlobHydration() {
  const { user, loading, supabaseConfigured } = useAuthSession();

  useEffect(() => {
    if (loading || !supabaseConfigured || !user) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    let cancelled = false;
    void (async () => {
      const [draftRows, studioBlob] = await Promise.all([
        fetchUserCustomizeDrafts(supabase, user.id),
        fetchUserDataBlob(supabase, user.id, STUDIO_HISTORY_BLOB_KEY),
      ]);
      if (cancelled) return;
      if (draftRows.length > 0) applyCustomizeDraftsToLocalStorage(draftRows);
      if (studioBlob != null) applyStudioHistoryBlobToLocal(studioBlob);
    })();

    return () => {
      cancelled = true;
    };
  }, [loading, supabaseConfigured, user]);

  return null;
}
