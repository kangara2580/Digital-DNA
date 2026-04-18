"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuthSession } from "@/hooks/useAuthSession";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import {
  fetchUserRecentViews,
  replaceUserRecentViews,
  type RecentClipEntrySync,
} from "@/lib/supabaseUserSync";

const MAX_ENTRIES = 100;

export type RecentClipEntry = {
  id: string;
  viewedAt: number;
};

type Ctx = {
  entries: RecentClipEntry[];
  hydrated: boolean;
  count: number;
  recordView: (videoId: string) => void;
  remove: (videoId: string) => void;
  clear: () => void;
};

const RecentClipsContext = createContext<Ctx | null>(null);

export function useRecentClips() {
  const c = useContext(RecentClipsContext);
  if (!c) throw new Error("useRecentClips must be used within RecentClipsProvider");
  return c;
}

export function RecentClipsProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading, supabaseConfigured } = useAuthSession();
  const [entries, setEntries] = useState<RecentClipEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const restoreGuardRef = useRef(false);

  useEffect(() => {
    if (authLoading) {
      setHydrated(false);
      return;
    }

    if (!supabaseConfigured || !user) {
      setEntries([]);
      setHydrated(true);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setEntries([]);
      setHydrated(true);
      return;
    }

    let cancelled = false;
    restoreGuardRef.current = true;

    void (async () => {
      const server = await fetchUserRecentViews(supabase, user.id, MAX_ENTRIES);
      if (!cancelled) {
        setEntries(server);
        setHydrated(true);
      }
      restoreGuardRef.current = false;
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, supabaseConfigured, user]);

  const recordView = useCallback(
    (videoId: string) => {
      if (!videoId || !supabaseConfigured || !user) return;
      setEntries((prev) => {
        const filtered = prev.filter((e) => e.id !== videoId);
        return [
          { id: videoId, viewedAt: Date.now() },
          ...filtered,
        ].slice(0, MAX_ENTRIES);
      });
    },
    [supabaseConfigured, user],
  );

  const remove = useCallback(
    (videoId: string) => {
      if (!supabaseConfigured || !user) return;
      setEntries((prev) => prev.filter((e) => e.id !== videoId));
    },
    [supabaseConfigured, user],
  );

  const clear = useCallback(() => {
    if (!supabaseConfigured || !user) return;
    setEntries([]);
  }, [supabaseConfigured, user]);

  useEffect(() => {
    if (!hydrated || authLoading) return;
    if (restoreGuardRef.current) return;
    if (!supabaseConfigured || !user) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const handle = window.setTimeout(() => {
      void replaceUserRecentViews(
        supabase,
        user.id,
        entries as RecentClipEntrySync[],
      );
    }, 400);
    return () => window.clearTimeout(handle);
  }, [entries, hydrated, authLoading, supabaseConfigured, user]);

  const value = useMemo(
    () => ({
      entries,
      hydrated,
      count: entries.length,
      recordView,
      remove,
      clear,
    }),
    [entries, hydrated, recordView, remove, clear],
  );

  return (
    <RecentClipsContext.Provider value={value}>
      {children}
    </RecentClipsContext.Provider>
  );
}
