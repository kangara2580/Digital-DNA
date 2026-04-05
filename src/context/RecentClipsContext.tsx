"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

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
  const [entries, setEntries] = useState<RecentClipEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setEntries(loadEntries());
    setHydrated(true);
  }, []);

  const recordView = useCallback((videoId: string) => {
    if (!videoId) return;
    setEntries((prev) => {
      const filtered = prev.filter((e) => e.id !== videoId);
      const next = [
        { id: videoId, viewedAt: Date.now() },
        ...filtered,
      ].slice(0, MAX_ENTRIES);
      persist(next);
      return next;
    });
  }, []);

  const remove = useCallback((videoId: string) => {
    setEntries((prev) => {
      const next = prev.filter((e) => e.id !== videoId);
      persist(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setEntries([]);
    persist([]);
  }, []);

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
