"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuthSession } from "@/hooks/useAuthSession";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import {
  parseStudioHistoryData,
  trimStudioHistoryItems,
  type MyStudioHistoryItem,
} from "@/lib/myStudioHistoryStorage";
import {
  STUDIO_HISTORY_BLOB_KEY,
  fetchUserDataBlob,
  upsertUserDataBlob,
} from "@/lib/supabaseUserSync";

type Ctx = {
  items: MyStudioHistoryItem[];
  hydrated: boolean;
  append: (item: Omit<MyStudioHistoryItem, "createdAtIso"> & { createdAtIso?: string }) => void;
};

const StudioHistoryContext = createContext<Ctx | null>(null);

export function useStudioHistory() {
  const c = useContext(StudioHistoryContext);
  if (!c) {
    throw new Error("useStudioHistory must be used within StudioHistoryProvider");
  }
  return c;
}

export function StudioHistoryProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading, supabaseConfigured } = useAuthSession();
  const [items, setItems] = useState<MyStudioHistoryItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (authLoading) {
      setHydrated(false);
      return;
    }
    if (!supabaseConfigured || !user) {
      setItems([]);
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
      const blob = await fetchUserDataBlob(supabase, user.id, STUDIO_HISTORY_BLOB_KEY);
      if (cancelled) return;
      setItems(parseStudioHistoryData(blob));
      setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, supabaseConfigured, user]);

  const append = useCallback(
    (item: Omit<MyStudioHistoryItem, "createdAtIso"> & { createdAtIso?: string }) => {
      const createdAtIso = item.createdAtIso ?? new Date().toISOString();
      const row: MyStudioHistoryItem = {
        jobId: item.jobId,
        videoId: item.videoId,
        outputVideoUrl: item.outputVideoUrl,
        createdAtIso,
        normalizedBackgroundPrompt: item.normalizedBackgroundPrompt,
      };
      setItems((prev) => {
        const withoutDup = prev.filter((x) => x.jobId !== row.jobId);
        const next = trimStudioHistoryItems([row, ...withoutDup]);
        if (supabaseConfigured && user) {
          const supabase = getSupabaseBrowserClient();
          if (supabase) {
            void upsertUserDataBlob(supabase, user.id, STUDIO_HISTORY_BLOB_KEY, next);
          }
        }
        return next;
      });
    },
    [supabaseConfigured, user],
  );

  const value = useMemo(
    () => ({ items, hydrated, append }),
    [items, hydrated, append],
  );

  return (
    <StudioHistoryContext.Provider value={value}>
      {children}
    </StudioHistoryContext.Provider>
  );
}
