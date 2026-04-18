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

const STORAGE_KEY = "digital-dna-recent-v1";
const MAX_ENTRIES = 100;

export type RecentClipEntry = {
  id: string;
  viewedAt: number;
};

function parseStored(raw: string | null): RecentClipEntry[] {
  if (!raw) return [];
  try {
    const p = JSON.parse(raw) as unknown;
    if (!Array.isArray(p)) return [];
    return p
      .filter(
        (x): x is RecentClipEntry =>
          x != null &&
          typeof x === "object" &&
          typeof (x as RecentClipEntry).id === "string" &&
          typeof (x as RecentClipEntry).viewedAt === "number",
      )
      .map((x) => ({ id: x.id, viewedAt: x.viewedAt }));
  } catch {
    return [];
  }
}

function loadEntries(): RecentClipEntry[] {
  if (typeof window === "undefined") return [];
  return parseStored(localStorage.getItem(STORAGE_KEY));
}

function persist(entries: RecentClipEntry[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    /* quota / private mode */
  }
}

function mergeRecent(a: RecentClipEntry[], b: RecentClipEntry[]): RecentClipEntry[] {
  const map = new Map<string, number>();
  for (const e of a) map.set(e.id, e.viewedAt);
  for (const e of b) {
    map.set(e.id, Math.max(map.get(e.id) ?? 0, e.viewedAt));
  }
  return [...map.entries()]
    .map(([id, viewedAt]) => ({ id, viewedAt }))
    .sort((x, y) => y.viewedAt - x.viewedAt)
    .slice(0, MAX_ENTRIES);
}

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

    let cancelled = false;
    restoreGuardRef.current = true;

    void (async () => {
      if (!supabaseConfigured) {
        if (!cancelled) {
          setEntries(loadEntries());
          setHydrated(true);
        }
        restoreGuardRef.current = false;
        return;
      }

      const supabase = getSupabaseBrowserClient();
      if (!user || !supabase) {
        if (!cancelled) {
          setEntries(loadEntries());
          setHydrated(true);
        }
        restoreGuardRef.current = false;
        return;
      }

      const server = await fetchUserRecentViews(supabase, user.id, MAX_ENTRIES);
      if (cancelled) return;
      const guest = loadEntries();
      const merged = mergeRecent(server, guest);
      if (guest.length > 0) {
        persist([]);
        await replaceUserRecentViews(
          supabase,
          user.id,
          merged as RecentClipEntrySync[],
        );
      }
      if (!cancelled) {
        setEntries(merged);
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
      if (!videoId) return;
      setEntries((prev) => {
        const filtered = prev.filter((e) => e.id !== videoId);
        const next = [
          { id: videoId, viewedAt: Date.now() },
          ...filtered,
        ].slice(0, MAX_ENTRIES);
        if (!supabaseConfigured || !user) persist(next);
        return next;
      });
    },
    [supabaseConfigured, user],
  );

  const remove = useCallback(
    (videoId: string) => {
      setEntries((prev) => {
        const next = prev.filter((e) => e.id !== videoId);
        if (!supabaseConfigured || !user) persist(next);
        return next;
      });
    },
    [supabaseConfigured, user],
  );

  const clear = useCallback(() => {
    setEntries([]);
    if (!supabaseConfigured || !user) persist([]);
  }, [supabaseConfigured, user]);

  useEffect(() => {
    if (!hydrated || authLoading) return;
    if (restoreGuardRef.current) return;
    if (!supabaseConfigured || !user) {
      persist(entries);
      return;
    }
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
