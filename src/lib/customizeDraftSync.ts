import type { SupabaseClient } from "@supabase/supabase-js";
import {
  dispatchCustomizeDraftsUpdated,
  getCustomizeDraftStorageKey,
} from "@/lib/customizeDraftStorage";
import {
  fetchCustomizeDraftByVideoId,
  upsertCustomizeDraftRemote,
} from "@/lib/supabaseUserSync";

export type CustomizeDraftBlob = Record<string, unknown> & {
  savedAt?: string;
};

function readSavedAt(blob: CustomizeDraftBlob): number {
  const raw = blob.savedAt;
  if (typeof raw !== "string") return 0;
  const t = Date.parse(raw);
  return Number.isFinite(t) ? t : 0;
}

export function readLocalCustomizeDraft(videoId: string): CustomizeDraftBlob | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(getCustomizeDraftStorageKey(videoId));
    if (!raw) return null;
    const j = JSON.parse(raw) as unknown;
    if (!j || typeof j !== "object") return null;
    return j as CustomizeDraftBlob;
  } catch {
    return null;
  }
}

export function writeLocalCustomizeDraft(
  videoId: string,
  blob: CustomizeDraftBlob,
): void {
  if (typeof window === "undefined") return;
  try {
    const withTs: CustomizeDraftBlob = {
      ...blob,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(
      getCustomizeDraftStorageKey(videoId),
      JSON.stringify(withTs),
    );
  } catch {
    /* quota */
  }
}

export async function fetchRemoteCustomizeDraft(
  supabase: SupabaseClient,
  userId: string,
  videoId: string,
): Promise<CustomizeDraftBlob | null> {
  const row = await fetchCustomizeDraftByVideoId(supabase, userId, videoId);
  if (!row?.payload || typeof row.payload !== "object") return null;
  const blob = row.payload as CustomizeDraftBlob;
  if (row.updated_at) {
    blob.savedAt = row.updated_at;
  }
  return blob;
}

export function pickNewerCustomizeDraft(
  local: CustomizeDraftBlob | null,
  remote: CustomizeDraftBlob | null,
): CustomizeDraftBlob | null {
  if (!local && !remote) return null;
  if (!local) return remote;
  if (!remote) return local;
  return readSavedAt(remote) >= readSavedAt(local) ? remote : local;
}

export async function persistCustomizeDraft(
  supabase: SupabaseClient | null,
  userId: string | null,
  videoId: string,
  blob: CustomizeDraftBlob,
): Promise<{ localOk: boolean; remoteOk: boolean }> {
  writeLocalCustomizeDraft(videoId, blob);
  dispatchCustomizeDraftsUpdated();

  if (!supabase || !userId) {
    return { localOk: true, remoteOk: false };
  }

  const remoteOk = await upsertCustomizeDraftRemote(
    supabase,
    userId,
    videoId,
    { ...blob, savedAt: new Date().toISOString() },
  );
  if (remoteOk) {
    dispatchCustomizeDraftsUpdated();
  }
  return { localOk: true, remoteOk };
}
