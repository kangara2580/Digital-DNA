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
import { useAuthSession } from "@/hooks/useAuthSession";
import {
  addFavorite,
  fetchUserFavorites,
  removeAllWishlistForUser,
  removeFavorite,
  type FavoriteRow,
} from "@/lib/supabaseFavorites";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

export type WishlistEntry = {
  id: string;
  savedAt: number;
};

function rowsToWishlistEntries(rows: FavoriteRow[]): WishlistEntry[] {
  return rows
    .filter((r) => r.kind === "wishlist")
    .map((r) => {
      const t = Date.parse(r.created_at);
      return {
        id: r.video_id,
        savedAt: Number.isFinite(t) ? t : Date.now(),
      };
    });
}

type Ctx = {
  entries: WishlistEntry[];
  hydrated: boolean;
  count: number;
  isSaved: (videoId: string) => boolean;
  toggle: (video: FeedVideo) => void;
  remove: (videoId: string) => void;
  clear: () => Promise<void>;
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
  const { user, loading: authLoading, supabaseConfigured } = useAuthSession();
  const [entries, setEntries] = useState<WishlistEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const reloadFromServer = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (!user || !supabase) return;
    const rows = await fetchUserFavorites(supabase, user.id);
    setEntries(rowsToWishlistEntries(rows));
  }, [user]);

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
    void (async () => {
      const rows = await fetchUserFavorites(supabase, user.id);
      if (cancelled) return;
      setEntries(rowsToWishlistEntries(rows));
      setHydrated(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, supabaseConfigured, user]);

  const isSaved = useCallback(
    (videoId: string) => entries.some((e) => e.id === videoId),
    [entries],
  );

  const toggle = useCallback(
    (video: FeedVideo) => {
      if (authLoading) return;
      if (!supabaseConfigured || !user) {
        if (typeof window !== "undefined") {
          window.alert("로그인 후 이용 가능합니다.");
        }
        return;
      }
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;

      const on = entries.some((e) => e.id === video.id);
      if (on) {
        setEntries((prev) => prev.filter((e) => e.id !== video.id));
        void removeFavorite(supabase, user.id, video.id, "wishlist").then(
          (ok) => {
            if (!ok) void reloadFromServer();
          },
        );
      } else {
        const now = Date.now();
        setEntries((prev) => [{ id: video.id, savedAt: now }, ...prev]);
        void addFavorite(supabase, user.id, video.id, "wishlist").then((ok) => {
          if (!ok) void reloadFromServer();
        });
      }
    },
    [authLoading, supabaseConfigured, user, entries, reloadFromServer],
  );

  const remove = useCallback(
    (videoId: string) => {
      if (authLoading) return;
      if (!supabaseConfigured || !user) return;
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;
      setEntries((prev) => prev.filter((e) => e.id !== videoId));
      void removeFavorite(supabase, user.id, videoId, "wishlist").then((ok) => {
        if (!ok) void reloadFromServer();
      });
    },
    [authLoading, supabaseConfigured, user, reloadFromServer],
  );

  const clear = useCallback(async () => {
    if (!supabaseConfigured || !user) {
      setEntries([]);
      return;
    }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setEntries([]);
      return;
    }
    const ok = await removeAllWishlistForUser(supabase, user.id);
    if (ok) setEntries([]);
    else await reloadFromServer();
  }, [supabaseConfigured, user, reloadFromServer]);

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
