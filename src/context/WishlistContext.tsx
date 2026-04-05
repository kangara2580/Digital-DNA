"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { FeedVideo } from "@/data/videos";

const STORAGE_KEY = "digital-dna-wishlist-v1";

export type WishlistEntry = {
  id: string;
  savedAt: number;
};

function parseStored(raw: string | null): WishlistEntry[] {
  if (!raw) return [];
  try {
    const p = JSON.parse(raw) as unknown;
    if (!Array.isArray(p)) return [];
    return p
      .filter(
        (x): x is WishlistEntry =>
          x != null &&
          typeof x === "object" &&
          typeof (x as WishlistEntry).id === "string" &&
          typeof (x as WishlistEntry).savedAt === "number",
      )
      .map((x) => ({ id: x.id, savedAt: x.savedAt }));
  } catch {
    return [];
  }
}

function loadEntries(): WishlistEntry[] {
  if (typeof window === "undefined") return [];
  return parseStored(localStorage.getItem(STORAGE_KEY));
}

function persist(entries: WishlistEntry[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    /* quota / private mode */
  }
}

type Ctx = {
  entries: WishlistEntry[];
  hydrated: boolean;
  count: number;
  isSaved: (videoId: string) => boolean;
  toggle: (video: FeedVideo) => void;
  remove: (videoId: string) => void;
  clear: () => void;
};

const WishlistContext = createContext<Ctx | null>(null);

export function useWishlist() {
  const c = useContext(WishlistContext);
  if (!c) throw new Error("useWishlist must be used within WishlistProvider");
  return c;
}

export function useWishlistOptional() {
  return useContext(WishlistContext);
}

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<WishlistEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setEntries(loadEntries());
    setHydrated(true);
  }, []);

  const isSaved = useCallback(
    (videoId: string) => entries.some((e) => e.id === videoId),
    [entries],
  );

  const toggle = useCallback((video: FeedVideo) => {
    setEntries((prev) => {
      const i = prev.findIndex((e) => e.id === video.id);
      const next =
        i >= 0
          ? prev.filter((_, j) => j !== i)
          : [...prev, { id: video.id, savedAt: Date.now() }];
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
      isSaved,
      toggle,
      remove,
      clear,
    }),
    [entries, hydrated, isSaved, toggle, remove, clear],
  );

  return (
    <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
  );
}
